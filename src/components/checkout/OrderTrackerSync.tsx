"use client";

import * as React from "react";
import { saveLocalOrder, type ClientStoredOrder } from "@/lib/data/recent-orders";

interface OrderTrackerSyncProps {
  order: ClientStoredOrder;
}

export function OrderTrackerSync({ order }: OrderTrackerSyncProps) {
  React.useEffect(() => {
    saveLocalOrder(order);
  }, [order]);

  return null;
}
