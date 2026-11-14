package ar.edu.utn.frc.dsi.bolsines.entity.estado;

import ar.edu.utn.frc.dsi.bolsines.entity.CambioEstadoDocumentacion;
import ar.edu.utn.frc.dsi.bolsines.entity.Documentacion;
import ar.edu.utn.frc.dsi.bolsines.entity.Empleado;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Estado concreto. Duenio: T3 (Trini).
 */
public class NoRecibida extends EstadoDocumentacion {

    @Override
    public void cancelarRemito(Documentacion documentacion, LocalDateTime fechaHoraActual,
                               Empleado empleado, List<CambioEstadoDocumentacion> cambiosEstado) {
        CambioEstadoDocumentacion actual = buscarCEActual(cambiosEstado);
        actual.setFechaHoraFin(fechaHoraActual);
        EstadoDocumentacion nuevoEstado = new Registrada();
        CambioEstadoDocumentacion nuevoCambio = crearCambioEstado(fechaHoraActual, nuevoEstado, empleado);
        documentacion.setEstado(nuevoEstado);
        documentacion.agregarCambioEstado(nuevoCambio);
    }

    @Override
    public void darDeBaja(Documentacion documentacion, LocalDateTime fechaHoraActual,
                          Empleado empleado, List<CambioEstadoDocumentacion> cambiosEstado) {
        CambioEstadoDocumentacion actual = buscarCEActual(cambiosEstado);
        actual.setFechaHoraFin(fechaHoraActual);
        EstadoDocumentacion nuevoEstado = new DeBaja();
        CambioEstadoDocumentacion nuevoCambio = crearCambioEstado(fechaHoraActual, nuevoEstado, empleado);
        documentacion.setEstado(nuevoEstado);
        documentacion.agregarCambioEstado(nuevoCambio);
    }
}
