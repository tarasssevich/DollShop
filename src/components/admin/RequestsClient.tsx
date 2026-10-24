"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MessageSquareHeart,
  Phone,
  Send,
  MessageCircle,
  Copy,
  Check,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Plus,
  Gift,
  X,
  Download,
  ImageOff,
  Trash2,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Link2,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatBelarusPhone } from "@/lib/utils/phone";
import {
  updateAdminRequestStatusAction,
  updateAdminRequestPhotosAction,
  getAdminRequestsAction,
  getAdminDollByIdAction,
  getAvailableDollsForRequestAction,
  attachExistingDollToRequestAction,
  markResponseDollSoldAction,
  type AdminCustomRequestItem,
  type AvailableDollOption,
} from "@/actions/admin/requests";
import { buildCustomOrderNotificationText } from "@/lib/notify/templates";
import { detachResponseDollAction } from "@/actions/admin/products";
import { ProductForm } from "@/components/admin/ProductForm";
import type { Doll } from "@/types/domain";

interface RequestsClientProps {
  initialRequests: AdminCustomRequestItem[];
}

export function RequestsClient({ initialRequests }: RequestsClientProps) {
  const [requests, setRequests] = React.useState<AdminCustomRequestItem[]>(initialRequests);
  const [filter, setFilter] = React.useState<
    "all" | "new" | "in_discussion" | "accepted" | "declined"
  >("all");
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [copiedNotifyId, setCopiedNotifyId] = React.useState<string | null>(null);

  // Состояние модального окна создания/редактирования куклы-ответа
  const [activeDollFormRequestId, setActiveDollFormRequestId] = React.useState<string | null>(null);
  const [editingDoll, setEditingDoll] = React.useState<Doll | null>(null);
  const [loadingDollId, setLoadingDollId] = React.useState<string | null>(null);

  // Состояние модального окна выбора существующей куклы из каталога
  const [pickerRequestId, setPickerRequestId] = React.useState<string | null>(null);
  const [availableDolls, setAvailableDolls] = React.useState<AvailableDollOption[]>([]);
  const [isLoadingAvailableDolls, setIsLoadingAvailableDolls] = React.useState(false);
  const [dollSearchTerm, setDollSearchTerm] = React.useState("");
  const [attachingDollId, setAttachingDollId] = React.useState<string | null>(null);
  const [copiedLinkSlug, setCopiedLinkSlug] = React.useState<string | null>(null);

  // Lightbox для полноэкранного просмотра фото-референсов
  const [photoViewerState, setPhotoViewerState] = React.useState<{
    isOpen: boolean;
    urls: string[];
    index: number;
    title: string;
    requestId: string;
  } | null>(null);

  // Набор битых URL изображений (отдающих 404 на сервере)
  const [brokenUrls, setBrokenUrls] = React.useState<Set<string>>(new Set());

  // Состояние загрузки фото для конкретной заявки
  const [uploadingRequestId, setUploadingRequestId] = React.useState<string | null>(null);

  const handleUploadPhotoForRequest = async (
    requestId: string,
    files: FileList | null
  ) => {
    if (!files || files.length === 0) return;
    setUploadingRequestId(requestId);
    try {
      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append("files", f));
      const res = await fetch("/api/request-photo", {
        method: "POST",
        body: fd,
      });
      const data = (await res.json().catch(() => ({}))) as {
        urls?: string[];
        error?: string;
      };

      if (!res.ok || !data.urls || data.urls.length === 0) {
        toast.error(data.error || "Не удалось загрузить фото");
        return;
      }

      const req = requests.find((r) => r.id === requestId);
      if (!req) return;

      const nextUrls = [...req.referencePhotoUrls, ...data.urls];
      const updateRes = await updateAdminRequestPhotosAction({
        requestId,
        photoUrls: nextUrls,
      });

      if (updateRes.success) {
        setRequests((prev) =>
          prev.map((r) =>
            r.id === requestId ? { ...r, referencePhotoUrls: nextUrls } : r
          )
        );
        toast.success("Фото-референс успешно сохранен!");
      } else {
        toast.error(updateRes.error || "Ошибка сохранения фото");
      }
    } catch {
      toast.error("Произошла ошибка при загрузке фото");
    } finally {
      setUploadingRequestId(null);
    }
  };

  const handleRemovePhotoFromRequest = async (
    requestId: string,
    urlToRemove: string
  ) => {
    const req = requests.find((r) => r.id === requestId);
    if (!req) return;

    const nextUrls = req.referencePhotoUrls.filter((u) => u !== urlToRemove);
    try {
      const updateRes = await updateAdminRequestPhotosAction({
        requestId,
        photoUrls: nextUrls,
      });

      if (updateRes.success) {
        setRequests((prev) =>
          prev.map((r) =>
            r.id === requestId ? { ...r, referencePhotoUrls: nextUrls } : r
          )
        );
        if (photoViewerState && photoViewerState.requestId === requestId) {
          if (nextUrls.length === 0) {
            setPhotoViewerState(null);
          } else {
            setPhotoViewerState({
              ...photoViewerState,
              urls: nextUrls,
              index: Math.min(photoViewerState.index, nextUrls.length - 1),
            });
          }
        }
        toast.success("Фото удалено из заявки");
      } else {
        toast.error(updateRes.error || "Ошибка при удалении фото");
      }
    } catch {
      toast.error("Не удалось удалить фото");
    }
  };

  const filteredRequests = React.useMemo(() => {
    if (filter === "all") return requests;
    return requests.filter((r) => r.status === filter);
  }, [requests, filter]);

  const filteredAvailableDolls = React.useMemo(() => {
    if (!dollSearchTerm.trim()) return availableDolls;
    const term = dollSearchTerm.toLowerCase();
    return availableDolls.filter(
      (d) =>
        d.title.toLowerCase().includes(term) ||
        (d.collection && d.collection.toLowerCase().includes(term))
    );
  }, [availableDolls, dollSearchTerm]);

  const activePickerRequest = React.useMemo(() => {
    if (!pickerRequestId) return null;
    return requests.find((r) => r.id === pickerRequestId) || null;
  }, [requests, pickerRequestId]);

  const activeRequest = React.useMemo(() => {
    if (!activeDollFormRequestId) return null;
    return requests.find((r) => r.id === activeDollFormRequestId) || null;
  }, [requests, activeDollFormRequestId]);

  const handleStatusChange = async (
    requestId: string,
    newStatus: "new" | "in_discussion" | "accepted" | "declined"
  ) => {
    try {
      const res = await updateAdminRequestStatusAction({ requestId, status: newStatus });
      if (res.success) {
        setRequests((prev) =>
          prev.map((r) => (r.id === requestId ? { ...r, status: newStatus } : r))
        );
        toast.success(
          newStatus === "accepted"
            ? "Заявка принята в работу! Теперь вы можете подготовить куклу-ответ."
            : newStatus === "in_discussion"
            ? "Заявка переведена в обсуждение."
            : newStatus === "declined"
            ? "Заявка отклонена."
            : "Статус заявки обновлен."
        );
      } else {
        toast.error(res.error || "Не удалось изменить статус");
      }
    } catch {
      toast.error("Ошибка при обновлении статуса");
    }
  };

  const handleCopyReplyTemplate = (req: AdminCustomRequestItem) => {
    const firstName = req.customerName.split(" ")[0] || req.customerName;
    const dollTitle = req.referenceDoll?.title;

    let text = `Здравствуйте, ${firstName}! Спасибо за ваш интерес к моим куколкам ручной работы. `;
    if (dollTitle) {
      text += `Вы интересовались куколкой «${dollTitle}». `;
    }
    text += `С удовольствием расскажу о деталях, сроках изготовления (обычно 5-7 дней) и стоимости. Буду рада обсудить ваши пожелания!`;

    navigator.clipboard.writeText(text);
    setCopiedId(req.id);
    toast.success("Шаблон ответа клиенту скопирован!");
    setTimeout(() => setCopiedId(null), 3000);
  };

  const handleOpenDollForm = (req: AdminCustomRequestItem) => {
    setEditingDoll(null);
    setActiveDollFormRequestId(req.id);
  };

  const handleEditDoll = async (req: AdminCustomRequestItem) => {
    if (!req.responseDoll) return;
    setLoadingDollId(req.id);
    try {
      const res = await getAdminDollByIdAction(req.responseDoll.id);
      if (res.success && res.doll) {
        setEditingDoll(res.doll);
        setActiveDollFormRequestId(req.id);
      } else {
        toast.error(res.error || "Не удалось загрузить данные куклы для редактирования");
      }
    } catch {
      toast.error("Ошибка соединения при загрузке куклы");
    } finally {
      setLoadingDollId(null);
    }
  };

  const handleDetachDoll = async (requestId: string) => {
    if (!window.confirm("Вы уверены, что хотите отвязать куклу от этой заявки?")) {
      return;
    }
    try {
      const res = await detachResponseDollAction(requestId);
      if (res.success) {
        setRequests((prev) =>
          prev.map((r) => (r.id === requestId ? { ...r, responseDoll: null } : r))
        );
        toast.success("Кукла отвязана от заявки");
      } else {
        toast.error(res.error || "Не удалось отвязать куклу");
      }
    } catch {
      toast.error("Ошибка при отвязке куклы");
    }
  };

  const handleDollSaved = async (
    requestId: string,
    dollInfo: { id: string; slug: string; title: string }
  ) => {
    setActiveDollFormRequestId(null);
    setEditingDoll(null);
    toast.success(`Кукла «${dollInfo.title}» успешно сохранена и прикреплена к заявке!`);

    // Мгновенная перезагрузка актуального списка заявок с сервера
    try {
      const res = await getAdminRequestsAction();
      if (res.success) {
        setRequests(res.requests);
      }
    } catch {
      // Игнорируем фоновое обновление
    }
  };

  const handleCopyNotification = (req: AdminCustomRequestItem, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNotifyId(req.id);
    toast.success("Сообщение для покупателя скопировано в буфер обмена!");
    setTimeout(() => setCopiedNotifyId(null), 3500);
  };

  const handleOpenDollPicker = async (req: AdminCustomRequestItem) => {
    setPickerRequestId(req.id);
    setDollSearchTerm("");
    setIsLoadingAvailableDolls(true);
    try {
      const res = await getAvailableDollsForRequestAction();
      if (res.success) {
        setAvailableDolls(res.dolls);
      } else {
        toast.error(res.error || "Не удалось загрузить куклы из каталога");
      }
    } catch {
      toast.error("Ошибка при загрузке каталога");
    } finally {
      setIsLoadingAvailableDolls(false);
    }
  };

  const handleAttachExistingDoll = async (productId: string) => {
    if (!pickerRequestId) return;
    setAttachingDollId(productId);
    try {
      const res = await attachExistingDollToRequestAction({
        requestId: pickerRequestId,
        productId,
      });
      if (res.success) {
        toast.success("Кукла успешно прикреплена к заявке!");
        setPickerRequestId(null);
        const listRes = await getAdminRequestsAction();
        if (listRes.success) {
          setRequests(listRes.requests);
        }
      } else {
        toast.error(res.error || "Не удалось прикрепить куклу");
      }
    } catch {
      toast.error("Ошибка при прикреплении куклы");
    } finally {
      setAttachingDollId(null);
    }
  };

  const handleMarkSold = async (req: AdminCustomRequestItem) => {
    if (!req.responseDoll) return;
    try {
      const res = await markResponseDollSoldAction({
        requestId: req.id,
        productId: req.responseDoll.id,
      });
      if (res.success) {
        setRequests((prev) =>
          prev.map((r) =>
            r.id === req.id && r.responseDoll
              ? { ...r, responseDoll: { ...r.responseDoll, status: "sold" } }
              : r
          )
        );
        toast.success("Заказ отмечен как выполненный и оплаченный!");
      } else {
        toast.error(res.error || "Не удалось обновить статус");
      }
    } catch {
      toast.error("Ошибка при закрытии заказа");
    }
  };

  const handleCopyDirectLink = (slug: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://dollshop.by";
    const url = `${origin}/kukly/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedLinkSlug(slug);
    toast.success("Прямая ссылка на куклу скопирована в буфер!");
    setTimeout(() => setCopiedLinkSlug(null), 3000);
  };

  return (
    <div className="space-y-5">
      {/* Фильтры статусов */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: "all", label: "Все заявки", count: requests.length },
          {
            id: "new",
            label: "✨ Новые",
            count: requests.filter((r) => r.status === "new").length,
          },
          {
            id: "in_discussion",
            label: "💬 В обсуждении",
            count: requests.filter((r) => r.status === "in_discussion").length,
          },
          {
            id: "accepted",
            label: "🟢 Приняты",
            count: requests.filter((r) => r.status === "accepted").length,
          },
          {
            id: "declined",
            label: "⚪ Отклонены",
            count: requests.filter((r) => r.status === "declined").length,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id as typeof filter)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              filter === tab.id
                ? "bg-terracotta text-white shadow-xs"
                : "bg-white border border-linen-dark text-muted hover:text-espresso"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                filter === tab.id ? "bg-white/20 text-white" : "bg-linen text-muted"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Список заявок */}
      {filteredRequests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-linen-dark p-10 text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-linen flex items-center justify-center mx-auto text-muted">
            <MessageSquareHeart className="w-6 h-6" />
          </div>
          <p className="font-serif text-base text-espresso">Заявок не найдено</p>
          <p className="text-xs text-muted">
            {filter === "all"
              ? "Здесь будут появляться заявки покупателей со страницы «На заказ» или из карточек проданных кукол."
              : "Нет заявок с выбранным статусом."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((req) => {
            const cleanDigits = req.customerPhone.replace(/\D/g, "");
            const tgHandle = req.customerContact?.replace(/^@/, "");

            const notificationText = req.responseDoll
              ? buildCustomOrderNotificationText({
                  customerName: req.customerName,
                  dollTitle: req.responseDoll.title,
                  priceByn: req.responseDoll.priceByn,
                  slug: req.responseDoll.slug,
                })
              : "";

            return (
              <div
                key={req.id}
                className="bg-white rounded-2xl border border-linen-dark p-5 sm:p-6 shadow-sm space-y-4"
              >
                {/* Хедер карточки */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-linen-dark pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-lg font-medium text-espresso">
                      {req.customerName}
                    </span>
                    <span className="text-xs text-muted">
                      {new Date(req.createdAt).toLocaleDateString("ru-RU", {
                        day: "numeric",
                        month: "long",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {/* Бейдж статуса */}
                  <div>
                    {req.status === "new" && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-terracotta/30 bg-terracotta/10 px-2.5 py-0.5 text-xs font-medium text-terracotta">
                        <Sparkles className="h-3 w-3 text-terracotta" /> Новая заявка
                      </span>
                    )}
                    {req.status === "in_discussion" && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-900">
                        <Clock className="h-3 w-3 text-amber-700" /> В обсуждении
                      </span>
                    )}
                    {req.status === "accepted" && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-900">
                        <CheckCircle2 className="h-3 w-3 text-emerald-700" /> Принята в работу
                      </span>
                    )}
                    {req.status === "declined" && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                        <XCircle className="h-3 w-3 text-slate-500" /> Отклонена
                      </span>
                    )}
                  </div>
                </div>

                {/* Кукла-ориентир + Контакты и пожелания */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                  {/* Кукла-ориентир */}
                  <div className="md:col-span-6 space-y-2">
                    <p className="text-[11px] uppercase tracking-wider text-muted font-medium">
                      Ориентир работы:
                    </p>
                    {req.referenceDoll ? (
                      <div className="flex gap-3 items-center rounded-xl bg-alabaster/60 p-2.5 border border-linen-dark">
                        {req.referenceDoll.coverUrl && (
                          <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded-lg border border-linen-dark bg-alabaster">
                            <Image
                              src={req.referenceDoll.coverUrl}
                              alt={req.referenceDoll.title}
                              fill
                              sizes="60px"
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-serif text-sm font-medium text-espresso truncate">
                            {req.referenceDoll.title}
                          </p>
                          <Link
                            href={`/kukly/${req.referenceDoll.slug}`}
                            target="_blank"
                            className="text-[11px] text-terracotta hover:underline inline-flex items-center gap-1"
                          >
                            Смотреть карточку <ExternalLink className="h-2.5 w-2.5" />
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-muted italic">
                        Свободный индивидуальный заказ (без ориентира на готовую работу)
                      </p>
                    )}
                  </div>

                  {/* Контактные данные и пожелания */}
                  <div className="md:col-span-6 space-y-2">
                    <p className="text-[11px] uppercase tracking-wider text-muted font-medium">
                      Контакты и предпочтительный канал:
                    </p>
                    <div className="text-xs space-y-1">
                      <p className="text-espresso">
                        📞 Телефон:{" "}
                        <a
                          href={`tel:+${cleanDigits}`}
                          className="font-medium text-terracotta hover:underline"
                        >
                          {formatBelarusPhone(req.customerPhone)}
                        </a>
                      </p>
                      <p className="text-muted">
                        💬 Предпочитает связь:{" "}
                        <span className="font-medium text-espresso capitalize">
                          {req.contactChannel === "telegram" && "Telegram"}
                          {req.contactChannel === "viber" && "Viber"}
                          {req.contactChannel === "call" && "Звонок по телефону"}
                        </span>
                        {req.customerContact && (
                          <span className="ml-1 text-espresso font-mono">
                            ({req.customerContact})
                          </span>
                        )}
                      </p>
                    </div>

                    {req.wishes && (
                      <div className="rounded-xl bg-linen/50 p-3 text-xs text-espresso/90 border border-linen-dark">
                        <p className="text-[10px] text-muted uppercase tracking-wider mb-1">
                          Пожелания заказчика:
                        </p>
                        <p className="whitespace-pre-line leading-relaxed">{req.wishes}</p>
                      </div>
                    )}

                    {/* БЛОК ФОТО-РЕФЕРЕНСОВ ЗАЯВКИ */}
                    <div className="space-y-2 pt-1 border-t border-linen-dark/50">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[10px] text-muted uppercase tracking-wider font-semibold">
                          Фото-референс от заказчика ({req.referencePhotoUrls.length}):
                        </p>
                        <label className="cursor-pointer inline-flex items-center gap-1 text-[11px] font-medium text-terracotta hover:underline">
                          {uploadingRequestId === req.id ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin" />
                              <span>Загрузка...</span>
                            </>
                          ) : (
                            <>
                              <Plus className="h-3 w-3" />
                              <span>Добавить фото</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                            className="hidden"
                            disabled={uploadingRequestId === req.id}
                            onChange={(e) => {
                              handleUploadPhotoForRequest(req.id, e.target.files);
                              e.target.value = "";
                            }}
                          />
                        </label>
                      </div>

                      {req.referencePhotoUrls.length > 0 ? (
                        <div className="flex flex-wrap gap-2.5">
                          {req.referencePhotoUrls.map((url, idx) => {
                            const isBroken = brokenUrls.has(url);
                            return isBroken ? (
                              <div
                                key={url}
                                className="relative flex flex-col items-center justify-center h-24 w-28 rounded-xl border border-dashed border-terracotta/40 bg-linen/50 p-1.5 text-center"
                              >
                                <ImageOff className="h-5 w-5 text-terracotta/60 mb-1" />
                                <span className="text-[9px] text-muted leading-tight line-clamp-1">
                                  Файл не найден
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemovePhotoFromRequest(req.id, url)}
                                  className="mt-1 text-[10px] text-terracotta font-medium hover:underline flex items-center gap-0.5"
                                >
                                  <Trash2 className="h-2.5 w-2.5" />
                                  <span>Удалить</span>
                                </button>
                              </div>
                            ) : (
                              <div
                                key={url}
                                className="group relative h-24 w-24 overflow-hidden rounded-xl border border-linen-dark bg-linen shadow-2xs transition hover:shadow-sm"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={url}
                                  alt={`Референс ${idx + 1}`}
                                  className="h-full w-full object-cover cursor-pointer transition duration-300 group-hover:scale-105"
                                  onClick={() =>
                                    setPhotoViewerState({
                                      isOpen: true,
                                      urls: req.referencePhotoUrls,
                                      index: idx,
                                      title: `Референс к заявке от ${req.customerName}`,
                                      requestId: req.id,
                                    })
                                  }
                                  onError={() => {
                                    setBrokenUrls((prev) => new Set(prev).add(url));
                                  }}
                                />
                                {/* Кнопка полноэкранного просмотра */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPhotoViewerState({
                                      isOpen: true,
                                      urls: req.referencePhotoUrls,
                                      index: idx,
                                      title: `Референс к заявке от ${req.customerName}`,
                                      requestId: req.id,
                                    })
                                  }
                                  className="absolute inset-0 bg-espresso/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white"
                                  title="Открыть просмотр"
                                >
                                  <Maximize2 className="h-4 w-4 drop-shadow" />
                                </button>
                                {/* Кнопка удаления */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemovePhotoFromRequest(req.id, url);
                                  }}
                                  className="absolute top-1 right-1 h-5 w-5 rounded-full bg-espresso/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-terracotta"
                                  title="Удалить фото"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed border-linen-dark p-2.5 text-center bg-linen/20">
                          <p className="text-[11px] text-muted">Заказчик не прикрепил фото при отправке заявки.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* БЛОК КУКЛЫ-ОТВЕТА (КОГДА ЗАЯВКА В РАБОТЕ ИЛИ В ОБСУЖДЕНИИ) */}
                {(req.status === "accepted" || req.status === "in_discussion" || req.responseDoll) && (
                  <div className="pt-2">
                    {req.responseDoll ? (
                      <div className="rounded-2xl border border-linen-dark bg-alabaster/40 p-4 space-y-3.5">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-linen-dark pb-2">
                          <span className="text-xs font-semibold uppercase tracking-wider text-terracotta flex items-center gap-1.5">
                            <Gift className="h-4 w-4 text-terracotta" />
                            Кукла-ответ к этой заявке
                          </span>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {req.responseDoll.status === "sold" ? (
                              <span className="text-[11px] font-medium text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3 text-emerald-700" /> Выполнен и оплачен
                              </span>
                            ) : req.responseDoll.status === "reserved" ? (
                              <span className="text-[11px] font-medium text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                                <Clock className="h-3 w-3 text-amber-700" /> В брони для заказчика
                              </span>
                            ) : (
                              <span className="text-[11px] font-medium text-sky-800 bg-sky-100 px-2.5 py-0.5 rounded-full border border-sky-200">
                                🟢 Готова к оплате
                              </span>
                            )}
                            <span className="text-[11px] text-muted bg-linen px-2 py-0.5 rounded-full border border-linen-dark">
                              🔒 Скрыта из общего каталога
                            </span>
                          </div>
                        </div>

                        {/* Карточка готовой куклы */}
                        <div className="flex flex-col sm:flex-row gap-3.5 items-start bg-white p-3.5 rounded-xl border border-linen-dark shadow-2xs">
                          {req.responseDoll.coverUrl && (
                            <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-lg border border-linen-dark bg-linen">
                              <Image
                                src={req.responseDoll.coverUrl}
                                alt={req.responseDoll.title}
                                fill
                                sizes="80px"
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <h4 className="font-serif text-base font-medium text-espresso truncate">
                                {req.responseDoll.title}
                              </h4>
                              <span className="font-sans font-bold text-sm text-terracotta">
                                {req.responseDoll.priceByn.toFixed(2)} BYN
                              </span>
                            </div>
                            <p className="text-[11px] text-muted">
                              Рост: {req.responseDoll.heightCm} см · Материалы:{" "}
                              {req.responseDoll.materials.join(", ")}
                            </p>
                            {req.responseDoll.story && (
                              <p className="text-xs text-espresso/80 line-clamp-2 italic">
                                «{req.responseDoll.story}»
                              </p>
                            )}
                            <div className="flex flex-wrap items-center gap-2 pt-1.5">
                              <Link
                                href={`/kukly/${req.responseDoll.slug}`}
                                target="_blank"
                                className="text-xs text-terracotta hover:underline inline-flex items-center gap-1 font-medium"
                              >
                                Открыть карточку для проверки <ExternalLink className="h-3 w-3" />
                              </Link>
                              <span className="text-muted text-xs">·</span>
                              <button
                                type="button"
                                onClick={() => handleEditDoll(req)}
                                disabled={loadingDollId === req.id}
                                className="text-xs text-muted hover:text-espresso underline cursor-pointer disabled:opacity-50"
                              >
                                {loadingDollId === req.id ? "Загрузка..." : "Редактировать куклу"}
                              </button>
                              <span className="text-muted text-xs">·</span>
                              <button
                                type="button"
                                onClick={() => handleDetachDoll(req.id)}
                                className="text-xs text-red-600 hover:text-red-700 underline cursor-pointer"
                              >
                                Отвязать
                              </button>
                              {req.responseDoll.status !== "sold" && (
                                <>
                                  <span className="text-muted text-xs">·</span>
                                  <button
                                    type="button"
                                    onClick={() => handleMarkSold(req)}
                                    className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold underline cursor-pointer inline-flex items-center gap-1"
                                  >
                                    <CheckCircle2 className="h-3 w-3" />
                                    Отметить заказ выполненным и оплаченным
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Уведомление покупателя со ссылкой на готовую куклу */}
                        <div className="rounded-xl bg-emerald-50/70 border border-emerald-200/80 p-3.5 space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-emerald-900 flex items-center gap-1.5">
                              <Send className="h-3.5 w-3.5 text-emerald-700" />
                              Уведомление для покупателя:
                            </span>
                            <span className="text-[11px] text-emerald-800 font-medium">
                              {req.contactChannel === "telegram"
                                ? "💬 Telegram"
                                : req.contactChannel === "viber"
                                ? "🟣 Viber"
                                : "📞 Звонок"}
                            </span>
                          </div>

                          <div className="bg-white rounded-lg p-3 text-xs text-espresso/90 border border-emerald-100 font-sans whitespace-pre-line leading-relaxed shadow-2xs">
                            {notificationText}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <Button
                              type="button"
                              size="sm"
                              className="h-8 text-xs bg-emerald-700 hover:bg-emerald-800 text-white gap-1.5"
                              onClick={() => handleCopyNotification(req, notificationText)}
                            >
                              {copiedNotifyId === req.id ? (
                                <>
                                  <Check className="h-3.5 w-3.5 text-white" />
                                  Сообщение скопировано!
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3.5 w-3.5" />
                                  Скопировать сообщение со ссылкой
                                </>
                              )}
                            </Button>

                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs border-linen-dark hover:bg-linen text-espresso gap-1.5"
                              onClick={() => handleCopyDirectLink(req.responseDoll!.slug)}
                            >
                              {copiedLinkSlug === req.responseDoll.slug ? (
                                <>
                                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                                  Ссылка скопирована!
                                </>
                              ) : (
                                <>
                                  <Link2 className="h-3.5 w-3.5 text-muted" />
                                  Скопировать ссылку
                                </>
                              )}
                            </Button>

                            {tgHandle && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs border-emerald-300 hover:bg-emerald-100 text-emerald-900 gap-1.5"
                                asChild
                              >
                                <a
                                  href={`https://t.me/${tgHandle}?text=${encodeURIComponent(
                                    notificationText
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Send className="h-3.5 w-3.5 text-emerald-700" />
                                  Отправить в Telegram
                                </a>
                              </Button>
                            )}

                            {req.contactChannel === "viber" && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs border-emerald-300 hover:bg-emerald-100 text-emerald-900 gap-1.5"
                                asChild
                              >
                                <a href={`viber://chat?number=%2B${cleanDigits}`}>
                                  <MessageCircle className="h-3.5 w-3.5 text-emerald-700" />
                                  Открыть диалог в Viber
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Заявка в работе/обсуждении, кукла еще не привязана */
                      <div className="rounded-xl border border-dashed border-terracotta/40 bg-terracotta/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-terracotta">
                            <Sparkles className="h-4 w-4" />
                            {req.status === "accepted"
                              ? "Заявка принята в работу: добавьте куклу"
                              : "Заявка в обсуждении: прикрепите куклу"}
                          </div>
                          <p className="text-[11px] text-muted">
                            Прикрепите существующую куклу из каталога или создайте новую работу специально под этот заказ.
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <Button
                            type="button"
                            size="sm"
                            className="bg-terracotta hover:bg-terracotta-dark text-white text-xs gap-1.5"
                            onClick={() => handleOpenDollPicker(req)}
                          >
                            <Link2 className="h-3.5 w-3.5" />
                            Прикрепить из каталога
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="border-terracotta/40 hover:bg-terracotta/10 text-terracotta text-xs gap-1.5"
                            onClick={() => handleOpenDollForm(req)}
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Создать новую
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Панель быстрых действий */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-linen-dark">
                  {/* Связь в один клик */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs gap-1.5"
                      asChild
                    >
                      <a href={`tel:+${cleanDigits}`}>
                        <Phone className="h-3 w-3 text-terracotta" />
                        Позвонить
                      </a>
                    </Button>

                    {tgHandle && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1.5"
                        asChild
                      >
                        <a
                          href={`https://t.me/${tgHandle}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Send className="h-3 w-3 text-terracotta" />
                          Telegram
                        </a>
                      </Button>
                    )}

                    {req.contactChannel === "viber" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1.5"
                        asChild
                      >
                        <a href={`viber://chat?number=%2B${cleanDigits}`}>
                          <MessageCircle className="h-3 w-3 text-terracotta" />
                          Viber
                        </a>
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs gap-1.5 text-muted hover:text-terracotta"
                      onClick={() => handleCopyReplyTemplate(req)}
                    >
                      {copiedId === req.id ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-600" />
                          Скопировано!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          Шаблон ответа
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Кнопки статуса */}
                  <div className="flex items-center gap-1.5">
                    {req.status === "new" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => handleStatusChange(req.id, "in_discussion")}
                        >
                          В обсуждение
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          className="h-8 text-xs bg-emerald-700 hover:bg-emerald-800"
                          onClick={() => handleStatusChange(req.id, "accepted")}
                        >
                          Принять в работу
                        </Button>
                      </>
                    )}

                    {req.status === "in_discussion" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs text-rose-700 hover:bg-rose-50 hover:border-rose-300"
                          onClick={() => handleStatusChange(req.id, "declined")}
                        >
                          Отклонить
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          className="h-8 text-xs bg-emerald-700 hover:bg-emerald-800"
                          onClick={() => handleStatusChange(req.id, "accepted")}
                        >
                          Принять в работу
                        </Button>
                      </>
                    )}

                    {req.status === "accepted" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => handleStatusChange(req.id, "in_discussion")}
                      >
                        Вернуть в обсуждение
                      </Button>
                    )}

                    {req.status === "declined" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => handleStatusChange(req.id, "new")}
                      >
                        Возобновить заявку
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* МОДАЛЬНОЕ ОКНО СОЗДАНИЯ / РЕДАКТИРОВАНИЯ КУКЛЫ-ОТВЕТА */}
      {activeRequest && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-5 sm:p-7 border border-linen-dark max-h-[92vh] overflow-y-auto">
            {/* Кнопка закрытия модалки */}
            <button
              type="button"
              onClick={() => {
                setActiveDollFormRequestId(null);
                setEditingDoll(null);
              }}
              className="absolute top-4 right-4 p-2 text-muted hover:text-espresso rounded-full hover:bg-linen transition cursor-pointer"
              title="Закрыть"
            >
              <X className="h-5 w-5" />
            </button>

            <ProductForm
              customRequestId={activeRequest.id}
              customerName={activeRequest.customerName}
              referenceDollTitle={activeRequest.referenceDoll?.title}
              initialDoll={editingDoll}
              onSuccess={(saved) => handleDollSaved(activeRequest.id, saved)}
              onCancel={() => {
                setActiveDollFormRequestId(null);
                setEditingDoll(null);
              }}
            />
          </div>
        </div>
      )}

      {/* МОДАЛЬНОЕ ОКНО ПРИВЯЗКИ СУЩЕСТВУЮЩЕЙ КУКЛЫ ИЗ КАТАЛОГА */}
      {activePickerRequest && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl p-5 sm:p-6 border border-linen-dark max-h-[88vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-linen-dark pb-3 mb-4">
              <div>
                <h3 className="font-serif text-lg font-medium text-espresso flex items-center gap-2">
                  <Link2 className="h-5 w-5 text-terracotta" />
                  Прикрепить готовую куклу
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  Заявка от {activePickerRequest.customerName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPickerRequestId(null)}
                className="p-1.5 text-muted hover:text-espresso rounded-full hover:bg-linen transition cursor-pointer"
                title="Закрыть"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search bar */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <input
                type="text"
                placeholder="Поиск по названию или коллекции куклы..."
                value={dollSearchTerm}
                onChange={(e) => setDollSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-linen-dark bg-alabaster/40 text-espresso placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta transition"
              />
            </div>

            {/* Dolls list */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[220px]">
              {isLoadingAvailableDolls ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted text-xs gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-terracotta" />
                  <span>Загрузка доступных кукол...</span>
                </div>
              ) : filteredAvailableDolls.length === 0 ? (
                <div className="text-center py-12 text-muted text-xs space-y-1">
                  <p className="font-medium text-espresso">Куклы не найдены</p>
                  <p className="text-muted text-[11px]">
                    {dollSearchTerm
                      ? "По вашему поисковому запросу ничего не нашлось."
                      : "В наличии пока нет свободных кукол. Вы можете создать новую куклу через форму."}
                  </p>
                </div>
              ) : (
                filteredAvailableDolls.map((doll) => (
                  <div
                    key={doll.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl border border-linen-dark bg-white hover:bg-linen/30 transition shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {doll.coverUrl ? (
                        <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded-lg border border-linen-dark bg-linen">
                          <Image
                            src={doll.coverUrl}
                            alt={doll.title}
                            fill
                            sizes="50px"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-14 w-12 shrink-0 rounded-lg border border-dashed border-linen-dark bg-linen/50 flex items-center justify-center text-[10px] text-muted">
                          Нет фото
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-serif text-sm font-medium text-espresso truncate">
                          {doll.title}
                        </p>
                        <p className="text-xs font-semibold text-terracotta">
                          {doll.priceByn.toFixed(2)} BYN
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-muted mt-0.5">
                          {doll.collection && <span>{doll.collection}</span>}
                          <span>·</span>
                          <span className="capitalize">
                            {doll.status === "available"
                              ? "В наличии"
                              : doll.status === "draft"
                              ? "Черновик"
                              : "Под заказ"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      className="h-8 text-xs bg-terracotta hover:bg-terracotta-dark text-white gap-1 shrink-0"
                      disabled={attachingDollId === doll.id}
                      onClick={() => handleAttachExistingDoll(doll.id)}
                    >
                      {attachingDollId === doll.id ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Прикрепление...
                        </>
                      ) : (
                        <>
                          <Link2 className="h-3 w-3" />
                          Прикрепить
                        </>
                      )}
                    </Button>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-linen-dark pt-3 mt-3 flex items-center justify-between text-xs text-muted">
              <span>Доступно: {filteredAvailableDolls.length}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-muted hover:text-espresso"
                onClick={() => setPickerRequestId(null)}
              >
                Отмена
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* МОДАЛЬНЫЙ ПРОСМОТРЩИК (LIGHTBOX) ДЛЯ ФОТО-РЕФЕРЕНСОВ */}
      {photoViewerState && photoViewerState.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/90 p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setPhotoViewerState(null)}
        >
          <div
            className="relative flex flex-col max-h-[95vh] max-w-4xl w-full rounded-2xl bg-white shadow-2xl overflow-hidden border border-linen-dark"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Шапка просмотрщика */}
            <div className="flex items-center justify-between border-b border-linen-dark px-4 py-3 bg-warm-white">
              <div>
                <h3 className="font-serif text-sm sm:text-base font-semibold text-espresso">
                  {photoViewerState.title}
                </h3>
                <p className="text-[11px] text-muted">
                  Фото {photoViewerState.index + 1} из {photoViewerState.urls.length}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* Скачать фото */}
                <a
                  href={photoViewerState.urls[photoViewerState.index]}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-linen-dark bg-white px-2.5 py-1.5 text-xs font-medium text-espresso hover:bg-linen transition"
                  title="Скачать фото"
                >
                  <Download className="h-3.5 w-3.5 text-terracotta" />
                  <span className="hidden sm:inline">Скачать</span>
                </a>
                {/* В новой вкладке */}
                <a
                  href={photoViewerState.urls[photoViewerState.index]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-linen-dark bg-white px-2.5 py-1.5 text-xs font-medium text-espresso hover:bg-linen transition"
                  title="Открыть в новой вкладке"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-muted" />
                  <span className="hidden sm:inline">В новой вкладке</span>
                </a>
                {/* Закрыть */}
                <button
                  type="button"
                  onClick={() => setPhotoViewerState(null)}
                  className="rounded-lg p-1.5 text-muted hover:bg-linen hover:text-espresso transition"
                  title="Закрыть"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Контейнер изображения */}
            <div className="relative flex items-center justify-center bg-espresso/5 p-2 sm:p-6 min-h-[300px] max-h-[75vh] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoViewerState.urls[photoViewerState.index]}
                alt={photoViewerState.title}
                className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-sm select-none"
              />

              {/* Навигация Предыдущее / Следующее (если фото больше одного) */}
              {photoViewerState.urls.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setPhotoViewerState({
                        ...photoViewerState,
                        index:
                          photoViewerState.index > 0
                            ? photoViewerState.index - 1
                            : photoViewerState.urls.length - 1,
                      })
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2.5 text-espresso shadow hover:bg-white transition"
                    title="Предыдущее фото"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPhotoViewerState({
                        ...photoViewerState,
                        index:
                          photoViewerState.index < photoViewerState.urls.length - 1
                            ? photoViewerState.index + 1
                            : 0,
                      })
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2.5 text-espresso shadow hover:bg-white transition"
                    title="Следующее фото"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>

            {/* Подвал просмотрщика */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-linen-dark px-4 py-2.5 bg-warm-white">
              <button
                type="button"
                onClick={() =>
                  handleRemovePhotoFromRequest(
                    photoViewerState.requestId,
                    photoViewerState.urls[photoViewerState.index]!
                  )
                }
                className="inline-flex items-center gap-1.5 text-xs text-terracotta hover:underline font-medium"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Удалить это фото из заявки</span>
              </button>
              <span className="text-xs text-muted">
                На смартфоне можно зажать фото пальцем, чтобы сохранить в галерею
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
