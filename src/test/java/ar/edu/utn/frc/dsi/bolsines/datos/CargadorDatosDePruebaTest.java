package ar.edu.utn.frc.dsi.bolsines.datos;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import ar.edu.utn.frc.dsi.bolsines.control.GestorRecepcionDeBolsines;
import ar.edu.utn.frc.dsi.bolsines.control.dto.BolsinResumen;
import ar.edu.utn.frc.dsi.bolsines.control.dto.DetalleBolsin;
import ar.edu.utn.frc.dsi.bolsines.control.dto.InicioRecepcion;
import ar.edu.utn.frc.dsi.bolsines.entity.Bolsin;
import ar.edu.utn.frc.dsi.bolsines.entity.DetalleRemito;
import ar.edu.utn.frc.dsi.bolsines.entity.Empleado;
import ar.edu.utn.frc.dsi.bolsines.entity.Estado;
import ar.edu.utn.frc.dsi.bolsines.entity.Remito;
import ar.edu.utn.frc.dsi.bolsines.entity.SituacionRecepcion;
import ar.edu.utn.frc.dsi.bolsines.entity.estado.EnBolsinEnviado;
import ar.edu.utn.frc.dsi.bolsines.entity.estado.NoRecibida;
import ar.edu.utn.frc.dsi.bolsines.entity.estado.RecibidaYAceptada;
import ar.edu.utn.frc.dsi.bolsines.repository.BolsinRepository;
import ar.edu.utn.frc.dsi.bolsines.repository.ComisionMedicaRepository;
import ar.edu.utn.frc.dsi.bolsines.repository.EmpleadoRepository;
import ar.edu.utn.frc.dsi.bolsines.repository.EstadoRepository;
import ar.edu.utn.frc.dsi.bolsines.repository.TipoDocumentacionRepository;
import ar.edu.utn.frc.dsi.bolsines.repository.UsuarioRepository;
import ar.edu.utn.frc.dsi.bolsines.servicio.ServicioSesion;
import jakarta.persistence.EntityManager;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

/**
 * Los datos de la demo: que se carguen bien y, sobre todo, que el gestor real los encuentre.
 */
@SpringBootTest
@Transactional
class CargadorDatosDePruebaTest {

    @Autowired private ComisionMedicaRepository comisionMedicaRepository;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private EmpleadoRepository empleadoRepository;
    @Autowired private TipoDocumentacionRepository tipoDocumentacionRepository;
    @Autowired private EstadoRepository estadoRepository;
    @Autowired private BolsinRepository bolsinRepository;
    @Autowired private EntityManager entityManager;

    private CargadorDatosDePrueba cargador;

    @BeforeEach
    void cargarDatos() {
        cargador = new CargadorDatosDePrueba(comisionMedicaRepository, usuarioRepository, empleadoRepository,
                tipoDocumentacionRepository, estadoRepository, bolsinRepository);
        assertTrue(cargador.cargar(), "con la base vacia tiene que cargar");
        entityManager.flush();
        entityManager.clear();
    }

    private GestorRecepcionDeBolsines gestorPara(String usuario) {
        Empleado empleado = empleadoRepository.findAll().stream()
                .filter(e -> e.getUsuario().getName().equals(usuario)).findFirst().orElseThrow();
        ServicioSesion sesion = mock(ServicioSesion.class);
        when(sesion.getEmpleadoLogueado()).thenReturn(empleado);
        return new GestorRecepcionDeBolsines(bolsinRepository, estadoRepository, sesion, resumen -> List.of(), false);
    }

    private Long idPorPrecinto(InicioRecepcion inicio, String precinto) {
        return inicio.bolsines().stream().filter(b -> b.numeroPrecinto().equals(precinto))
                .findFirst().orElseThrow().id();
    }

    @Test
    void cargaComisionesEncargadosTiposYEstados() {
        assertEquals(6, comisionMedicaRepository.count());
        assertEquals(6, empleadoRepository.count(), "un encargado por comision");
        assertEquals(4, tipoDocumentacionRepository.count());
        assertEquals(10, estadoRepository.count(), "5 de bolsin y 5 de remito");
        assertEquals(1, comisionMedicaRepository.findAll().stream().filter(c -> c.esCentral()).count());
    }

