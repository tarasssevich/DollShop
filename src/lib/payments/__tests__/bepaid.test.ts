import { describe, it, expect, beforeEach } from "vitest";
import { BePaidPaymentProvider } from "../bepaid";

describe("Phase 6 — BePaidPaymentProvider (Step 6.1 & 6.2)", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.BEPAID_SHOP_ID;
    delete process.env.BEPAID_SECRET_KEY;
  });

  it("должен использовать Sandbox эмулятор, если API ключи не заданы", async () => {
    const provider = new BePaidPaymentProvider();
    const result = await provider.createCardPayment({
      orderId: "c2c5c960-9ff1-4e78-9e19-094ec2352885",
      orderNumber: 1042,
      amountByn: 120,
      customerName: "Анна Смирнова",
      customerPhone: "+375291234567",
      dollTitle: "Фея Маргаритка",
      returnUrl: "http://localhost:3001/zakaz/sample-token",
    });

    expect(result.success).toBe(true);
    expect(result.redirectUrl).toContain("/oplata/sandbox/");
    expect(result.paymentId).toContain("bepaid_sandbox_");
  });

  it("должен формировать инструкции ЕРИП в Sandbox режиме", async () => {
    const provider = new BePaidPaymentProvider();
    const result = await provider.createEripInvoice({
      orderId: "c2c5c960-9ff1-4e78-9e19-094ec2352885",
      orderNumber: 1042,
      amountByn: 95.5,
      customerName: "Виктория",
      customerPhone: "+375297654321",
      dollTitle: "Зефирная Фея",
    });

    expect(result.success).toBe(true);
    expect(result.eripAccount).toBe("1042");
    expect(result.paymentId).toContain("erip_");
    expect(result.eripTreePath).toContain("Система «Расчет» (ЕРИП)");
    expect(result.instructions).toContain("Платежи ЕРИП");
  });

  it("должен валидировать вебхук bePaid и парсить данные транзакции", async () => {
    const provider = new BePaidPaymentProvider();
    const rawBody = JSON.stringify({
      transaction: {
        uid: "tx_12345678",
        status: "successful",
        amount: 12000,
        currency: "BYN",
        tracking_id: "c2c5c960-9ff1-4e78-9e19-094ec2352885",
        payment_method_type: "credit_card",
      },
    });

    const headers = new Headers();
    const res = await provider.verifyWebhook(headers, rawBody);

    expect(res.valid).toBe(true);
    expect(res.paymentId).toBe("tx_12345678");
    expect(res.status).toBe("successful");
    expect(res.amountByn).toBe(120);
    expect(res.paymentMethod).toBe("card");
    expect(res.orderId).toBe("c2c5c960-9ff1-4e78-9e19-094ec2352885");
  });

  it("должен отклонять вебхук с некорректным телом", async () => {
    const provider = new BePaidPaymentProvider();
    const headers = new Headers();
    const res = await provider.verifyWebhook(headers, "invalid-json-body");

    expect(res.valid).toBe(false);
    expect(res.error).toBeDefined();
  });
});
