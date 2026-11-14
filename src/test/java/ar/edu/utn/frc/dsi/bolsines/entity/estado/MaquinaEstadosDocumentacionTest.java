package ar.edu.utn.frc.dsi.bolsines.entity.estado;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import ar.edu.utn.frc.dsi.bolsines.entity.CambioEstadoDocumentacion;
import ar.edu.utn.frc.dsi.bolsines.entity.Documentacion;
import ar.edu.utn.frc.dsi.bolsines.entity.Empleado;
import ar.edu.utn.frc.dsi.bolsines.entity.TipoDocumentacion;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

/** Maquina de estados de Documentacion (PPAI-2-ME-V1), probada a traves del contexto. Sin Spring. */
class MaquinaEstadosDocumentacionTest {

    /** Una operacion de Documentacion, para poder pasarla como parametro. */
    @FunctionalInterface
    interface Operacion {
        void aplicar(Documentacion documentacion, LocalDateTime fechaHoraActual, Empleado empleado);
    }

    private static final LocalDateTime FECHA_PASE = LocalDateTime.of(2026, 11, 1, 8, 0);
    private static final LocalDateTime FECHA_OPERACION = LocalDateTime.of(2026, 11, 14, 10, 30);

    private final TipoDocumentacion tipo = new TipoDocumentacion("Expediente", "Expediente de prueba");
    private final Empleado empleadoPrevio = new Empleado("Ana", "Lopez", "ana@ejemplo.com", null, null);
    private final Empleado empleado = new Empleado("Juan", "Perez", "juan@ejemplo.com", null, null);

    // ---------- caminos para llegar a cada estado desde Registrada ----------

    private static final Operacion[] A_REGISTRADA = {};
    private static final Operacion[] A_EN_REMITO = {Documentacion::remitar};
    private static final Operacion[] A_EN_BOLSIN_SALIENTE = {Documentacion::remitar, Documentacion::generarBolsin};
    private static final Operacion[] A_EN_BOLSIN_ENVIADO = {Documentacion::remitar, Documentacion::generarBolsin,
            Documentacion::retirarBolsin};
    private static final Operacion[] A_PARA_REDIRIGIR = {Documentacion::remitar, Documentacion::generarBolsin,
            Documentacion::retirarBolsin, Documentacion::redirigir};
    private static final Operacion[] A_RECIBIDA_Y_RECHAZADA = {Documentacion::remitar, Documentacion::generarBolsin,
            Documentacion::retirarBolsin, Documentacion::rechazar};
    private static final Operacion[] A_NO_RECIBIDA = {Documentacion::remitar, Documentacion::generarBolsin,
            Documentacion::retirarBolsin, Documentacion::registrarFaltaDocumentacion};
    private static final Operacion[] A_RECIBIDA_Y_ACEPTADA = {Documentacion::remitar, Documentacion::generarBolsin,
            Documentacion::retirarBolsin, Documentacion::aceptar};
    private static final Operacion[] A_DE_BAJA = {Documentacion::remitar, Documentacion::generarBolsin,
            Documentacion::retirarBolsin, Documentacion::registrarFaltaDocumentacion, Documentacion::darDeBaja};

    private static final Map<String, Operacion> TODAS_LAS_OPERACIONES = new LinkedHashMap<>();

    static {
        TODAS_LAS_OPERACIONES.put("remitar", Documentacion::remitar);
        TODAS_LAS_OPERACIONES.put("cancelarRemito", Documentacion::cancelarRemito);
        TODAS_LAS_OPERACIONES.put("generarBolsin", Documentacion::generarBolsin);
        TODAS_LAS_OPERACIONES.put("modificarBolsin", Documentacion::modificarBolsin);
        TODAS_LAS_OPERACIONES.put("eliminarBolsin", Documentacion::eliminarBolsin);
        TODAS_LAS_OPERACIONES.put("retirarBolsin", Documentacion::retirarBolsin);
        TODAS_LAS_OPERACIONES.put("aceptar", Documentacion::aceptar);
        TODAS_LAS_OPERACIONES.put("rechazar", Documentacion::rechazar);
        TODAS_LAS_OPERACIONES.put("registrarFaltaDocumentacion", Documentacion::registrarFaltaDocumentacion);
        TODAS_LAS_OPERACIONES.put("redirigir", Documentacion::redirigir);
        TODAS_LAS_OPERACIONES.put("reenviar", Documentacion::reenviar);
        TODAS_LAS_OPERACIONES.put("darDeBaja", Documentacion::darDeBaja);
    }

