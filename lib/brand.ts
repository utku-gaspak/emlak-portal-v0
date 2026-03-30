export function getFirmName(): string {
  return process.env.NEXT_PUBLIC_FIRM_NAME?.trim() || "Emlak Portalı";
}

export function getTradeAuthorizationNumber(): string {
  return process.env.NEXT_PUBLIC_TRADE_AUTH_NUMBER?.trim() || "220087";
}
