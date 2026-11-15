package ar.edu.utn.frc.dsi.bolsines.control;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import ar.edu.utn.frc.dsi.bolsines.control.dto.DetalleBolsin;
import ar.edu.utn.frc.dsi.bolsines.control.dto.InicioRecepcion;
import ar.edu.utn.frc.dsi.bolsines.control.dto.ResultadoRecepcion;
import ar.edu.utn.frc.dsi.bolsines.control.dto.ResumenRecepcion;
import ar.edu.utn.frc.dsi.bolsines.entity.Bolsin;
import ar.edu.utn.frc.dsi.bolsines.entity.CambioEstadoBolsin;
import ar.edu.utn.frc.dsi.bolsines.entity.CambioEstadoDocumentacion;
import ar.edu.utn.frc.dsi.bolsines.entity.ComisionMedica;
import ar.edu.utn.frc.dsi.bolsines.entity.DetalleRemito;
import ar.edu.utn.frc.dsi.bolsines.entity.Documentacion;
import ar.edu.utn.frc.dsi.bolsines.entity.Empleado;
import ar.edu.utn.frc.dsi.bolsines.entity.Estado;
import ar.edu.utn.frc.dsi.bolsines.entity.Remito;
import ar.edu.utn.frc.dsi.bolsines.entity.SituacionRecepcion;
import ar.edu.utn.frc.dsi.bolsines.entity.TipoDocumentacion;
import ar.edu.utn.frc.dsi.bolsines.entity.Usuario;
import ar.edu.utn.frc.dsi.bolsines.entity.estado.EstadoDocumentacion;
import ar.edu.utn.frc.dsi.bolsines.entity.estado.NoRecibida;
import ar.edu.utn.frc.dsi.bolsines.entity.estado.ParaRedirigir;
import ar.edu.utn.frc.dsi.bolsines.entity.estado.RecibidaYAceptada;
import ar.edu.utn.frc.dsi.bolsines.entity.estado.RecibidaYRechazada;
import ar.edu.utn.frc.dsi.bolsines.repository.BolsinRepository;
import ar.edu.utn.frc.dsi.bolsines.repository.ComisionMedicaRepository;
import ar.edu.utn.frc.dsi.bolsines.repository.EmpleadoRepository;
import ar.edu.utn.frc.dsi.bolsines.repository.EstadoRepository;
import ar.edu.utn.frc.dsi.bolsines.repository.TipoDocumentacionRepository;
import ar.edu.utn.frc.dsi.bolsines.repository.UsuarioRepository;
import ar.edu.utn.frc.dsi.bolsines.servicio.AvisoNotificacion;
import ar.edu.utn.frc.dsi.bolsines.servicio.ServicioSesion;
import jakarta.persistence.EntityManager;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

/**
 * Flujo principal del CU 28 contra la base (H2 en memoria). Cada test arranca con la base vacia
 * y se deshace al terminar.
 *
 * La sesion (T2) y el mail (CU 29) se reemplazan por versiones de prueba: aca se prueba el gestor.
 */
@SpringBootTest
@Transactional
class GestorRecepcionDeBolsinesTest {

    private static final LocalDateTime AYER = LocalDateTime.now().minusDays(1);

    @Autowired private BolsinRepository bolsinRepository;
    @Autowired private EstadoRepository estadoRepository;
    @Autowired private ComisionMedicaRepository comisionMedicaRepository;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private EmpleadoRepository empleadoRepository;
    @Autowired private TipoDocumentacionRepository tipoDocumentacionRepository;
    @Autowired private EntityManager entityManager;

    private Empleado encargado;
    private Empleado encargadoCordoba;
    private Bolsin bolsinARecibir;
    private Bolsin bolsinHaciaCordoba;
    private Bolsin bolsinTodaviaCreado;

    private final List<ResumenRecepcion> notificados = new ArrayList<>();
    private GestorRecepcionDeBolsines gestor;

