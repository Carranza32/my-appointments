export type CountryPreset = {
  code: string;
  name: string;
  flag: string;
  timezone: string;
  currency: string;
  currencySymbol: string;
  phonePrefix: string;
  phonePlaceholder: string;
  gmt: string;
  popular?: boolean;
};

export const COUNTRY_PRESETS: CountryPreset[] = [
  {
    code: "SV",
    name: "El Salvador",
    flag: "🇸🇻",
    timezone: "America/El_Salvador",
    currency: "USD",
    currencySymbol: "$",
    phonePrefix: "+503",
    phonePlaceholder: "7123-4567",
    gmt: "GMT-6",
    popular: true,
  },
  {
    code: "MX",
    name: "México",
    flag: "🇲🇽",
    timezone: "America/Mexico_City",
    currency: "MXN",
    currencySymbol: "$",
    phonePrefix: "+52",
    phonePlaceholder: "55 1234 5678",
    gmt: "GMT-6",
    popular: true,
  },
  {
    code: "CO",
    name: "Colombia",
    flag: "🇨🇴",
    timezone: "America/Bogota",
    currency: "COP",
    currencySymbol: "$",
    phonePrefix: "+57",
    phonePlaceholder: "300 123 4567",
    gmt: "GMT-5",
    popular: true,
  },
  {
    code: "GT",
    name: "Guatemala",
    flag: "🇬🇹",
    timezone: "America/Guatemala",
    currency: "GTQ",
    currencySymbol: "Q",
    phonePrefix: "+502",
    phonePlaceholder: "5123-4567",
    gmt: "GMT-6",
    popular: true,
  },
  {
    code: "CR",
    name: "Costa Rica",
    flag: "🇨🇷",
    timezone: "America/Costa_Rica",
    currency: "CRC",
    currencySymbol: "₡",
    phonePrefix: "+506",
    phonePlaceholder: "8123-4567",
    gmt: "GMT-6",
    popular: true,
  },
  {
    code: "HN",
    name: "Honduras",
    flag: "🇭🇳",
    timezone: "America/Tegucigalpa",
    currency: "HNL",
    currencySymbol: "L",
    phonePrefix: "+504",
    phonePlaceholder: "9123-4567",
    gmt: "GMT-6",
  },
  {
    code: "NI",
    name: "Nicaragua",
    flag: "🇳🇮",
    timezone: "America/Managua",
    currency: "NIO",
    currencySymbol: "C$",
    phonePrefix: "+505",
    phonePlaceholder: "8123-4567",
    gmt: "GMT-6",
  },
  {
    code: "PA",
    name: "Panamá",
    flag: "🇵🇦",
    timezone: "America/Panama",
    currency: "USD",
    currencySymbol: "$",
    phonePrefix: "+507",
    phonePlaceholder: "6123-4567",
    gmt: "GMT-5",
  },
  {
    code: "PE",
    name: "Perú",
    flag: "🇵🇪",
    timezone: "America/Lima",
    currency: "PEN",
    currencySymbol: "S/",
    phonePrefix: "+51",
    phonePlaceholder: "912 345 678",
    gmt: "GMT-5",
    popular: true,
  },
  {
    code: "EC",
    name: "Ecuador",
    flag: "🇪🇨",
    timezone: "America/Guayaquil",
    currency: "USD",
    currencySymbol: "$",
    phonePrefix: "+593",
    phonePlaceholder: "099 123 4567",
    gmt: "GMT-5",
  },
  {
    code: "CL",
    name: "Chile",
    flag: "🇨🇱",
    timezone: "America/Santiago",
    currency: "CLP",
    currencySymbol: "$",
    phonePrefix: "+56",
    phonePlaceholder: "9 1234 5678",
    gmt: "GMT-4",
    popular: true,
  },
  {
    code: "AR",
    name: "Argentina",
    flag: "🇦🇷",
    timezone: "America/Argentina/Buenos_Aires",
    currency: "ARS",
    currencySymbol: "$",
    phonePrefix: "+54",
    phonePlaceholder: "11 1234-5678",
    gmt: "GMT-3",
    popular: true,
  },
  {
    code: "UY",
    name: "Uruguay",
    flag: "🇺🇾",
    timezone: "America/Montevideo",
    currency: "UYU",
    currencySymbol: "$",
    phonePrefix: "+598",
    phonePlaceholder: "99 123 456",
    gmt: "GMT-3",
  },
  {
    code: "PY",
    name: "Paraguay",
    flag: "🇵🇾",
    timezone: "America/Asuncion",
    currency: "PYG",
    currencySymbol: "Gs",
    phonePrefix: "+595",
    phonePlaceholder: "981 123456",
    gmt: "GMT-4",
  },
  {
    code: "BO",
    name: "Bolivia",
    flag: "🇧🇴",
    timezone: "America/La_Paz",
    currency: "BOB",
    currencySymbol: "Bs",
    phonePrefix: "+591",
    phonePlaceholder: "71234567",
    gmt: "GMT-4",
  },
  {
    code: "DO",
    name: "Rep. Dominicana",
    flag: "🇩🇴",
    timezone: "America/Santo_Domingo",
    currency: "DOP",
    currencySymbol: "RD$",
    phonePrefix: "+1809",
    phonePlaceholder: "809 123 4567",
    gmt: "GMT-4",
  },
  {
    code: "US",
    name: "Estados Unidos",
    flag: "🇺🇸",
    timezone: "America/New_York",
    currency: "USD",
    currencySymbol: "$",
    phonePrefix: "+1",
    phonePlaceholder: "(555) 000-0000",
    gmt: "GMT-5",
    popular: true,
  },
  {
    code: "ES",
    name: "España",
    flag: "🇪🇸",
    timezone: "Europe/Madrid",
    currency: "EUR",
    currencySymbol: "€",
    phonePrefix: "+34",
    phonePlaceholder: "612 34 56 78",
    gmt: "GMT+1",
    popular: true,
  },
];

