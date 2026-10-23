import { redirect } from "next/navigation";

/** Заказ по фото — форма «Хочу похожую» с загрузкой референса находится на /na-zakaz. */
export default function OrderByPhotoPage() {
  redirect("/na-zakaz");
}