    /** Crea una documentacion y la lleva por el camino dado, una hora despues de cada paso. */
    private Documentacion documentacionEn(Operacion[] camino) {
        Documentacion documentacion = new Documentacion("Asunto de prueba", FECHA_PASE, 1, tipo);
        LocalDateTime fecha = FECHA_PASE;
        for (Operacion paso : camino) {
            fecha = fecha.plusHours(1);
            paso.aplicar(documentacion, fecha, empleadoPrevio);
        }
        return documentacion;
    }

    // ---------- estado inicial ----------

    @Test
    void arrancaEnRegistradaConUnSoloCambioAbierto() {
        Documentacion documentacion = new Documentacion("Asunto de prueba", FECHA_PASE, 1, tipo);

        assertInstanceOf(Registrada.class, documentacion.getEstado());
        assertEquals(1, documentacion.getCambiosEstado().size());
        CambioEstadoDocumentacion primero = documentacion.getCambiosEstado().get(0);
        assertTrue(primero.esActual());
        assertNull(primero.getFechaHoraFin());
        assertInstanceOf(Registrada.class, primero.getEstado());
        assertEquals(FECHA_PASE, primero.getFechaHoraInicio());
        assertNull(primero.getResponsableCE());
    }

    // ---------- las 15 transiciones validas ----------

    static Stream<Arguments> transicionesValidas() {
        return Stream.of(
                valida("Registrada --remitar--> EnRemito", A_REGISTRADA, Documentacion::remitar, EnRemito.class),
                valida("EnRemito --cancelarRemito--> Registrada", A_EN_REMITO, Documentacion::cancelarRemito, Registrada.class),
                valida("EnRemito --generarBolsin--> EnBolsinSaliente", A_EN_REMITO, Documentacion::generarBolsin, EnBolsinSaliente.class),
                valida("EnBolsinSaliente --modificarBolsin--> EnRemito", A_EN_BOLSIN_SALIENTE, Documentacion::modificarBolsin, EnRemito.class),
                valida("EnBolsinSaliente --eliminarBolsin--> EnRemito", A_EN_BOLSIN_SALIENTE, Documentacion::eliminarBolsin, EnRemito.class),
                valida("EnBolsinSaliente --retirarBolsin--> EnBolsinEnviado", A_EN_BOLSIN_SALIENTE, Documentacion::retirarBolsin, EnBolsinEnviado.class),
                valida("EnBolsinEnviado --aceptar--> RecibidaYAceptada", A_EN_BOLSIN_ENVIADO, Documentacion::aceptar, RecibidaYAceptada.class),
                valida("EnBolsinEnviado --rechazar--> RecibidaYRechazada", A_EN_BOLSIN_ENVIADO, Documentacion::rechazar, RecibidaYRechazada.class),
                valida("EnBolsinEnviado --registrarFaltaDocumentacion--> NoRecibida", A_EN_BOLSIN_ENVIADO, Documentacion::registrarFaltaDocumentacion, NoRecibida.class),
                valida("EnBolsinEnviado --redirigir--> ParaRedirigir", A_EN_BOLSIN_ENVIADO, Documentacion::redirigir, ParaRedirigir.class),
                valida("ParaRedirigir --aceptar--> RecibidaYAceptada", A_PARA_REDIRIGIR, Documentacion::aceptar, RecibidaYAceptada.class),
                valida("ParaRedirigir --rechazar--> RecibidaYRechazada", A_PARA_REDIRIGIR, Documentacion::rechazar, RecibidaYRechazada.class),
                valida("RecibidaYRechazada --reenviar--> Registrada", A_RECIBIDA_Y_RECHAZADA, Documentacion::reenviar, Registrada.class),
                valida("NoRecibida --cancelarRemito--> Registrada", A_NO_RECIBIDA, Documentacion::cancelarRemito, Registrada.class),
                valida("NoRecibida --darDeBaja--> DeBaja", A_NO_RECIBIDA, Documentacion::darDeBaja, DeBaja.class));
    }

