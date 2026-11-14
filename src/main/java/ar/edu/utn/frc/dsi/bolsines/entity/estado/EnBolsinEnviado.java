package ar.edu.utn.frc.dsi.bolsines.entity.estado;

import ar.edu.utn.frc.dsi.bolsines.entity.CambioEstadoDocumentacion;
import ar.edu.utn.frc.dsi.bolsines.entity.Documentacion;
import ar.edu.utn.frc.dsi.bolsines.entity.Empleado;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Estado concreto. Duenio: T3 (Trini).
 * El estado del CU 28.
 */
public class EnBolsinEnviado extends EstadoDocumentacion {

    @Override
    public void aceptar(Documentacion documentacion, LocalDateTime fechaHoraActual,
                        Empleado empleado, List<CambioEstadoDocumentacion> cambiosEstado) {
        CambioEstadoDocumentacion actual = buscarCEActual(cambiosEstado);
        actual.setFechaHoraFin(fechaHoraActual);
        EstadoDocumentacion nuevoEstado = new RecibidaYAceptada();
        CambioEstadoDocumentacion nuevoCambio = crearCambioEstado(fechaHoraActual, nuevoEstado, empleado);
        documentacion.setEstado(nuevoEstado);
        documentacion.agregarCambioEstado(nuevoCambio);
    }

    @Override
    public void rechazar(Documentacion documentacion, LocalDateTime fechaHoraActual,
                         Empleado empleado, List<CambioEstadoDocumentacion> cambiosEstado) {
        CambioEstadoDocumentacion actual = buscarCEActual(cambiosEstado);
        actual.setFechaHoraFin(fechaHoraActual);
        EstadoDocumentacion nuevoEstado = new RecibidaYRechazada();
        CambioEstadoDocumentacion nuevoCambio = crearCambioEstado(fechaHoraActual, nuevoEstado, empleado);
        documentacion.setEstado(nuevoEstado);
        documentacion.agregarCambioEstado(nuevoCambio);
    }

    @Override
    public void registrarFaltaDocumentacion(Documentacion documentacion, LocalDateTime fechaHoraActual,
                                            Empleado empleado, List<CambioEstadoDocumentacion> cambiosEstado) {
        CambioEstadoDocumentacion actual = buscarCEActual(cambiosEstado);
        actual.setFechaHoraFin(fechaHoraActual);
        EstadoDocumentacion nuevoEstado = new NoRecibida();
        CambioEstadoDocumentacion nuevoCambio = crearCambioEstado(fechaHoraActual, nuevoEstado, empleado);
        documentacion.setEstado(nuevoEstado);
        documentacion.agregarCambioEstado(nuevoCambio);
    }

    @Override
    public void redirigir(Documentacion documentacion, LocalDateTime fechaHoraActual,
                          Empleado empleado, List<CambioEstadoDocumentacion> cambiosEstado) {
        CambioEstadoDocumentacion actual = buscarCEActual(cambiosEstado);
        actual.setFechaHoraFin(fechaHoraActual);
        EstadoDocumentacion nuevoEstado = new ParaRedirigir();
        CambioEstadoDocumentacion nuevoCambio = crearCambioEstado(fechaHoraActual, nuevoEstado, empleado);
        documentacion.setEstado(nuevoEstado);
        documentacion.agregarCambioEstado(nuevoCambio);
    }
}
