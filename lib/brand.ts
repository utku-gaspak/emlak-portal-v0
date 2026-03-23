export function getFirmName(): string {
  return process.env.NEXT_PUBLIC_FIRM_NAME?.trim() || "Emlak Portalı";
}