    @BeforeEach
    void armarEscenario() {
        ComisionMedica central = comisionMedicaRepository.save(new ComisionMedica(ComisionMedica.CODIGO_CENTRAL,
                "Comision Medica Central", "Av. Siempreviva 742", "cmc@ejemplo.com", "011-1111"));
        ComisionMedica mendoza = comisionMedicaRepository.save(new ComisionMedica("MZA", "CM Mendoza",
                "San Martin 100", "mendoza@ejemplo.com", "0261-2222"));
        ComisionMedica cordoba = comisionMedicaRepository.save(new ComisionMedica("COR", "CM Cordoba",
                "Colon 200", "cordoba@ejemplo.com", "0351-3333"));

        Usuario usuario = usuarioRepository.save(new Usuario("sromero", "1234"));
        encargado = empleadoRepository.save(new Empleado("Silvina", "Romero", "sromero@ejemplo.com", usuario, central));
        Empleado encargadoMendoza = empleadoRepository.save(new Empleado("Pedro", "Gil", "pgil@ejemplo.com", null, mendoza));

        Estado bolsinCreado = estadoRepository.save(new Estado("Creado", "", Estado.AMBITO_BOLSIN));
        Estado bolsinEnviado = estadoRepository.save(new Estado(Estado.ENVIADO, "", Estado.AMBITO_BOLSIN));
        estadoRepository.save(new Estado(Estado.RECIBIDO_EN_CM_DESTINO, "", Estado.AMBITO_BOLSIN));
        Estado remitoEnBolsinEnviado = estadoRepository.save(new Estado("En bolsin enviado", "", Estado.AMBITO_REMITO));
        estadoRepository.save(new Estado(Estado.RECIBIDO_Y_ACEPTADO, "", Estado.AMBITO_REMITO));
        estadoRepository.save(new Estado(Estado.RECIBIDO_Y_ACEPTADO_PARCIAL, "", Estado.AMBITO_REMITO));

        TipoDocumentacion expediente = tipoDocumentacionRepository.save(new TipoDocumentacion("Expediente", ""));
        TipoDocumentacion dictamen = tipoDocumentacionRepository.save(new TipoDocumentacion("Dictamen", ""));

        bolsinARecibir = new Bolsin(1287, "004512", 1250, AYER, mendoza, central);
        bolsinARecibir.agregarCambioEstado(new CambioEstadoBolsin(AYER, bolsinEnviado, encargadoMendoza));
        Remito remito213 = new Remito(213, AYER, mendoza, central, remitoEnBolsinEnviado);
        remito213.agregarDetalle(detalle(1, "Expediente de incapacidad laboral", expediente, encargadoMendoza));
        remito213.agregarDetalle(detalle(2, "Dictamen de comision", dictamen, encargadoMendoza));
        Remito remito214 = new Remito(214, AYER, mendoza, central, remitoEnBolsinEnviado);
        remito214.agregarDetalle(detalle(1, "Radiografia de rodilla", expediente, encargadoMendoza));
        bolsinARecibir.agregarRemito(remito213);
        bolsinARecibir.agregarRemito(remito214);
        bolsinRepository.save(bolsinARecibir);

        bolsinHaciaCordoba = new Bolsin(1288, "004513", 500, AYER, mendoza, cordoba);
        bolsinHaciaCordoba.agregarCambioEstado(new CambioEstadoBolsin(AYER, bolsinEnviado, encargadoMendoza));
        Remito remito300 = new Remito(300, AYER, mendoza, cordoba, remitoEnBolsinEnviado);
        remito300.agregarDetalle(detalle(1, "Carta documento", expediente, encargadoMendoza));
        bolsinHaciaCordoba.agregarRemito(remito300);
        bolsinRepository.save(bolsinHaciaCordoba);
        encargadoCordoba = empleadoRepository.save(new Empleado("Laura", "Paz", "lpaz@ejemplo.com", null, cordoba));

        bolsinTodaviaCreado = new Bolsin(1289, "004514", 300, AYER, mendoza, central);
        bolsinTodaviaCreado.agregarCambioEstado(new CambioEstadoBolsin(AYER, bolsinCreado, encargadoMendoza));
        bolsinRepository.save(bolsinTodaviaCreado);

        entityManager.flush();
        entityManager.clear();

        ServicioSesion sesionDePrueba = mock(ServicioSesion.class);
        when(sesionDePrueba.getEmpleadoLogueado()).thenReturn(encargado);
        gestor = new GestorRecepcionDeBolsines(bolsinRepository, estadoRepository, sesionDePrueba,
                resumen -> {
                    notificados.add(resumen);
                    return List.of(new AvisoNotificacion("CM Mendoza", "mendoza@ejemplo.com", "Recepcion", List.of()));
                },
                false);
    }

    /** Documentacion llevada por la maquina de estados hasta EnBolsinEnviado, como en la realidad. */
    private DetalleRemito detalle(int numero, String asunto, TipoDocumentacion tipo, Empleado empleado) {
        Documentacion documentacion = new Documentacion(asunto, AYER.minusDays(3), numero, tipo);
        documentacion.remitar(AYER.minusDays(2), empleado);
        documentacion.generarBolsin(AYER.minusDays(1), empleado);
        documentacion.retirarBolsin(AYER, empleado);
        return new DetalleRemito(numero, AYER, documentacion);
    }