    private static Arguments valida(String nombre, Operacion[] camino, Operacion operacion,
                                    Class<? extends EstadoDocumentacion> destino) {
        return Arguments.of(nombre, camino, operacion, destino);
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("transicionesValidas")
    void transicionValida(String nombre, Operacion[] camino, Operacion operacion,
                          Class<? extends EstadoDocumentacion> destino) {
        Documentacion documentacion = documentacionEn(camino);
        List<CambioEstadoDocumentacion> cambios = documentacion.getCambiosEstado();
        int cantidadAntes = cambios.size();
        CambioEstadoDocumentacion anterior = cambios.get(cantidadAntes - 1);

        operacion.aplicar(documentacion, FECHA_OPERACION, empleado);

        // estado destino
        assertInstanceOf(destino, documentacion.getEstado());
        // el cambio anterior quedo cerrado con la fecha de la operacion
        assertFalse(anterior.esActual());
        assertEquals(FECHA_OPERACION, anterior.getFechaHoraFin());
        // se agrego un cambio nuevo, abierto, con su estado y empleado
        assertEquals(cantidadAntes + 1, cambios.size());
        CambioEstadoDocumentacion nuevo = cambios.get(cambios.size() - 1);
        assertTrue(nuevo.esActual());
        assertInstanceOf(destino, nuevo.getEstado());
        assertEquals(FECHA_OPERACION, nuevo.getFechaHoraInicio());
        assertSame(empleado, nuevo.getResponsableCE());
        // siempre hay un unico cambio abierto
        assertEquals(1, cambios.stream().filter(CambioEstadoDocumentacion::esActual).count());
    }

    // ---------- transiciones invalidas ----------

    static Stream<Arguments> transicionesInvalidas() {
        return Stream.of(
                Arguments.of("Registrada no permite aceptar", A_REGISTRADA, (Operacion) Documentacion::aceptar),
                Arguments.of("Registrada no permite generarBolsin", A_REGISTRADA, (Operacion) Documentacion::generarBolsin),
                Arguments.of("EnRemito no permite retirarBolsin", A_EN_REMITO, (Operacion) Documentacion::retirarBolsin),
                Arguments.of("EnBolsinSaliente no permite aceptar", A_EN_BOLSIN_SALIENTE, (Operacion) Documentacion::aceptar),
                Arguments.of("EnBolsinEnviado no permite remitar", A_EN_BOLSIN_ENVIADO, (Operacion) Documentacion::remitar),
                Arguments.of("EnBolsinEnviado no permite darDeBaja", A_EN_BOLSIN_ENVIADO, (Operacion) Documentacion::darDeBaja),
                Arguments.of("ParaRedirigir no permite redirigir", A_PARA_REDIRIGIR, (Operacion) Documentacion::redirigir),
                Arguments.of("ParaRedirigir no permite registrarFaltaDocumentacion", A_PARA_REDIRIGIR, (Operacion) Documentacion::registrarFaltaDocumentacion),
                Arguments.of("RecibidaYRechazada no permite aceptar", A_RECIBIDA_Y_RECHAZADA, (Operacion) Documentacion::aceptar),
                Arguments.of("NoRecibida no permite reenviar", A_NO_RECIBIDA, (Operacion) Documentacion::reenviar));
    }

    /** Los dos estados finales rechazan las 12 operaciones. */
    static Stream<Arguments> operacionesEnEstadosFinales() {
        Map<String, Operacion[]> finales = new LinkedHashMap<>();
        finales.put("RecibidaYAceptada", A_RECIBIDA_Y_ACEPTADA);
        finales.put("DeBaja", A_DE_BAJA);
        return finales.entrySet().stream().flatMap(estadoFinal ->
                TODAS_LAS_OPERACIONES.entrySet().stream().map(operacion -> Arguments.of(
                        estadoFinal.getKey() + " no permite " + operacion.getKey(),
                        estadoFinal.getValue(),
                        operacion.getValue())));
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource({"transicionesInvalidas", "operacionesEnEstadosFinales"})
    void transicionInvalidaNoCambiaNada(String nombre, Operacion[] camino, Operacion operacion) {
        Documentacion documentacion = documentacionEn(camino);
        EstadoDocumentacion estadoAntes = documentacion.getEstado();
        List<CambioEstadoDocumentacion> cambios = documentacion.getCambiosEstado();
        int cantidadAntes = cambios.size();
        CambioEstadoDocumentacion actualAntes = cambios.get(cantidadAntes - 1);

        assertThrows(TransicionInvalidaException.class,
                () -> operacion.aplicar(documentacion, FECHA_OPERACION, empleado));

        assertEquals(estadoAntes, documentacion.getEstado());
        assertEquals(cantidadAntes, cambios.size());
        assertTrue(actualAntes.esActual());
        assertNull(actualAntes.getFechaHoraFin());
    }
}
