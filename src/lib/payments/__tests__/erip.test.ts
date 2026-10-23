import { describe, it, expect } from "vitest";
import { getEripInstructionData, generateEripQrDataUrl } from "../erip";

describe("Phase 6 — ERIP Generation (Step 6.3)", () => {
  it("должен формировать корректную структуру данных для ЕРИП", () => {
    const data = getEripInstructionData(1088, 145);

    expect(data.accountNumber).toBe("1088");
    expect(data.amountByn).toBe(145);
    expect(data.serviceName).toBe("DollShop.by");
    expect(data.treeSteps).toContain("Система «Расчет» (ЕРИП)");
    expect(data.treeSteps).toContain("Интернет-магазины/сервисы");
    expect(data.qrPayload).toContain("ST00012");
    expect(data.qrPayload).toContain("PersonalAcc=1088");
    expect(data.qrPayload).toContain("Sum=14500");
  });

  it("должен генерировать Data URL с QR-кодом", async () => {
    const qrDataUrl = await generateEripQrDataUrl(1088, 145);

    expect(qrDataUrl).toBeDefined();
    expect(qrDataUrl.startsWith("data:image/png;base64,")).toBe(true);
    expect(qrDataUrl.length).toBeGreaterThan(100);
  });
});
