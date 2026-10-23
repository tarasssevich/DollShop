import { notFound } from "next/navigation";
import { getDollById } from "@/lib/data/catalog";
import { ProductForm } from "@/components/admin/ProductForm";

interface AdminDollEditPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: AdminDollEditPageProps) {
  const { id } = await params;
  const doll = await getDollById(id, { includeDrafts: true });
  return {
    title: doll ? `Редактирование: ${doll.name} · Панель мастера` : "Кукла не найдена",
  };
}

export default async function AdminDollEditPage({ params }: AdminDollEditPageProps) {
  const { id } = await params;
  const doll = await getDollById(id, { includeDrafts: true });

  if (!doll) {
    notFound();
  }

  return <ProductForm initialDoll={doll} />;
}