export const SUPPORTED_CURRENCIES = [
  { code: "USD", symbol: "$", name: "Dólar Estadounidense (USD $)" },
  { code: "MXN", symbol: "$", name: "Peso Mexicano (MXN $)" },
  { code: "COP", symbol: "$", name: "Peso Colombiano (COP $)" },
  { code: "GTQ", symbol: "Q", name: "Quetzal Guatemalteco (GTQ Q)" },
  { code: "CRC", symbol: "₡", name: "Colón Costarricense (CRC ₡)" },
  { code: "PEN", symbol: "S/", name: "Sol Peruano (PEN S/)" },
  { code: "CLP", symbol: "$", name: "Peso Chileno (CLP $)" },
  { code: "ARS", symbol: "$", name: "Peso Argentino (ARS $)" },
  { code: "EUR", symbol: "€", name: "Euro (EUR €)" },
  { code: "HNL", symbol: "L", name: "Lempira Hondureña (HNL L)" },
  { code: "NIO", symbol: "C$", name: "Córdoba Nicaragüense (NIO C$)" },
  { code: "UYU", symbol: "$", name: "Peso Uruguayo (UYU $)" },
  { code: "DOP", symbol: "RD$", name: "Peso Dominicano (DOP RD$)" },
  { code: "BOB", symbol: "Bs", name: "Boliviano (BOB Bs)" },
  { code: "PYG", symbol: "Gs", name: "Guaraní Paraguayo (PYG Gs)" },
];