    @Test
    void siYaHayDatosNoLosVuelveACargar() {
        long bolsinesAntes = bolsinRepository.count();

        assertFalse(cargador.cargar());
        assertEquals(bolsinesAntes, bolsinRepository.count());
    }

    @Test
    void laDocumentacionLlegaAEnBolsinEnviadoConSuHistorialCompleto() {
        Bolsin b1287 = bolsinRepository.findAll().stream()
                .filter(b -> b.getNroPrecinto().equals("004512")).findFirst().orElseThrow();

        for (Remito remito : b1287.getRemitos()) {
            for (DetalleRemito detalle : remito.getDetalleRemito()) {
                assertInstanceOf(EnBolsinEnviado.class, detalle.getDocumentacion().getEstado());
                assertEquals(4, detalle.getDocumentacion().getCambiosEstado().size(),
                        "Registrada, EnRemito, EnBolsinSaliente y EnBolsinEnviado");
            }
        }
    }

    @Test
    void elGestorRealVeLosSeisBolsinesEnviadosHaciaLaCMC() {
        InicioRecepcion inicio = gestorPara("sromero").opcionRegistrarRecepcionDeBolsin();

        assertEquals("Silvina Romero", inicio.nombreEmpleado());
        assertTrue(inicio.cmEsCentral());
        List<String> precintos = inicio.bolsines().stream().map(BolsinResumen::numeroPrecinto).sorted().toList();
        assertEquals(List.of("004498", "004512", "004533", "004577", "004601", "004620"), precintos,
                "ni el que va a Cordoba ni el Cerrado");
    }

    @Test
    void elEncargadoDeCordobaSoloVeElBolsinQueVaACordoba() {
        InicioRecepcion inicio = gestorPara("lpaz").opcionRegistrarRecepcionDeBolsin();

        assertFalse(inicio.cmEsCentral());
        assertEquals(1, inicio.bolsines().size());
        assertEquals("004640", inicio.bolsines().get(0).numeroPrecinto());
    }

    @Test
    void flujoPrincipalSobreElBolsin004533() {
        GestorRecepcionDeBolsines gestor = gestorPara("sromero");
        Long id = idPorPrecinto(gestor.opcionRegistrarRecepcionDeBolsin(), "004533");
        gestor.tomarSeleccionBolsin(id);
        gestor.tomarSeleccionRecepcionBolsin(Map.of());

        gestor.tomarConfirmacionRegistro();
        entityManager.flush();
        entityManager.clear();

        Bolsin recibido = bolsinRepository.findById(id).orElseThrow();
        assertFalse(recibido.esEnviado());
        Remito remito = recibido.getRemitos().get(0);
        assertTrue(remito.getEstado().esRecibidoYAceptado());
        remito.getDetalleRemito().forEach(d ->
                assertInstanceOf(RecibidaYAceptada.class, d.getDocumentacion().getEstado()));
    }

    @Test
    void a3SobreElBolsin004512FaltaLaRadiografia() {
        GestorRecepcionDeBolsines gestor = gestorPara("sromero");
        Long id = idPorPrecinto(gestor.opcionRegistrarRecepcionDeBolsin(), "004512");
        DetalleBolsin detalle = gestor.tomarSeleccionBolsin(id);
        Long radiografia = detalle.remitos().stream().flatMap(r -> r.documentacion().stream())
                .filter(d -> d.asunto().startsWith("Radiografia")).findFirst().orElseThrow().id();
        gestor.tomarSeleccionRecepcionBolsin(Map.of(radiografia, SituacionRecepcion.FALTANTE));

        gestor.tomarConfirmacionRegistro();
        entityManager.flush();
        entityManager.clear();

        Bolsin recibido = bolsinRepository.findById(id).orElseThrow();
        Remito remito214 = recibido.getRemitos().stream().filter(r -> r.getNumero() == 214).findFirst().orElseThrow();
        assertTrue(remito214.getEstado().esRecibidoYAceptadoParcial());
        assertInstanceOf(NoRecibida.class, remito214.getDetalleRemito().get(0).getDocumentacion().getEstado());
        assertEquals(2, recibido.getRemitos().stream()
                .filter(r -> r.getEstado().getName().equals(Estado.RECIBIDO_Y_ACEPTADO)).count(),
                "los remitos 213 y 215 llegaron completos");
    }
}
