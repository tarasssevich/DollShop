-- DollShop Atomic Reservation, Order and Status Functions (Step 3.4)

CREATE OR REPLACE FUNCTION reserve_product(
  p_product_id uuid,
  p_token_hash text,
  p_ttl_minutes integer DEFAULT 15
)
RETURNS TABLE (
  status text,
  reserved_until timestamp with time zone,
  error_code text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reserved_until timestamp with time zone;
  v_current_status product_status;
  v_current_reserved_until timestamp with time zone;
  v_existing_token text;
BEGIN
  SELECT r.token_hash, p.reserved_until
    INTO v_existing_token, v_current_reserved_until
    FROM reservations r
    JOIN products p ON p.id = r.product_id
   WHERE r.product_id = p_product_id;

  IF v_existing_token = p_token_hash AND v_current_reserved_until >= now() THEN
    RETURN QUERY SELECT 'SUCCESS'::text, v_current_reserved_until, NULL::text;
    RETURN;
  END IF;

  UPDATE products
     SET status = 'reserved',
         reserved_until = now() + (p_ttl_minutes || ' minutes')::interval
   WHERE id = p_product_id
     AND (status = 'available'
          OR (status = 'reserved' AND reserved_until IS NOT NULL AND reserved_until < now()))
  RETURNING products.reserved_until INTO v_reserved_until;

  IF FOUND THEN
    INSERT INTO reservations (product_id, token_hash, expires_at, created_at)
    VALUES (p_product_id, p_token_hash, v_reserved_until, now())
    ON CONFLICT (product_id) DO UPDATE
      SET token_hash = EXCLUDED.token_hash,
          expires_at = EXCLUDED.expires_at,
          created_at = now();

    RETURN QUERY SELECT 'SUCCESS'::text, v_reserved_until, NULL::text;
    RETURN;
  ELSE
    SELECT products.status, products.reserved_until
      INTO v_current_status, v_current_reserved_until
      FROM products
     WHERE id = p_product_id;

    IF NOT FOUND THEN
      RETURN QUERY SELECT 'ERROR'::text, NULL::timestamp with time zone, 'NOT_FOUND'::text;
    ELSIF v_current_status = 'sold' THEN
      RETURN QUERY SELECT 'ERROR'::text, NULL::timestamp with time zone, 'SOLD'::text;
    ELSIF v_current_status = 'reserved' THEN
      RETURN QUERY SELECT 'ERROR'::text, v_current_reserved_until, 'ALREADY_RESERVED'::text;
    ELSIF v_current_status = 'draft' THEN
      RETURN QUERY SELECT 'ERROR'::text, NULL::timestamp with time zone, 'DRAFT_NOT_AVAILABLE'::text;
    ELSE
      RETURN QUERY SELECT 'ERROR'::text, NULL::timestamp with time zone, 'UNAVAILABLE'::text;
    END IF;
    RETURN;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION release_reservation(
  p_product_id uuid,
  p_token_hash text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM reservations
   WHERE product_id = p_product_id
     AND token_hash = p_token_hash;

  IF FOUND THEN
    UPDATE products
       SET status = 'available',
           reserved_until = NULL
     WHERE id = p_product_id
       AND status = 'reserved';
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION create_order(
  p_product_id uuid,
  p_token_hash text,
  p_customer_name text,
  p_customer_phone text,
  p_customer_contact text,
  p_contact_channel contact_channel,
  p_delivery_city text,
  p_delivery_branch text,
  p_comment text,
  p_payment_method payment_method,
  p_pd_consent_at timestamp with time zone,
  p_hold_hours integer DEFAULT 24
)
RETURNS TABLE (
  order_id uuid,
  order_number integer,
  public_token uuid,
  total_amount numeric,
  error_code text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_res_expires_at timestamp with time zone;
  v_price numeric(10, 2);
  v_status product_status;
  v_reserved_until timestamp with time zone;
  v_order_id uuid;
  v_order_number integer;
  v_public_token uuid;
  v_new_reserved_until timestamp with time zone;
BEGIN
  SELECT r.expires_at, p.price, p.status, p.reserved_until
    INTO v_res_expires_at, v_price, v_status, v_reserved_until
    FROM reservations r
    JOIN products p ON p.id = r.product_id
   WHERE r.product_id = p_product_id
     AND r.token_hash = p_token_hash
     FOR UPDATE OF p;

  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::uuid, NULL::integer, NULL::uuid, NULL::numeric, 'INVALID_RESERVATION'::text;
    RETURN;
  END IF;

  IF v_status <> 'reserved' OR (v_reserved_until IS NOT NULL AND v_reserved_until < now()) THEN
    RETURN QUERY SELECT NULL::uuid, NULL::integer, NULL::uuid, NULL::numeric, 'RESERVATION_EXPIRED'::text;
    RETURN;
  END IF;

  v_new_reserved_until := now() + (p_hold_hours || ' hours')::interval;

  UPDATE products
     SET reserved_until = v_new_reserved_until
   WHERE id = p_product_id;

  UPDATE reservations
     SET expires_at = v_new_reserved_until
   WHERE product_id = p_product_id;

  INSERT INTO orders (
    customer_name,
    customer_phone,
    customer_contact,
    contact_channel,
    delivery_city,
    delivery_branch,
    comment,
    total_amount,
    status,
    payment_method,
    pd_consent_at
  ) VALUES (
    p_customer_name,
    p_customer_phone,
    p_customer_contact,
    p_contact_channel,
    p_delivery_city,
    p_delivery_branch,
    p_comment,
    v_price,
    'pending',
    p_payment_method,
    p_pd_consent_at
  )
  RETURNING id, orders.order_number, orders.public_token
     INTO v_order_id, v_order_number, v_public_token;

  INSERT INTO order_items (order_id, product_id, price_at_purchase)
  VALUES (v_order_id, p_product_id, v_price);

  RETURN QUERY SELECT v_order_id, v_order_number, v_public_token, v_price, NULL::text;
  RETURN;
END;
$$;

CREATE OR REPLACE FUNCTION set_order_status(
  p_order_id uuid,
  p_new_status order_status
)
RETURNS TABLE (
  order_id uuid,
  status order_status,
  product_id uuid,
  product_status product_status,
  product_slug text,
  error_code text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_product_id uuid;
  v_product_slug text;
  v_old_status order_status;
  v_new_prod_status product_status;
BEGIN
  SELECT oi.product_id, p.slug, o.status
    INTO v_product_id, v_product_slug, v_old_status
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    JOIN products p ON p.id = oi.product_id
   WHERE o.id = p_order_id
     FOR UPDATE OF o, p;

  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::uuid, NULL::order_status, NULL::uuid, NULL::product_status, NULL::text, 'ORDER_NOT_FOUND'::text;
    RETURN;
  END IF;

  UPDATE orders
     SET status = p_new_status
   WHERE id = p_order_id;

  IF p_new_status IN ('paid', 'completed') THEN
    UPDATE products
       SET status = 'sold',
           reserved_until = NULL
     WHERE id = v_product_id;

    DELETE FROM reservations WHERE reservations.product_id = v_product_id;
    v_new_prod_status := 'sold';

  ELSIF p_new_status = 'cancelled' THEN
    UPDATE products
       SET status = 'available',
           reserved_until = NULL
     WHERE id = v_product_id;

    DELETE FROM reservations WHERE reservations.product_id = v_product_id;
    v_new_prod_status := 'available';

  ELSE
    SELECT products.status INTO v_new_prod_status FROM products WHERE id = v_product_id;
  END IF;

  RETURN QUERY SELECT p_order_id, p_new_status, v_product_id, v_new_prod_status, v_product_slug, NULL::text;
  RETURN;
END;
$$;

CREATE OR REPLACE FUNCTION expire_reservations()
RETURNS TABLE (
  product_id uuid,
  slug text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH expired_candidates AS (
    SELECT p.id, p.slug
      FROM products p
      LEFT JOIN order_items oi ON oi.product_id = p.id
      LEFT JOIN orders o ON o.id = oi.order_id AND o.status = 'pending'
     WHERE p.status = 'reserved'
       AND p.reserved_until IS NOT NULL
       AND p.reserved_until < now()
       AND o.id IS NULL
     FOR UPDATE OF p SKIP LOCKED
  ),
  updated AS (
    UPDATE products p
       SET status = 'available',
           reserved_until = NULL
      FROM expired_candidates ec
     WHERE p.id = ec.id
    RETURNING p.id, p.slug
  ),
  cleaned_res AS (
    DELETE FROM reservations r
     USING updated u
     WHERE r.product_id = u.id
    RETURNING r.product_id
  )
  SELECT updated.id, updated.slug FROM updated;
END;
$$;

ALTER FUNCTION reserve_product(uuid, text, integer) OWNER TO app_owner;
ALTER FUNCTION release_reservation(uuid, text) OWNER TO app_owner;
ALTER FUNCTION create_order(uuid, text, text, text, text, contact_channel, text, text, text, payment_method, timestamp with time zone, integer) OWNER TO app_owner;
ALTER FUNCTION set_order_status(uuid, order_status) OWNER TO app_owner;
ALTER FUNCTION expire_reservations() OWNER TO app_owner;

GRANT EXECUTE ON FUNCTION reserve_product(uuid, text, integer) TO app_user;
GRANT EXECUTE ON FUNCTION release_reservation(uuid, text) TO app_user;
GRANT EXECUTE ON FUNCTION create_order(uuid, text, text, text, text, contact_channel, text, text, text, payment_method, timestamp with time zone, integer) TO app_user;
GRANT EXECUTE ON FUNCTION set_order_status(uuid, order_status) TO app_user;
GRANT EXECUTE ON FUNCTION expire_reservations() TO app_user;
