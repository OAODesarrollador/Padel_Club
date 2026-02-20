import "./globals.css";
import "@/styles/theme.css";
import { FeedbackProvider } from "@/components/ui/FeedbackProvider";

export const metadata = {
  title: "Club Deportivo - Reservas",
  description: "Sistema de reservas de canchas con pagos y panel admin."
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="app-video-bg" aria-hidden="true">
          <video autoPlay muted loop playsInline preload="metadata">
            <source src="/images/padel-match.mp4" type="video/mp4" />
          </video>
          <div className="app-video-overlay" />
        </div>
        <FeedbackProvider>
          <div className="app-shell">
            <div className="phone-frame">{children}</div>
          </div>
        </FeedbackProvider>
      </body>
    </html>
  );
}
