import { ProductForm } from "@/components/admin/ProductForm";

export const metadata = {
  title: "Новая кукла · Панель мастера",
};

export default function AdminNewDollPage() {
  return <ProductForm initialDoll={null} />;
}