    // ---------- pasos 1 a 4 ----------

    @Test
    void muestraLaCMDelUsuarioYSoloLosBolsinesEnviadosHaciaElla() {
        InicioRecepcion inicio = gestor.opcionRegistrarRecepcionDeBolsin();

        assertEquals("Silvina Romero", inicio.nombreEmpleado());
        assertEquals("Comision Medica Central", inicio.cmUsuario());
        assertTrue(inicio.cmEsCentral());
        assertEquals(1, inicio.bolsines().size(), "ni el que va a Cordoba ni el Creado tienen que aparecer");
        assertEquals("004512", inicio.bolsines().get(0).numeroPrecinto());
        assertEquals("CM Mendoza", inicio.bolsines().get(0).cmOrigen());
        assertEquals(2, inicio.bolsines().get(0).cantidadRemitos());
        assertEquals(3, inicio.bolsines().get(0).cantidadDocumentos());
    }

    // ---------- pasos 5 y 6 ----------

    @Test
    void alSeleccionarUnBolsinDevuelveRemitosYDocumentacionConAsuntoYTipo() {
        gestor.opcionRegistrarRecepcionDeBolsin();

        DetalleBolsin detalle = gestor.tomarSeleccionBolsin(bolsinARecibir.getId());

        assertEquals(2, detalle.remitos().size());
        assertEquals(213, detalle.remitos().get(0).numero());
        assertEquals("Expediente de incapacidad laboral", detalle.remitos().get(0).documentacion().get(0).asunto());
        assertEquals("Expediente", detalle.remitos().get(0).documentacion().get(0).tipo());
        assertEquals("Dictamen", detalle.remitos().get(0).documentacion().get(1).tipo());
        assertEquals(1, detalle.remitos().get(1).documentacion().size());
    }

    @Test
    void noDejaSeleccionarUnBolsinQueNoEstaPendienteEnLaCMDelUsuario() {
        gestor.opcionRegistrarRecepcionDeBolsin();

        assertThrows(RecepcionException.class, () -> gestor.tomarSeleccionBolsin(bolsinHaciaCordoba.getId()));
        assertThrows(RecepcionException.class, () -> gestor.tomarSeleccionBolsin(bolsinTodaviaCreado.getId()));
    }

    // ---------- pasos 7 a 12: flujo principal ----------

    @Test
    void elResumenAnticipaComoQuedaTodoSiLlegoCompleto() {
        gestor.opcionRegistrarRecepcionDeBolsin();
        gestor.tomarSeleccionBolsin(bolsinARecibir.getId());

        ResumenRecepcion resumen = gestor.tomarSeleccionRecepcionBolsin(Map.of());

        assertEquals(Estado.RECIBIDO_EN_CM_DESTINO, resumen.estadoFinalBolsin());
        assertTrue(resumen.remitos().stream().allMatch(r -> r.estadoFinal().equals(Estado.RECIBIDO_Y_ACEPTADO)));
        assertEquals(3, resumen.documentacion().size());
        assertEquals(List.of("CM Mendoza"), resumen.cmANotificar());
    }

    @Test
    void alConfirmarActualizaBolsinRemitosYDocumentacionConElEmpleadoResponsable() {
        gestor.opcionRegistrarRecepcionDeBolsin();
        gestor.tomarSeleccionBolsin(bolsinARecibir.getId());
        gestor.tomarSeleccionRecepcionBolsin(Map.of());

        ResultadoRecepcion resultado = gestor.tomarConfirmacionRegistro();
        entityManager.flush();
        entityManager.clear();

        // El resultado y el CU 29
        assertEquals("Silvina Romero", resultado.responsable());
        assertEquals(1, resultado.avisos().size());
        assertEquals(1, notificados.size(), "se notifica una vez, con el resumen de lo recibido");

        // Lo que quedo guardado en la base
        Bolsin guardado = bolsinRepository.findById(bolsinARecibir.getId()).orElseThrow();
        assertFalse(guardado.esEnviado());
        CambioEstadoBolsin actualBolsin = guardado.getCambiosEstado().stream()
                .filter(CambioEstadoBolsin::esActual).findFirst().orElseThrow();
        assertTrue(actualBolsin.getEstado().esRecibidoEnCMDestino());
        assertEquals(encargado.getId(), actualBolsin.getResponsableCE().getId());
        assertEquals(1, guardado.getCambiosEstado().stream().filter(CambioEstadoBolsin::esActual).count());

        for (Remito remito : guardado.getRemitos()) {
            assertTrue(remito.getEstado().esRecibidoYAceptado());
            for (DetalleRemito detalle : remito.getDetalleRemito()) {
                Documentacion doc = detalle.getDocumentacion();
                assertInstanceOf(RecibidaYAceptada.class, doc.getEstado());
                List<CambioEstadoDocumentacion> actuales = doc.getCambiosEstado().stream()
                        .filter(CambioEstadoDocumentacion::esActual).toList();
                assertEquals(1, actuales.size(), "un solo cambio de estado vigente");
                assertEquals(encargado.getId(), actuales.get(0).getResponsableCE().getId());
            }
        }
    }

