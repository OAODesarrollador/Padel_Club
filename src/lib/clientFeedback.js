export function mapApiError({ error, status, fallbackMessage, fallbackSolution }) {
  const raw = typeof error === "string" ? error : fallbackMessage || "No se pudo completar la operación.";
  const normalized = String(raw).toUpperCase();

  if (normalized.includes("SLOT_TAKEN") || raw.includes("Horario no disponible")) {
    return {
      title: "Horario ocupado",
      message: "Ese turno ya no está disponible.",
      solution: "Actualizá la disponibilidad y elegí otro horario."
    };
  }

  if (normalized.includes("HOLD_EXPIRED")) {
    return {
      title: "Reserva temporal vencida",
      message: "El hold de 7 minutos expiró antes de confirmar.",
      solution: "Volvé a seleccionar el horario y confirmá nuevamente."
    };
  }

  if (normalized.includes("RATE LIMIT")) {
    return {
      title: "Demasiados intentos",
      message: "El sistema bloqueó temporalmente la acción por seguridad.",
      solution: "Esperá 1 minuto y volvé a intentar."
    };
  }

  if (status === 401 || normalized.includes("CREDENCIALES")) {
    return {
      title: "Acceso no válido",
      message: "Email o contraseña incorrectos.",
      solution: "Revisá tus credenciales e intentá de nuevo."
    };
  }

  if (status === 404 || normalized.includes("NO ENCONTRADA") || normalized.includes("NO ENCONTRADO")) {
    return {
      title: "Recurso no encontrado",
      message: raw,
      solution: "Refrescá la página. Si persiste, creá la reserva de nuevo."
    };
  }

  if (status === 500) {
    return {
      title: "Error interno",
      message: raw || "Ocurrió un error del servidor.",
      solution: "Intentá otra vez en unos segundos."
    };
  }

  return {
    title: "No se pudo completar la acción",
    message: raw,
    solution: fallbackSolution || "Verificá los datos y volvé a intentar."
  };
}
