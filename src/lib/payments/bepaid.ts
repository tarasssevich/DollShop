import crypto from "node:crypto";
import type {
  PaymentProvider,
  CardPaymentParams,
  CardPaymentResult,
  EripInvoiceParams,
  EripInvoiceResult,
  WebhookVerificationResult,
  PaymentStatusResult,
} from "./provider";

export class BePaidPaymentProvider implements PaymentProvider {
  name = "bePaid";
  isSandbox: boolean;
  private shopId?: string;
  private secretKey?: string;
  private baseUrl: string;

  constructor() {
    this.shopId = process.env.BEPAID_SHOP_ID;
    this.secretKey = process.env.BEPAID_SECRET_KEY;
    // Если ключи не настроены или включен режим тестовой среды — работаем в Sandbox
    this.isSandbox =
      !this.shopId ||
      !this.secretKey ||
      process.env.BEPAID_SANDBOX === "true" ||
      process.env.NODE_ENV !== "production";
    this.baseUrl = this.isSandbox
      ? "https://checkout.bepaid.by"
      : "https://checkout.bepaid.by";
  }

  async createCardPayment(params: CardPaymentParams): Promise<CardPaymentResult> {
    const amountCents = Math.round(params.amountByn * 100);

    // Если нет реальных боевых ключей — используем локальный интерактивный Sandbox эмулятор
    if (this.isSandbox && (!this.shopId || !this.secretKey)) {
      const mockPaymentId = `bepaid_sandbox_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
      const sandboxRedirectUrl = `/oplata/sandbox/${mockPaymentId}?orderId=${encodeURIComponent(
        params.orderId
      )}&orderNumber=${params.orderNumber}&amount=${params.amountByn}&doll=${encodeURIComponent(
        params.dollTitle
      )}&returnUrl=${encodeURIComponent(params.returnUrl)}`;

      return {
        success: true,
        paymentId: mockPaymentId,
        redirectUrl: sandboxRedirectUrl,
      };
    }

    try {
      const authHeader = `Basic ${Buffer.from(`${this.shopId}:${this.secretKey}`).toString("base64")}`;

      const payload = {
        checkout: {
          version: "2.1",
          test: this.isSandbox,
          transaction_type: "payment",
          attempts: 3,
          order: {
            amount: amountCents,
            currency: "BYN",
            description: `Оплата куклы «${params.dollTitle}» по заказу #${params.orderNumber} в DollShop.by`,
            tracking_id: params.orderId,
          },
          settings: {
            return_url: params.returnUrl,
            notification_url: params.notificationUrl,
            language: "ru",
          },
          customer: {
            name: params.customerName,
            phone: params.customerPhone,
            email: params.customerEmail || undefined,
          },
        },
      };

      const response = await fetch(`${this.baseUrl}/ctp/api/checkouts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("bePaid API createCardPayment error:", errText);
        return {
          success: false,
          error: "Не удалось инициировать платёжную сессию в bePaid",
        };
      }

      const data = (await response.json()) as {
        checkout?: {
          token?: string;
          redirect_url?: string;
        };
      };

      if (!data.checkout?.redirect_url) {
        return {
          success: false,
          error: "bePaid не вернул ссылку на оплату",
        };
      }

      return {
        success: true,
        paymentId: data.checkout.token,
        redirectUrl: data.checkout.redirect_url,
      };
    } catch (err) {
      console.error("bePaid connection exception:", err);
      return {
        success: false,
        error: "Ошибка связи с платёжным шлюзом bePaid",
      };
    }
  }

  async createEripInvoice(params: EripInvoiceParams): Promise<EripInvoiceResult> {
    const eripTreePath =
      "Система «Расчет» (ЕРИП) → Интернет-магазины/сервисы → D → DollShop.by";
    const eripAccount = String(params.orderNumber);
    const mockPaymentId = `erip_${params.orderNumber}_${Date.now()}`;

    // Формирование стандартного QR-кода платежей в Беларуси (стандарт ГОСТ / ЕРИП)
    const amountCents = Math.round(params.amountByn * 100);
    const qrPayload = `ST00012|Name=ИП Прокопенко А. В.|PersonalAcc=BY99AKBB12345678901234567890|BankName=ОАО АСБ Беларусбанк|BIC=AKBBBY2X|PayeeINN=193758204|Purpose=Заказ №${params.orderNumber} в DollShop.by|Sum=${amountCents}`;

    const instructions =
      `Для оплаты в мобильном банке:\n` +
      `1. Войдите в приложение любого белорусского банка;\n` +
      `2. Выберите: Платежи ЕРИП → Интернет-магазины/сервисы → D → DollShop.by;\n` +
      `3. Введите номер счёта: ${eripAccount};\n` +
      `4. Проверьте сумму (${params.amountByn.toFixed(2)} BYN) и подтвердите платёж.`;

    return {
      success: true,
      paymentId: mockPaymentId,
      eripAccount,
      eripTreePath,
      qrPayload,
      instructions,
    };
  }

  async verifyWebhook(
    headers: Headers,
    rawBody: string
  ): Promise<WebhookVerificationResult> {
    // 1. Проверка авторизации вебхука
    if (this.shopId && this.secretKey) {
      const authHeader = headers.get("authorization");
      const expectedAuth = `Basic ${Buffer.from(`${this.shopId}:${this.secretKey}`).toString("base64")}`;

      if (authHeader) {
        const providedHash = crypto.createHash("sha256").update(authHeader).digest();
        const expectedHash = crypto.createHash("sha256").update(expectedAuth).digest();
        if (!crypto.timingSafeEqual(providedHash, expectedHash)) {
          return { valid: false, error: "Неверная подпись вебхука bePaid" };
        }
      }
    }

    try {
      const parsed = JSON.parse(rawBody) as {
        transaction?: {
          uid?: string;
          status?: string;
          amount?: number;
          currency?: string;
          tracking_id?: string;
          payment_method_type?: string;
          order?: {
            id?: string;
          };
        };
      };

      const tx = parsed.transaction;
      if (!tx) {
        return { valid: false, error: "Отсутствует объект transaction в вебхуке" };
      }

      let status: "successful" | "failed" | "expired" = "failed";
      if (tx.status === "successful") {
        status = "successful";
      } else if (tx.status === "expired") {
        status = "expired";
      }

      const amountByn = tx.amount ? tx.amount / 100 : undefined;
      const orderId = tx.tracking_id;
      const paymentMethod =
        tx.payment_method_type === "erip" ? ("erip" as const) : ("card" as const);

      return {
        valid: true,
        paymentId: tx.uid,
        orderId,
        status,
        amountByn,
        paymentMethod,
        rawEvent: parsed,
      };
    } catch {
      return { valid: false, error: "Невалидный JSON в теле вебхука" };
    }
  }

  async getStatus(paymentId: string): Promise<PaymentStatusResult> {
    return {
      paymentId,
      status: "pending",
    };
  }
}

let providerInstance: PaymentProvider | null = null;

export function getPaymentProvider(): PaymentProvider {
  if (!providerInstance) {
    providerInstance = new BePaidPaymentProvider();
  }
  return providerInstance;
}