    @Test
    void despuesDeConfirmarElBolsinYaNoApareceEnElListado() {
        gestor.opcionRegistrarRecepcionDeBolsin();
        gestor.tomarSeleccionBolsin(bolsinARecibir.getId());
        gestor.tomarSeleccionRecepcionBolsin(Map.of());
        gestor.tomarConfirmacionRegistro();
        entityManager.flush();
        entityManager.clear();

        assertTrue(gestor.opcionRegistrarRecepcionDeBolsin().bolsines().isEmpty());
    }

    @Test
    void noSePuedeConfirmarSinHaberElegidoComoLlegoLaDocumentacion() {
        gestor.opcionRegistrarRecepcionDeBolsin();
        gestor.tomarSeleccionBolsin(bolsinARecibir.getId());

        assertThrows(RecepcionException.class, () -> gestor.tomarConfirmacionRegistro());
    }

    @Test
    void alCancelarNoSeRegistraNada() {
        gestor.opcionRegistrarRecepcionDeBolsin();
        gestor.tomarSeleccionBolsin(bolsinARecibir.getId());
        gestor.tomarSeleccionRecepcionBolsin(Map.of());

        gestor.cancelar();

        assertThrows(RecepcionException.class, () -> gestor.tomarConfirmacionRegistro());
        entityManager.flush();
        entityManager.clear();
        Bolsin sinTocar = bolsinRepository.findById(bolsinARecibir.getId()).orElseThrow();
        assertTrue(sinTocar.esEnviado());
        assertNotNull(sinTocar.getRemitos());
        assertTrue(notificados.isEmpty(), "no tendria que haber notificado");
    }

    // =====================================================================
    // T6: flujos alternativos A3, A4 y A5
    // =====================================================================

    /** Ids de la documentacion del bolsin a recibir, en orden: [0] y [1] del remito 213, [2] del 214. */
    private List<Long> idsDocumentacion() {
        gestor.opcionRegistrarRecepcionDeBolsin();
        DetalleBolsin detalle = gestor.tomarSeleccionBolsin(bolsinARecibir.getId());
        List<Long> ids = new ArrayList<>();
        detalle.remitos().forEach(r -> r.documentacion().forEach(d -> ids.add(d.id())));
        return ids;
    }

    /** Marca, confirma y devuelve el bolsin vuelto a leer de la base. */
    private Bolsin confirmarCon(Map<Long, SituacionRecepcion> marcas) {
        gestor.tomarSeleccionRecepcionBolsin(marcas);
        gestor.tomarConfirmacionRegistro();
        entityManager.flush();
        entityManager.clear();
        return bolsinRepository.findById(bolsinARecibir.getId()).orElseThrow();
    }

    private Remito remito(Bolsin bolsin, int numero) {
        return bolsin.getRemitos().stream().filter(r -> r.getNumero() == numero).findFirst().orElseThrow();
    }

    private EstadoDocumentacion estadoDe(Remito remito, int indice) {
        return remito.getDetalleRemito().get(indice).getDocumentacion().getEstado();
    }

    @Test
    void a3FaltaUnDocumentoQuedaNoRecibidaYSuRemitoParcial() {
        List<Long> ids = idsDocumentacion();

        Bolsin guardado = confirmarCon(Map.of(ids.get(0), SituacionRecepcion.FALTANTE));

        assertFalse(guardado.esEnviado());
        assertInstanceOf(NoRecibida.class, estadoDe(remito(guardado, 213), 0));
        assertInstanceOf(RecibidaYAceptada.class, estadoDe(remito(guardado, 213), 1));
        assertTrue(remito(guardado, 213).getEstado().esRecibidoYAceptadoParcial());
        assertTrue(remito(guardado, 214).getEstado().esRecibidoYAceptado(), "el otro remito llego completo");
        assertEquals(SituacionRecepcion.FALTANTE, notificados.get(0).documentacion().get(0).situacion(),
                "el aviso a la CM de origen dice que documento falto");
    }

