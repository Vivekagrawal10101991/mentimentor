/** Common dial codes for phone OTP / profile forms. */
export const COUNTRY_CODES = [
  { code: "+91", label: "India", flag: "🇮🇳", iso2: "in" },
  { code: "+1", label: "United States", flag: "🇺🇸", iso2: "us" },
  { code: "+44", label: "United Kingdom", flag: "🇬🇧", iso2: "gb" },
  { code: "+61", label: "Australia", flag: "🇦🇺", iso2: "au" },
  { code: "+971", label: "UAE", flag: "🇦🇪", iso2: "ae" },
  { code: "+65", label: "Singapore", flag: "🇸🇬", iso2: "sg" },
  { code: "+81", label: "Japan", flag: "🇯🇵", iso2: "jp" },
  { code: "+49", label: "Germany", flag: "🇩🇪", iso2: "de" },
  { code: "+33", label: "France", flag: "🇫🇷", iso2: "fr" },
  { code: "+86", label: "China", flag: "🇨🇳", iso2: "cn" },
  { code: "+82", label: "South Korea", flag: "🇰🇷", iso2: "kr" },
  { code: "+60", label: "Malaysia", flag: "🇲🇾", iso2: "my" },
  { code: "+92", label: "Pakistan", flag: "🇵🇰", iso2: "pk" },
  { code: "+880", label: "Bangladesh", flag: "🇧🇩", iso2: "bd" },
  { code: "+94", label: "Sri Lanka", flag: "🇱🇰", iso2: "lk" },
  { code: "+977", label: "Nepal", flag: "🇳🇵", iso2: "np" },
] as const;

export type CountryCode = (typeof COUNTRY_CODES)[number]["code"];

export function iso2ForDialCode(dialCode: string): string | undefined {
  return COUNTRY_CODES.find((c) => c.code === dialCode)?.iso2;
}
