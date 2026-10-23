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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatBelarusPhone } from "@/lib/utils/phone";
import {
  updateAdminRequestStatusAction,
  type AdminCustomRequestItem,
} from "@/actions/admin/requests";

interface RequestsClientProps {
  initialRequests: AdminCustomRequestItem[];
}

export function RequestsClient({ initialRequests }: RequestsClientProps) {
  const [requests, setRequests] = React.useState<AdminCustomRequestItem[]>(initialRequests);
  const [filter, setFilter] = React.useState<
    "all" | "new" | "in_discussion" | "accepted" | "declined"
  >("all");
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const filteredRequests = React.useMemo(() => {
    if (filter === "all") return requests;
    return requests.filter((r) => r.status === filter);
  }, [requests, filter]);

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
            ? "Заявка принята в работу!"
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

            return (
              <div
                key={req.id}
                className="bg-white rounded-2xl border border-linen-dark p-5 sm:p-6 shadow-sm space-y-4"
              >
                {/* Хедер */}
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
                            href={`/catalog/${req.referenceDoll.slug}`}
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

                    {req.referencePhotoUrls.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[10px] text-muted uppercase tracking-wider">
                          Фото-референс:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {req.referencePhotoUrls.map((url) => (
                            <a
                              key={url}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block h-20 w-20 overflow-hidden rounded-lg border border-linen-dark bg-linen"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={url} alt="Фото-референс" className="h-full w-full object-cover" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

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
    </div>
  );
}
