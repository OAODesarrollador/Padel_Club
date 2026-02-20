export function asUtc(dateLike) {
  return new Date(dateLike).toISOString();
}

export function addMinutes(dateLike, minutes) {
  return new Date(new Date(dateLike).getTime() + minutes * 60_000).toISOString();
}

export function toMoney(value) {
  return Number(value || 0).toFixed(2);
}

export function mapPaymentUiToMethod(value) {
  if (value === "mp") return "WALLET_MP";
  if (value === "transfer") return "TRANSFER_EXTERNAL";
  if (value === "cash") return "CASH";
  return "CASH";
}