    @Test
    void a4DocumentoQueNoCorrespondeQuedaRecibidaYRechazada() {
        List<Long> ids = idsDocumentacion();

        Bolsin guardado = confirmarCon(Map.of(ids.get(2), SituacionRecepcion.NO_CORRESPONDE));

        assertInstanceOf(RecibidaYRechazada.class, estadoDe(remito(guardado, 214), 0));
        assertTrue(remito(guardado, 214).getEstado().esRecibidoYAceptadoParcial());
        assertTrue(remito(guardado, 213).getEstado().esRecibidoYAceptado());
    }

    @Test
    void a5DesdeLaCMCSePuedeRedirigirYQuedaParaRedirigir() {
        List<Long> ids = idsDocumentacion();

        Bolsin guardado = confirmarCon(Map.of(ids.get(1), SituacionRecepcion.REDIRIGIR));

        assertInstanceOf(ParaRedirigir.class, estadoDe(remito(guardado, 213), 1));
        assertTrue(remito(guardado, 213).getEstado().esRecibidoYAceptadoParcial());
    }

    @Test
    void a5DesdeOtraCMNoSePuedeRedirigirPeroSiMarcarFaltante() {
        ServicioSesion sesionCordoba = mock(ServicioSesion.class);
        when(sesionCordoba.getEmpleadoLogueado()).thenReturn(encargadoCordoba);
        GestorRecepcionDeBolsines gestorCordoba = new GestorRecepcionDeBolsines(bolsinRepository,
                estadoRepository, sesionCordoba, resumen -> List.of(), false);

        InicioRecepcion inicio = gestorCordoba.opcionRegistrarRecepcionDeBolsin();
        assertFalse(inicio.cmEsCentral());
        DetalleBolsin detalle = gestorCordoba.tomarSeleccionBolsin(bolsinHaciaCordoba.getId());
        Long idDoc = detalle.remitos().get(0).documentacion().get(0).id();

        RecepcionException error = assertThrows(RecepcionException.class,
                () -> gestorCordoba.tomarSeleccionRecepcionBolsin(Map.of(idDoc, SituacionRecepcion.REDIRIGIR)));
        assertTrue(error.getMessage().contains("Comision Medica Central"));

        ResumenRecepcion resumen = gestorCordoba.tomarSeleccionRecepcionBolsin(Map.of(idDoc, SituacionRecepcion.FALTANTE));
        assertEquals(SituacionRecepcion.FALTANTE, resumen.documentacion().get(0).situacion());
    }

    @Test
    void noSePuedeMarcarDocumentacionDeOtroBolsin() {
        idsDocumentacion();

        assertThrows(RecepcionException.class,
                () -> gestor.tomarSeleccionRecepcionBolsin(Map.of(999_999L, SituacionRecepcion.FALTANTE)));
    }

    @Test
    void elResumenAnticipaElRemitoParcialAntesDeConfirmar() {
        List<Long> ids = idsDocumentacion();

        ResumenRecepcion resumen = gestor.tomarSeleccionRecepcionBolsin(Map.of(ids.get(0), SituacionRecepcion.FALTANTE));

        assertEquals(Estado.RECIBIDO_Y_ACEPTADO_PARCIAL, resumen.remitos().get(0).estadoFinal());
        assertEquals(Estado.RECIBIDO_Y_ACEPTADO, resumen.remitos().get(1).estadoFinal());
        assertEquals(1, resumen.cantidad(SituacionRecepcion.FALTANTE));
        assertEquals(2, resumen.cantidad(SituacionRecepcion.RECIBIDA));
    }

    @Test
    void unMismoBolsinConLasTresNovedadesALaVez() {
        List<Long> ids = idsDocumentacion();

        Bolsin guardado = confirmarCon(Map.of(
                ids.get(0), SituacionRecepcion.FALTANTE,
                ids.get(1), SituacionRecepcion.NO_CORRESPONDE,
                ids.get(2), SituacionRecepcion.REDIRIGIR));

        assertInstanceOf(NoRecibida.class, estadoDe(remito(guardado, 213), 0));
        assertInstanceOf(RecibidaYRechazada.class, estadoDe(remito(guardado, 213), 1));
        assertInstanceOf(ParaRedirigir.class, estadoDe(remito(guardado, 214), 0));
        assertTrue(remito(guardado, 213).getEstado().esRecibidoYAceptadoParcial());
        assertTrue(remito(guardado, 214).getEstado().esRecibidoYAceptadoParcial());
        assertFalse(guardado.esEnviado(), "el bolsin queda recibido llegue como llegue");
    }
}
