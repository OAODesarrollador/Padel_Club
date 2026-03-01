import { BrandMark } from "@/components/ui/AppScaffold";

export function PublicGlobalFooter() {
  return (
    <footer className="public-global-footer" aria-label="Información del club">
      <div className="public-global-footer__inner">
        <div className="public-global-footer__grid">
          <section className="public-global-footer__block">
            <BrandMark />
            <p className="public-global-footer__text mt-2">
              Club Deportivo. Reservas simples y rápidas para tus turnos de pádel, fútbol y tenis.
            </p>
          </section>

          <section className="public-global-footer__block">
            <h3 className="public-global-footer__title">Contacto</h3>
            <p className="public-global-footer__text"><strong>Tel:</strong> +54 9 3704 00-0000</p>
            <p className="public-global-footer__text"><strong>Email:</strong> info@clubdeportivo.com</p>
            <p className="public-global-footer__text"><strong>Dirección:</strong> Av. de los Deportes 123, Ciudad Deportiva</p>
          </section>

          <section className="public-global-footer__block">
            <h3 className="public-global-footer__title">Ubicación</h3>
            <div className="public-global-footer__map-wrap">
              
              <iframe
                title="Mapa de ubicación Club Deportivo"
                src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d14321.57137654827!2d-58.175863010159325!3d-26.183896154226137!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1ses!2sar!4v1772383049432!5m2!1ses!2sar" 
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="public-global-footer__map"
              />
            </div>
          </section>
        </div>

        <div className="public-global-footer__bottom">
          <span>© {new Date().getFullYear()} Club Deportivo. Todos los derechos reservados.</span>
        </div>
      </div>
    </footer>
  );
}
