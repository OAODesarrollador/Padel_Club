"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";

const FeedbackContext = createContext(null);

export function FeedbackProvider({ children }) {
  const [dialog, setDialog] = useState(null);

  const api = useMemo(
    () => ({
      showError(payload) {
        setDialog({
          type: "error",
          title: payload.title || "Ocurrió un error",
          message: payload.message || "No se pudo completar la acción.",
          solution: payload.solution || "Intentá nuevamente en unos segundos.",
          code: payload.code || null
        });
      },
      showSuccess(payload) {
        setDialog({
          type: "success",
          title: payload.title || "Acción completada",
          message: payload.message || "Operación exitosa.",
          solution: payload.solution || "",
          code: null
        });
      },
      close() {
        setDialog(null);
      }
    }),
    []
  );

  return (
    <FeedbackContext.Provider value={api}>
      {children}
      {dialog ? (
        <div className="fixed inset-0 z-[100] grid place-content-center bg-black/45 px-4">
          <div className="surface-card w-full max-w-md p-5">
            <p className={`status-badge mb-2 ${dialog.type === "error" ? "status-badge--reserved" : "status-badge--confirmed"}`}>
              {dialog.type === "error" ? "Error" : "Éxito"}
            </p>
            <h3 className="text-2xl font-black">{dialog.title}</h3>
            <p className="mt-2 text-sm">{dialog.message}</p>
            {dialog.solution ? (
              <div className={`alert mt-3 ${dialog.type === "error" ? "alert-danger" : "alert-success"}`}>
                <span className="fw-bold">Posible solución:</span> {dialog.solution}
              </div>
            ) : null}
            {dialog.code ? <p className="mt-2 text-xs text-muted">Código: {dialog.code}</p> : null}
            <Button className="mt-4 w-full" onClick={api.close}>Entendido</Button>
          </div>
        </div>
      ) : null}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const value = useContext(FeedbackContext);
  if (!value) {
    throw new Error("useFeedback debe usarse dentro de FeedbackProvider");
  }
  return value;
}
