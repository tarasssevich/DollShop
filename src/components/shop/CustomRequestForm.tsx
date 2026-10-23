"use client";

import * as React from "react";
import Link from "next/link";
import {
  Sparkles,
  Send,
  MessageCircle,
  Phone,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import {
  customRequestSchema,
  type ContactChannel,
  type CustomRequestInput,
} from "@/lib/schemas/custom-request";

interface CustomRequestFormProps {
  fromDollSlug?: string;
  fromDollName?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

export function CustomRequestForm({
  fromDollSlug,
  fromDollName,
  onSuccess,
  onCancel,
  className = "",
}: CustomRequestFormProps) {
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [preferredChannel, setPreferredChannel] =
    React.useState<ContactChannel>("telegram");
  const [wishes, setWishes] = React.useState(() =>
    fromDollName
      ? `Здравствуйте! Очень понравился образ куклы «${fromDollName}». Хотелось бы обсудить создание похожей работы по мотивам.`
      : ""
  );
  const [pdConsent, setPdConsent] = React.useState(false);
  const [honeypot, setHoneypot] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const formData: Partial<CustomRequestInput> = {
      name,
      phone,
      preferredChannel,
      wishes,
      fromDollSlug,
      fromDollName,
      pdConsent: pdConsent as true,
      honeypot,
    };

    const result = customRequestSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const fieldName = String(issue.path[0] ?? "general");
        if (!fieldErrors[fieldName]) {
          fieldErrors[fieldName] = issue.message;
        }
      }
      setErrors(fieldErrors);

      // Toast topmost error
      const firstError = Object.values(fieldErrors)[0];
      if (firstError) {
        toast.error(firstError);
      }
      return;
    }

    setIsSubmitting(true);

    // Mock API submission simulation
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      toast.success("Заявка мастеру отправлена!", {
        description: `Мастер Алёна свяжется с вами через ${
          preferredChannel === "telegram"
            ? "Telegram"
            : preferredChannel === "viber"
            ? "Viber"
            : "звонок"
        }.`,
        duration: 5000,
      });
      onSuccess?.();
    }, 500);
  };

  if (isSubmitted) {
    return (
      <div className="py-8 text-center space-y-4">
        <div className="h-14 w-14 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h3 className="font-serif text-2xl sm:text-3xl font-light text-espresso">
          Заявка принята!
        </h3>
        <p className="text-xs sm:text-sm text-muted max-w-sm mx-auto leading-relaxed">
          Спасибо за ваше доверие. Мастер свяжется с вами для уточнения деталей,
          цветовой палитры и сроков создания феи.
        </p>
        <div className="pt-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={() => {
              setIsSubmitted(false);
              setName("");
              setPhone("");
              setWishes("");
              setPdConsent(false);
              onCancel?.();
            }}
          >
            Закрыть
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      {fromDollName && (
        <div className="rounded-xl bg-linen/70 border border-linen-dark p-3 text-xs text-espresso flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-terracotta shrink-0" />
          <span>
            Заявка по мотивам феи: <strong>«{fromDollName}»</strong>
          </span>
        </div>
      )}

      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="req-name" className="text-xs">
          Ваше имя <span className="text-terracotta">*</span>
        </Label>
        <Input
          id="req-name"
          placeholder="Например, Анна"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={errors.name ? "border-red-400" : ""}
          required
        />
        {errors.name && (
          <p className="text-[11px] text-red-600">{errors.name}</p>
        )}
      </div>

      {/* Phone */}
      <div className="space-y-1.5">
        <Label htmlFor="req-phone" className="text-xs">
          Телефон Беларуси <span className="text-terracotta">*</span>
        </Label>
        <Input
          id="req-phone"
          placeholder="+375 (29) 123-45-67"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={errors.phone ? "border-red-400" : ""}
          required
        />
        {errors.phone && (
          <p className="text-[11px] text-red-600">{errors.phone}</p>
        )}
      </div>

      {/* Preferred Communication Channel */}
      <div className="space-y-1.5">
        <Label className="text-xs">Как удобнее связаться?</Label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setPreferredChannel("telegram")}
            className={`flex items-center justify-center gap-1.5 rounded-xl border p-2 text-xs font-medium transition-all ${
              preferredChannel === "telegram"
                ? "border-terracotta bg-terracotta-subtle text-terracotta"
                : "border-linen-dark bg-white text-muted hover:border-linen"
            }`}
          >
            <Send className="h-3.5 w-3.5" />
            <span>Telegram</span>
          </button>

          <button
            type="button"
            onClick={() => setPreferredChannel("viber")}
            className={`flex items-center justify-center gap-1.5 rounded-xl border p-2 text-xs font-medium transition-all ${
              preferredChannel === "viber"
                ? "border-purple-300 bg-purple-50 text-purple-700"
                : "border-linen-dark bg-white text-muted hover:border-linen"
            }`}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span>Viber</span>
          </button>

          <button
            type="button"
            onClick={() => setPreferredChannel("call")}
            className={`flex items-center justify-center gap-1.5 rounded-xl border p-2 text-xs font-medium transition-all ${
              preferredChannel === "call"
                ? "border-sage bg-sage-subtle text-sage-dark"
                : "border-linen-dark bg-white text-muted hover:border-linen"
            }`}
          >
            <Phone className="h-3.5 w-3.5" />
            <span>Звонок</span>
          </button>
        </div>
      </div>

      {/* Wishes */}
      <div className="space-y-1.5">
        <Label htmlFor="req-wishes" className="text-xs">
          Пожелания к образу (палитра, повод, детали)
        </Label>
        <Textarea
          id="req-wishes"
          rows={3}
          placeholder="Например: в подарок дочке на день рождения, мятные тона платья и цветочки незабудки..."
          value={wishes}
          onChange={(e) => setWishes(e.target.value)}
          className={errors.wishes ? "border-red-400" : ""}
        />
        {errors.wishes && (
          <p className="text-[11px] text-red-600">{errors.wishes}</p>
        )}
      </div>

      {/* Honeypot field for anti-spam (hidden) */}
      <div style={{ display: "none" }} aria-hidden="true">
        <label htmlFor="req-website">Вебсайт (не заполняйте)</label>
        <input
          id="req-website"
          type="text"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {/* PD Consent Checkbox (unselected by default) */}
      <div className="space-y-1 pt-1">
        <label
          htmlFor="pd-consent"
          className="flex items-start gap-2.5 cursor-pointer select-none"
        >
          <Checkbox
            id="pd-consent"
            checked={pdConsent}
            onCheckedChange={(c) => setPdConsent(c === true)}
            className="mt-0.5"
          />
          <span className="text-[11px] text-muted leading-tight">
            Я даю согласие на обработку персональных данных в соответствии с{" "}
            <Link
              href="/politika-konfidencialnosti"
              target="_blank"
              className="text-terracotta underline hover:text-terracotta-hover"
            >
              Политикой конфиденциальности
            </Link>{" "}
            <span className="text-terracotta">*</span>
          </span>
        </label>
        {errors.pdConsent && (
          <p className="text-[11px] text-red-600 pl-6">{errors.pdConsent}</p>
        )}
      </div>

      {/* Buttons */}
      <div className="pt-2 flex flex-col sm:flex-row gap-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            className="sm:w-1/3"
            onClick={onCancel}
          >
            Отмена
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:flex-1 py-5 shadow-sm"
        >
          {isSubmitting ? (
            "Отправка..."
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Отправить заявку мастеру
            </>
          )}
        </Button>
      </div>

      <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted pt-1">
        <Lock className="h-3 w-3 text-sage" />
        <span>Ваши данные не передаются третьим лицам</span>
      </div>
    </form>
  );
}

