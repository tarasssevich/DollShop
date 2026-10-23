export interface CardPaymentParams {
  orderId: string;
  orderNumber: number;
  amountByn: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  dollTitle: string;
  returnUrl: string;
  notificationUrl?: string;
}

export interface CardPaymentResult {
  success: boolean;
  paymentId?: string;
  redirectUrl?: string;
  error?: string;
}

export interface EripInvoiceParams {
  orderId: string;
  orderNumber: number;
  amountByn: number;
  customerName: string;
  customerPhone: string;
  dollTitle: string;
  notificationUrl?: string;
}

export interface EripInvoiceResult {
  success: boolean;
  paymentId?: string;
  eripAccount: string;
  eripTreePath: string;
  qrPayload: string;
  instructions: string;
  error?: string;
}

export interface WebhookVerificationResult {
  valid: boolean;
  paymentId?: string;
  orderId?: string;
  orderNumber?: number;
  status?: "successful" | "failed" | "expired";
  amountByn?: number;
  paymentMethod?: "card" | "erip";
  rawEvent?: unknown;
  error?: string;
}

export interface PaymentStatusResult {
  paymentId: string;
  status: "pending" | "successful" | "failed" | "expired";
  amountByn?: number;
  paidAt?: Date;
}

/**
 * Интерфейс провайдера онлайн-платежей (карты + ЕРИП).
 * Позволяет легко переключаться между реальным шлюзом (bePaid/Express-Pay) и локальным Sandbox.
 */
export interface PaymentProvider {
  name: string;
  isSandbox: boolean;
  createCardPayment(params: CardPaymentParams): Promise<CardPaymentResult>;
  createEripInvoice(params: EripInvoiceParams): Promise<EripInvoiceResult>;
  verifyWebhook(headers: Headers, rawBody: string): Promise<WebhookVerificationResult>;
  getStatus(paymentId: string): Promise<PaymentStatusResult>;
}
