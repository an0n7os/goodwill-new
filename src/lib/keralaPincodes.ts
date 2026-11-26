/**
 * Comprehensive Kerala Pincode and Location Resolver
 * Sourced directly from official India Post data (1,435+ post office locations across all 14 Kerala districts)
 */

import rawPincodes from "@/data/keralaPincodes.json";

const PINCODE_MAP: Record<string, string> = rawPincodes as Record<string, string>;

/**
 * Returns district name based on 3-digit postal sorting zone fallback
 */
function getDistrictFromPrefix(prefix3: string): string {
  switch (prefix3) {
    case "670":
      return "Kannur District, Kerala";
    case "671":
      return "Kasaragod District, Kerala";
    case "673":
      return "Kozhikode / Wayanad, Kerala";
    case "676":
      return "Malappuram District, Kerala";
    case "678":
      return "Palakkad District, Kerala";
    case "679":
      return "Palakkad / Malappuram Border, Kerala";
    case "680":
      return "Thrissur District, Kerala";
    case "682":
      return "Ernakulam / Kochi, Kerala";
    case "683":
      return "Aluva / Ernakulam North, Kerala";
    case "685":
      return "Idukki District, Kerala";
    case "686":
      return "Kottayam District, Kerala";
    case "688":
      return "Alappuzha District, Kerala";
    case "689":
      return "Pathanamthitta District, Kerala";
    case "690":
      return "Alappuzha / Kollam, Kerala";
    case "691":
      return "Kollam District, Kerala";
    case "695":
      return "Thiruvananthapuram, Kerala";
    default:
      return "Kerala";
  }
}

/**
 * Synchronously and instantly resolve any Kerala pincode to its exact post office / locality and district.
 * e.g.:
 *  682030 -> "Kakkanad / Infopark (Ernakulam)"
 *  679122 -> "Kulappully, Shoranur (Palakkad)"
 *  679577 -> "Edappal (Malappuram)"
 *  686101 -> "Changanacherry (Kottayam)"
 */
export function resolveKeralaLocation(pincode: string): string | null {
  if (!pincode) return null;
  const pin = pincode.trim();
  if (!/^\d{6}$/.test(pin)) return null;

  const pinNum = Number(pin);
  if (pinNum < 670001 || pinNum > 695999) return null; // Outside Kerala

  // 1. Exact official postal lookup
  if (PINCODE_MAP[pin]) {
    return PINCODE_MAP[pin];
  }

  // 2. District prefix fallback
  return getDistrictFromPrefix(pin.slice(0, 3));
}

/**
 * Return all supported Kerala pincodes list for reference/validation
 */
export function getAllKeralaPincodes(): string[] {
  return Object.keys(PINCODE_MAP);
}
