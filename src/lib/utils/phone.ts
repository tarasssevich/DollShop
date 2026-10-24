/**
 * Normalizes any common Belarusian phone input into strict E.164 format: +375XXXXXXXXX
 *
 * Supported inputs:
 * - "+375 (29) 123-45-67" -> "+375291234567"
 * - "8029 123-45-67"      -> "+375291234567"
 * - "8 (044) 987-65-43"   -> "+375449876543"
 * - "291234567"           -> "+375291234567"
 * - "375251112233"        -> "+375251112233"
 */
export function normalizeBelarusPhone(input: string): string | null {
  if (!input) return null;

  // Extract all digits
  let digits = input.replace(/\D/g, "");

  // If starts with 80 (e.g. 8029...), strip the leading 80 and keep the remaining 9 digits
  if (digits.startsWith("80") && digits.length === 11) {
    digits = "375" + digits.slice(2);
  } else if (digits.length === 9) {
    // Local 9-digit format without country code (e.g. 291234567)
    digits = "375" + digits;
  }

  // Must now be exactly 12 digits starting with 375
  if (!digits.startsWith("375") || digits.length !== 12) {
    return null;
  }

  const operatorCode = digits.slice(3, 5);
  const validCodes = ["25", "29", "33", "44", "17", "16", "21", "22", "23"];
  if (!validCodes.includes(operatorCode)) {
    return null;
  }

  return `+${digits}`;
}

/**
 * Checks whether a phone number is valid for Belarus.
 */
export function isValidBelarusPhone(input: string): boolean {
  return normalizeBelarusPhone(input) !== null;
}

/**
 * Formats a normalized or raw Belarusian phone for human display:
 * +375 (29) 123-45-67
 */
export function formatBelarusPhone(input: string): string {
  const normalized = normalizeBelarusPhone(input);
  if (!normalized) return input;

  const code = normalized.slice(4, 6);
  const part1 = normalized.slice(6, 9);
  const part2 = normalized.slice(9, 11);
  const part3 = normalized.slice(11, 13);

  return `+375 (${code}) ${part1}-${part2}-${part3}`;
}

/**
 * Live mask formatter for Belarusian phone input field in forms:
 * "+375 (29) 123-45-67"
 */
export function formatAsBelarusPhoneInput(input: string): string {
  if (!input || input.trim() === "") return "";

  // Extract digits
  let digits = input.replace(/\D/g, "");

  // If user starts with 80..., normalize to local
  if (digits.startsWith("80")) {
    digits = digits.slice(2);
  } else if (digits.startsWith("375")) {
    digits = digits.slice(3);
  }

  // Cap at 9 digits
  digits = digits.slice(0, 9);

  let formatted = "+375";
  if (digits.length === 0) {
    return formatted + " ";
  }

  if (digits.length > 0) {
    const op = digits.slice(0, 2);
    formatted += ` (${op}`;
    if (digits.length >= 2) {
      formatted += ") ";
    }
  }
  if (digits.length > 2) {
    formatted += digits.slice(2, 5);
  }
  if (digits.length > 5) {
    formatted += `-${digits.slice(5, 7)}`;
  }
  if (digits.length > 7) {
    formatted += `-${digits.slice(7, 9)}`;
  }

  return formatted;
}

