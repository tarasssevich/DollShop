interface FormatPriceOptions {
  showCurrency?: boolean;
  currency?: string;
}

export function formatPrice(
  amountByn: number,
  options: FormatPriceOptions = {}
): string {
  const { showCurrency = true, currency = "BYN" } = options;

  // Format with non-breaking thin space as thousand separator if needed
  const formattedNumber = new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 0,
  }).format(amountByn);

  if (!showCurrency) {
    return formattedNumber;
  }

  return `${formattedNumber} ${currency}`;
}

export function formatHeight(heightCm: number): string {
  return `${heightCm} см`;
}

export function formatYear(year: number): string {
  return `${year} г.`;
}
