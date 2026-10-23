import QRCode from "qrcode";

export const ERIP_CONFIG = {
  serviceName: "DollShop.by",
  serviceCode: process.env.BEPAID_ERIP_SERVICE_NO || "4442111",
  treeSteps: [
    "Система «Расчет» (ЕРИП)",
    "Интернет-магазины/сервисы",
    "D",
    "DollShop.by — авторские куклы",
  ],
};

export interface EripInstructionData {
  serviceName: string;
  serviceCode: string;
  treeSteps: string[];
  accountNumber: string; // Номер заказа
  amountByn: number;
  qrPayload: string;
}

/**
 * Возвращает структурированные данные для оплаты через систему ЕРИП.
 */
export function getEripInstructionData(
  orderNumber: number,
  amountByn: number
): EripInstructionData {
  const accountNumber = String(orderNumber);
  // Стандартный формат для ЕРИП QR-кода (АИС «Расчет»)
  const amountKopecks = Math.round(amountByn * 100);
  const qrPayload = `ST00012|Name=${ERIP_CONFIG.serviceName}|ServiceId=${ERIP_CONFIG.serviceCode}|PersonalAcc=${accountNumber}|Sum=${amountKopecks}|Cur=BYN`;

  return {
    serviceName: ERIP_CONFIG.serviceName,
    serviceCode: ERIP_CONFIG.serviceCode,
    treeSteps: ERIP_CONFIG.treeSteps,
    accountNumber,
    amountByn,
    qrPayload,
  };
}

/**
 * Генерирует QR-код в формате DataURL (PNG base64) для отображения на странице или встраивания в SVG.
 */
export async function generateEripQrDataUrl(
  orderNumber: number,
  amountByn: number
): Promise<string> {
  const { qrPayload } = getEripInstructionData(orderNumber, amountByn);
  try {
    return await QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 256,
      color: {
        dark: "#2A2521", // terracotta/espresso dark color
        light: "#FFFFFF",
      },
    });
  } catch (err) {
    console.error("Ошибка генерации QR-кода ЕРИП:", err);
    return "";
  }
}
