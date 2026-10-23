export type DollStatus =
  | "available"
  | "reserved"
  | "sold"
  | "in_progress";

export type DollCategory =
  | "fairies"
  | "angels"
  | "miniatures"
  | "seasonal";

export interface DollImage {
  id: string;
  url: string;
  blurDataUrl: string;
  alt: string;
  width: number;
  height: number;
  isCover?: boolean;
}

export interface DollDetails {
  wingMaterial: string;
  hairMaterial: string;
  dressMaterial: string;
  bouquetDetails: string;
  hangingLoopIncluded: boolean;
  boxIncluded: boolean;
  certificateIncluded: boolean;
}

export interface Doll {
  id: string;
  slug: string;
  name: string;
  category: DollCategory;
  collection?: string;
  priceByn: number;
  status: DollStatus;
  reservedUntil: string | null;
  heightCm: number;
  year: number;
  materials: string[];
  description: string;
  story: string;
  details: DollDetails;
  images: DollImage[];
  isFeatured?: boolean;
  isDraft?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type DeliveryMethod = "europost" | "courier";

export type OrderStatus =
  | "pending"
  | "reserved"
  | "paid"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface OrderCustomer {
  name: string;
  phone: string;
  email?: string;
  comment?: string;
}

export interface OrderDelivery {
  method: DeliveryMethod;
  city: string;
  europostOfficeId?: string;
  courierAddress?: string;
  costByn: number;
}

export interface Order {
  id: string;
  dollId: string;
  status: OrderStatus;
  customer: OrderCustomer;
  delivery: OrderDelivery;
  subtotalByn: number;
  totalByn: number;
  reservedUntil?: string;
  createdAt: string;
}
