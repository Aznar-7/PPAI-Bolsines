package ar.edu.utn.frc.dsi.bolsines.servicio;

import ar.edu.utn.frc.dsi.bolsines.control.dto.BolsinResumen;
import ar.edu.utn.frc.dsi.bolsines.control.dto.ResumenRecepcion;
import ar.edu.utn.frc.dsi.bolsines.entity.ComisionMedica;
import ar.edu.utn.frc.dsi.bolsines.entity.SituacionRecepcion;
import ar.edu.utn.frc.dsi.bolsines.repository.ComisionMedicaRepository;
import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * CU 29 Notificar recepcion de bolsin, SIMULADO. Duenio: T2 (Vale).
 *
 * No manda mails: arma un aviso por cada CM de origen (a que email, que bolsin, que paso con cada
 * documento), lo deja en el log como [MAIL SIMULADO] y lo devuelve para que la pantalla de exito
 * lo muestre como "Enviado". La catedra permite simular el envio.
 *
 * El gestor solo conoce InterfazNotificacion: para mandar mails de verdad se reemplaza esta clase
 * por otra implementacion y el gestor no cambia.
 */
@Service
public class NotificacionSimulada implements InterfazNotificacion {

    private static final Logger log = LoggerFactory.getLogger(NotificacionSimulada.class);

    private final ComisionMedicaRepository comisionMedicaRepository;

    public NotificacionSimulada(ComisionMedicaRepository comisionMedicaRepository) {
        this.comisionMedicaRepository = comisionMedicaRepository;
    }

    @Override
    public List<AvisoNotificacion> notificarRecepcion(ResumenRecepcion resumen) {
        BolsinResumen bolsin = resumen.bolsin().bolsin();
        String asunto = "Recepción del bolsín " + bolsin.numeroBolsin() + " (precinto " + bolsin.numeroPrecinto()
                + ") en " + resumen.bolsin().cmDestino();
        List<String> detalle = armarDetalle(resumen);

        List<AvisoNotificacion> avisos = new ArrayList<>();
        for (String cmOrigen : resumen.cmANotificar()) {
            String email = comisionMedicaRepository.findByName(cmOrigen)
                    .map(ComisionMedica::getEmail)
                    .orElse("(sin email registrado)");
            AvisoNotificacion aviso = new AvisoNotificacion(cmOrigen, email, asunto, detalle);
            log.info("[MAIL SIMULADO] Para: {} <{}> | Asunto: {} | {}", cmOrigen, email, asunto, String.join(" | ", detalle));
            avisos.add(aviso);
        }
        return avisos;
    }

    /** Cuantas llegaron bien y, una por una, las que no llegaron, no correspondian o se redirigen. */
    private List<String> armarDetalle(ResumenRecepcion resumen) {
        List<String> detalle = new ArrayList<>();
        detalle.add("Recibidas y aceptadas: " + resumen.cantidad(SituacionRecepcion.RECIBIDA)
                + " de " + resumen.documentacion().size());
        for (ResumenRecepcion.Documento documento : resumen.documentacion()) {
            String linea = switch (documento.situacion()) {
                case RECIBIDA -> null;
                case FALTANTE -> "No recibida: ";
                case NO_CORRESPONDE -> "Rechazada, no corresponde a esta comisión: ";
                case REDIRIGIR -> "Para redirigir a un área interna: ";
            };
            if (linea != null) {
                detalle.add(linea + documento.asunto() + " (remito " + documento.remito() + ")");
            }
        }
        return detalle;
    }
}