interface CustomRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  fromDollSlug?: string;
  fromDollName?: string;
}

/**
 * Responsive modal wrapper:
 * - Desktop: Center Radix Dialog
 * - Mobile: Bottom Radix Sheet for comfortable thumb input
 */
export function CustomRequestModal({
  isOpen,
  onClose,
  fromDollSlug,
  fromDollName,
}: CustomRequestModalProps) {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[92vh] overflow-y-auto">
          <SheetHeader className="text-left pb-2">
            <SheetTitle className="font-serif text-2xl font-normal text-espresso">
              Заказать фею по мотивам
            </SheetTitle>
            <SheetDescription className="text-xs text-muted">
              Обсудим создание уникальной текстильной куклы ручной работы.
            </SheetDescription>
          </SheetHeader>
          <CustomRequestForm
            fromDollSlug={fromDollSlug}
            fromDollName={fromDollName}
            onCancel={onClose}
            onSuccess={() => {
              // modal closes upon success after user confirms or via auto timeout
            }}
          />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg p-6 sm:p-7">
        <DialogHeader>
          <DialogTitle className="font-serif text-3xl font-light text-espresso">
            Заказать фею по мотивам
          </DialogTitle>
          <DialogDescription className="text-xs text-muted leading-relaxed">
            Каждая кукла создается вручную в единственном экземпляре. Оставьте
            контакты, и мастер свяжется с вами для согласования образа и деталей.
          </DialogDescription>
        </DialogHeader>
        <CustomRequestForm
          fromDollSlug={fromDollSlug}
          fromDollName={fromDollName}
          onCancel={onClose}
          onSuccess={() => {
            // modal stays open on success screen
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
