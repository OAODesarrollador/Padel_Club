export function getPublicClubId() {
  const raw = process.env.PUBLIC_CLUB_ID || "1";
  const clubId = Number(raw);
  if (!Number.isInteger(clubId) || clubId <= 0) {
    throw new Error("PUBLIC_CLUB_ID inválido");
  }
  return clubId;
}
