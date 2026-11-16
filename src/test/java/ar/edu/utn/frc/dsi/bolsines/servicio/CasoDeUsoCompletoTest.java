package ar.edu.utn.frc.dsi.bolsines.servicio;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import ar.edu.utn.frc.dsi.bolsines.control.GestorRecepcionDeBolsines;
import ar.edu.utn.frc.dsi.bolsines.control.RecepcionException;
import ar.edu.utn.frc.dsi.bolsines.control.dto.DetalleBolsin;
import ar.edu.utn.frc.dsi.bolsines.control.dto.InicioRecepcion;
import ar.edu.utn.frc.dsi.bolsines.control.dto.ResultadoRecepcion;
import ar.edu.utn.frc.dsi.bolsines.datos.CargadorDatosDePrueba;
import ar.edu.utn.frc.dsi.bolsines.entity.SituacionRecepcion;
import ar.edu.utn.frc.dsi.bolsines.repository.BolsinRepository;
import ar.edu.utn.frc.dsi.bolsines.repository.ComisionMedicaRepository;
import ar.edu.utn.frc.dsi.bolsines.repository.EmpleadoRepository;
import ar.edu.utn.frc.dsi.bolsines.repository.EstadoRepository;
import ar.edu.utn.frc.dsi.bolsines.repository.SesionRepository;
import ar.edu.utn.frc.dsi.bolsines.repository.TipoDocumentacionRepository;
import ar.edu.utn.frc.dsi.bolsines.repository.UsuarioRepository;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

/**
 * El CU 28 de punta a punta sin la pantalla y sin nada simulado en el test: datos de la demo (T1),
 * login real (T2), gestor real (T5 y T6) y aviso del CU 29 (T2).
 */
@SpringBootTest
@Transactional
class CasoDeUsoCompletoTest {

    @Autowired private ComisionMedicaRepository comisionMedicaRepository;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private EmpleadoRepository empleadoRepository;
    @Autowired private TipoDocumentacionRepository tipoDocumentacionRepository;
    @Autowired private EstadoRepository estadoRepository;
    @Autowired private BolsinRepository bolsinRepository;
    @Autowired private SesionRepository sesionRepository;

    private ServicioSesion sesion;
    private GestorRecepcionDeBolsines gestor;

    @BeforeEach
    void armar() {
        new CargadorDatosDePrueba(comisionMedicaRepository, usuarioRepository, empleadoRepository,
                tipoDocumentacionRepository, estadoRepository, bolsinRepository).cargar();
        sesion = new ServicioSesion(usuarioRepository, empleadoRepository, sesionRepository);
        gestor = new GestorRecepcionDeBolsines(bolsinRepository, estadoRepository, sesion,
                new NotificacionSimulada(comisionMedicaRepository), false);
    }

    @Test
    void sinLoguearseElGestorNoArranca() {
        assertThrowsRecepcion(() -> gestor.opcionRegistrarRecepcionDeBolsin());
    }

    @Test
    void a3ConLoginRealYAvisoALaCMDeOrigen() {
        assertTrue(sesion.iniciarSesion("sromero", "1234"));
        InicioRecepcion inicio = gestor.opcionRegistrarRecepcionDeBolsin();
        Long id = inicio.bolsines().stream().filter(b -> b.numeroPrecinto().equals("004512"))
                .findFirst().orElseThrow().id();
        DetalleBolsin detalle = gestor.tomarSeleccionBolsin(id);
        Long radiografia = detalle.remitos().stream().flatMap(r -> r.documentacion().stream())
                .filter(d -> d.asunto().startsWith("Radiografia")).findFirst().orElseThrow().id();
        gestor.tomarSeleccionRecepcionBolsin(Map.of(radiografia, SituacionRecepcion.FALTANTE));

        ResultadoRecepcion resultado = gestor.tomarConfirmacionRegistro();

        assertEquals("Silvina Romero", resultado.responsable());
        assertEquals(1, resultado.avisos().size(), "un aviso por CM de origen");
        var aviso = resultado.avisos().get(0);
        assertEquals("CM Mendoza", aviso.cmDestino());
        assertEquals("mesa.mza@comisiones.gob.ar", aviso.email());
        assertTrue(aviso.asunto().contains("004512"));
        assertEquals("Recibidas y aceptadas: 4 de 5", aviso.detalle().get(0));
        assertTrue(aviso.detalle().get(1).startsWith("No recibida: Radiografia de rodilla"));
    }

    @Test
    void a4YA5QuedanDetalladosEnElAviso() {
        sesion.iniciarSesion("sromero", "1234");
        InicioRecepcion inicio = gestor.opcionRegistrarRecepcionDeBolsin();
        Long id = inicio.bolsines().stream().filter(b -> b.numeroPrecinto().equals("004498"))
                .findFirst().orElseThrow().id();
        DetalleBolsin detalle = gestor.tomarSeleccionBolsin(id);
        Long recurso = detalle.remitos().get(0).documentacion().get(0).id();
        Long resonancia = detalle.remitos().get(1).documentacion().get(0).id();
        gestor.tomarSeleccionRecepcionBolsin(Map.of(
                recurso, SituacionRecepcion.REDIRIGIR,
                resonancia, SituacionRecepcion.NO_CORRESPONDE));

        var aviso = gestor.tomarConfirmacionRegistro().avisos().get(0);

        assertEquals("CM Salta", aviso.cmDestino());
        assertTrue(aviso.detalle().stream().anyMatch(l -> l.startsWith("Para redirigir a un area interna: Recurso")));
        assertTrue(aviso.detalle().stream().anyMatch(l -> l.startsWith("Rechazada, no corresponde a esta comision: Estudio")));
    }

    private static void assertThrowsRecepcion(org.junit.jupiter.api.function.Executable accion) {
        org.junit.jupiter.api.Assertions.assertThrows(RecepcionException.class, accion);
    }
}