export const SUPPORTED_TIMEZONES = [
  { value: "America/El_Salvador", label: "🇸🇻 El Salvador (GMT-6)", region: "Centroamérica" },
  { value: "America/Guatemala", label: "🇬🇹 Guatemala (GMT-6)", region: "Centroamérica" },
  { value: "America/Tegucigalpa", label: "🇭🇳 Honduras (GMT-6)", region: "Centroamérica" },
  { value: "America/Managua", label: "🇳🇮 Nicaragua (GMT-6)", region: "Centroamérica" },
  { value: "America/Costa_Rica", label: "🇨🇷 Costa Rica (GMT-6)", region: "Centroamérica" },
  { value: "America/Panama", label: "🇵🇦 Panamá (GMT-5)", region: "Centroamérica" },
  { value: "America/Mexico_City", label: "🇲🇽 CDMX / México Centro (GMT-6)", region: "Norteamérica" },
  { value: "America/Monterrey", label: "🇲🇽 Monterrey / Guadalajara (GMT-6)", region: "Norteamérica" },
  { value: "America/Tijuana", label: "🇲🇽 Tijuana / Baja California (GMT-8)", region: "Norteamérica" },
  { value: "America/Bogota", label: "🇨🇴 Bogotá / Colombia (GMT-5)", region: "Sudamérica" },
  { value: "America/Lima", label: "🇵🇪 Lima / Perú (GMT-5)", region: "Sudamérica" },
  { value: "America/Guayaquil", label: "🇪🇨 Guayaquil / Quito (GMT-5)", region: "Sudamérica" },
  { value: "America/Santiago", label: "🇨🇱 Santiago / Chile (GMT-4)", region: "Sudamérica" },
  { value: "America/Argentina/Buenos_Aires", label: "🇦🇷 Buenos Aires / Argentina (GMT-3)", region: "Sudamérica" },
  { value: "America/Montevideo", label: "🇺🇾 Montevideo / Uruguay (GMT-3)", region: "Sudamérica" },
  { value: "America/Asuncion", label: "🇵🇾 Asunción / Paraguay (GMT-4)", region: "Sudamérica" },
  { value: "America/La_Paz", label: "🇧🇴 La Paz / Bolivia (GMT-4)", region: "Sudamérica" },
  { value: "America/Caracas", label: "🇻🇪 Caracas / Venezuela (GMT-4)", region: "Sudamérica" },
  { value: "America/Santo_Domingo", label: "🇩🇴 Santo Domingo / Rep. Dominicana (GMT-4)", region: "Caribe" },
  { value: "America/Puerto_Rico", label: "🇵🇷 San Juan / Puerto Rico (GMT-4)", region: "Caribe" },
  { value: "America/New_York", label: "🇺🇸 Nueva York / Miami (GMT-5)", region: "Estados Unidos" },
  { value: "America/Chicago", label: "🇺🇸 Chicago / Houston (GMT-6)", region: "Estados Unidos" },
  { value: "America/Los_Angeles", label: "🇺🇸 Los Ángeles / San Francisco (GMT-8)", region: "Estados Unidos" },
  { value: "Europe/Madrid", label: "🇪🇸 Madrid / España (GMT+1)", region: "Europa" },
];

/**
 * Detects the most appropriate CountryPreset based on an IANA timezone string.
 * Defaults to El Salvador if not found or unrecognized.
 */
export function detectCountryPreset(timeZone?: string): CountryPreset {
  if (!timeZone && typeof Intl !== "undefined") {
    try {
      timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      timeZone = "America/El_Salvador";
    }
  }

  const tz = timeZone || "America/El_Salvador";

  // Match exact timezone
  const matched = COUNTRY_PRESETS.find((p) => p.timezone.toLowerCase() === tz.toLowerCase());
  if (matched) return matched;

  // Match timezone prefix/city
  if (tz.includes("El_Salvador")) return COUNTRY_PRESETS[0];
  if (tz.includes("Mexico") || tz.includes("Monterrey") || tz.includes("Tijuana") || tz.includes("Cancun")) return COUNTRY_PRESETS[1];
  if (tz.includes("Bogota")) return COUNTRY_PRESETS[2];
  if (tz.includes("Guatemala")) return COUNTRY_PRESETS[3];
  if (tz.includes("Costa_Rica")) return COUNTRY_PRESETS[4];
  if (tz.includes("Lima")) return COUNTRY_PRESETS[8];
  if (tz.includes("Santiago")) return COUNTRY_PRESETS[10];
  if (tz.includes("Buenos_Aires")) return COUNTRY_PRESETS[11];
  if (tz.includes("Madrid")) return COUNTRY_PRESETS[17];
  if (tz.includes("New_York") || tz.includes("Los_Angeles") || tz.includes("Chicago")) return COUNTRY_PRESETS[16];

  // Default to El Salvador
  return COUNTRY_PRESETS[0];
}

export function getPresetByCode(code: string): CountryPreset | undefined {
  return COUNTRY_PRESETS.find((p) => p.code.toUpperCase() === code.toUpperCase());
}

export function getCurrencySymbol(currency: string): string {
  const found = SUPPORTED_CURRENCIES.find((c) => c.code.toUpperCase() === currency.toUpperCase());
  return found?.symbol ?? "$";
}

export function formatMoney(amount: number, currency: string = "USD"): string {
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${amount.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}
