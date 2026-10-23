"use client";

import * as React from "react";
import { ShieldCheck, Package, SlidersHorizontal, CreditCard, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  updateSiteSettingsAction,
  type SiteSettingsInput,
} from "@/actions/admin/settings";
import type { DomainSiteSettings } from "@/lib/data/drizzle/mappers";

interface SettingsClientProps {
  initialSettings: DomainSiteSettings;
}

export function SettingsClient({ initialSettings }: SettingsClientProps) {
  const [form, setForm] = React.useState<SiteSettingsInput>({
    legalSellerName: initialSettings.legalSellerName,
    legalUnp: initialSettings.legalUnp,
    legalTradeRegistryNum: initialSettings.legalTradeRegistryNum,
    legalAddress: initialSettings.legalAddress,
    contactPhone: initialSettings.contactPhone,
    contactEmail: initialSettings.contactEmail,
    deliveryCostBranch: initialSettings.deliveryCostBranch,
    freeDeliveryThreshold: initialSettings.freeDeliveryThreshold,
    allowedPaymentMethods: initialSettings.allowedPaymentMethods,
  });

  const [saving, setSaving] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateSiteSettingsAction(form);
      if (res.success) {
        toast.success("Настройки успешно сохранены!");
      } else {
        toast.error(res.error || "Ошибка сохранения");
      }
    } catch {
      toast.error("Произошла ошибка при сохранении");
    } finally {
      setSaving(false);
    }
  };

  const togglePaymentMethod = (method: string) => {
    setForm((prev) => {
      const exists = prev.allowedPaymentMethods.includes(method);
      const updated = exists
        ? prev.allowedPaymentMethods.filter((m) => m !== method)
        : [...prev.allowedPaymentMethods, method];
      return { ...prev, allowedPaymentMethods: updated };
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Реквизиты ИП */}
      <div className="bg-white rounded-2xl border border-linen-dark p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 text-terracotta border-b border-linen-dark pb-3">
          <ShieldCheck className="w-5 h-5" />
          <h2 className="font-serif text-lg text-espresso">Реквизиты продавца (ИП)</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5">
            <Label htmlFor="legalSellerName">Продавец (ФИО / ИП)</Label>
            <Input
              id="legalSellerName"
              value={form.legalSellerName}
              onChange={(e) => setForm({ ...form, legalSellerName: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="legalUnp">УНП (9 цифр)</Label>
            <Input
              id="legalUnp"
              value={form.legalUnp}
              onChange={(e) => setForm({ ...form, legalUnp: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="legalTradeRegistryNum">Номер в Торговом реестре РБ</Label>
            <Input
              id="legalTradeRegistryNum"
              value={form.legalTradeRegistryNum}
              onChange={(e) =>
                setForm({ ...form, legalTradeRegistryNum: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="legalAddress">Юридический адрес</Label>
            <Input
              id="legalAddress"
              value={form.legalAddress}
              onChange={(e) => setForm({ ...form, legalAddress: e.target.value })}
              required
            />
          </div>
        </div>
      </div>

      {/* Почта и тарифы */}
      <div className="bg-white rounded-2xl border border-linen-dark p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 text-sage border-b border-linen-dark pb-3">
          <Package className="w-5 h-5" />
          <h2 className="font-serif text-lg text-espresso">Условия отправки почтой</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5">
            <Label htmlFor="deliveryCostBranch">Стоимость пересылки Белпочтой (BYN)</Label>
            <Input
              id="deliveryCostBranch"
              type="number"
              step="0.10"
              value={form.deliveryCostBranch}
              onChange={(e) =>
                setForm({
                  ...form,
                  deliveryCostBranch: parseFloat(e.target.value) || 0,
                })
              }
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="freeDeliveryThreshold">Бесплатная пересылка при заказе от (BYN)</Label>
            <Input
              id="freeDeliveryThreshold"
              type="number"
              step="1"
              value={form.freeDeliveryThreshold}
              onChange={(e) =>
                setForm({
                  ...form,
                  freeDeliveryThreshold: parseFloat(e.target.value) || 0,
                })
              }
              required
            />
          </div>
        </div>
      </div>

      {/* Способы оплаты */}
      <div className="bg-white rounded-2xl border border-linen-dark p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 text-terracotta border-b border-linen-dark pb-3">
          <CreditCard className="w-5 h-5" />
          <h2 className="font-serif text-lg text-espresso">Включённые способы оплаты</h2>
        </div>
        <div className="space-y-2 text-xs">
          {[
            {
              id: "cod",
              title: "📦 Наложенный платёж",
              desc: "Оплата при получении посылки в отделении Белпочты",
            },
            {
              id: "erip_invoice",
              title: "💳 ЕРИП (счет для оплаты)",
              desc: "Выставление счета в системе Расчет (ЕРИП)",
            },
            {
              id: "bank_transfer",
              title: "🏦 Банковский перевод на карту",
              desc: "Прямой перевод по реквизитам карты мастера",
            },
          ].map((item) => {
            const active = form.allowedPaymentMethods.includes(item.id);
            return (
              <label
                key={item.id}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                  active
                    ? "bg-terracotta/5 border-terracotta/30"
                    : "bg-alabaster/40 border-linen-dark opacity-60"
                }`}
              >
                <div>
                  <p className="font-medium text-espresso">{item.title}</p>
                  <p className="text-[11px] text-muted">{item.desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => togglePaymentMethod(item.id)}
                  className="rounded border-linen-dark text-terracotta focus:ring-terracotta h-4 w-4"
                />
              </label>
            );
          })}
        </div>
      </div>

      {/* Контакты для покупателей */}
      <div className="bg-white rounded-2xl border border-linen-dark p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 text-espresso border-b border-linen-dark pb-3">
          <SlidersHorizontal className="w-5 h-5" />
          <h2 className="font-serif text-lg text-espresso">Контакты мастера</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5">
            <Label htmlFor="contactPhone">Контактный телефон</Label>
            <Input
              id="contactPhone"
              value={form.contactPhone}
              onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contactEmail">Контактный Email</Label>
            <Input
              id="contactEmail"
              type="email"
              value={form.contactEmail}
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
              required
            />
          </div>
        </div>
      </div>

      {/* Кнопка сохранения */}
      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          disabled={saving}
          className="bg-terracotta hover:bg-terracotta/90 text-white gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? "Сохранение..." : "Сохранить настройки"}
        </Button>
      </div>
    </form>
  );
}
