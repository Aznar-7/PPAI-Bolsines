package ar.edu.utn.frc.dsi.bolsines.servicio;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import ar.edu.utn.frc.dsi.bolsines.entity.ComisionMedica;
import ar.edu.utn.frc.dsi.bolsines.entity.Empleado;
import ar.edu.utn.frc.dsi.bolsines.entity.Sesion;
import ar.edu.utn.frc.dsi.bolsines.entity.Usuario;
import ar.edu.utn.frc.dsi.bolsines.repository.ComisionMedicaRepository;
import ar.edu.utn.frc.dsi.bolsines.repository.EmpleadoRepository;
import ar.edu.utn.frc.dsi.bolsines.repository.SesionRepository;
import ar.edu.utn.frc.dsi.bolsines.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class ServicioSesionTest {

    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private EmpleadoRepository empleadoRepository;
    @Autowired private SesionRepository sesionRepository;
    @Autowired private ComisionMedicaRepository comisionMedicaRepository;

    private ServicioSesion servicio;
    private Empleado silvina;

    @BeforeEach
    void armar() {
        ComisionMedica central = comisionMedicaRepository.save(new ComisionMedica(ComisionMedica.CODIGO_CENTRAL,
                "Comision Medica Central", "Av. de Mayo 760", "mesa.cmc@comisiones.gob.ar", "0800"));
        Usuario usuario = usuarioRepository.save(new Usuario("sromero", "1234"));
        silvina = empleadoRepository.save(new Empleado("Silvina", "Romero", "s@ejemplo.com", usuario, central));
        empleadoRepository.save(new Empleado("Otro", "Empleado", "o@ejemplo.com",
                usuarioRepository.save(new Usuario("otro", "abcd")), central));
        servicio = new ServicioSesion(usuarioRepository, empleadoRepository, sesionRepository);
    }

    @Test
    void conUsuarioYContrasenaCorrectosCreaLaSesionYDevuelveElEmpleadoConSuCM() {
        assertTrue(servicio.iniciarSesion("sromero", "1234"));

        assertTrue(servicio.haySesion());
        Empleado logueado = servicio.getEmpleadoLogueado();
        assertEquals(silvina.getId(), logueado.getId());
        assertEquals("Comision Medica Central", logueado.getCM().getName());
        Sesion guardada = sesionRepository.findById(servicio.getSesionActual().getId()).orElseThrow();
        assertNotNull(guardada.getFechaHoraInicio());
        assertNull(guardada.getFechaHoraFin());
    }

    @Test
    void conContrasenaIncorrectaNoEntra() {
        assertFalse(servicio.iniciarSesion("sromero", "9999"));
        assertFalse(servicio.haySesion());
        assertEquals(0, sesionRepository.count());
    }

    @Test
    void conUsuarioQueNoExisteNoEntra() {
        assertFalse(servicio.iniciarSesion("nadie", "1234"));
        assertFalse(servicio.haySesion());
    }

    @Test
    void sinSesionNoHayEmpleadoLogueado() {
        assertNull(servicio.getEmpleadoLogueado());
    }

    @Test
    void alCerrarSesionQuedaRegistradaLaFechaDeFin() {
        servicio.iniciarSesion("sromero", "1234");
        Long idSesion = servicio.getSesionActual().getId();

        servicio.cerrarSesion();

        assertFalse(servicio.haySesion());
        assertNull(servicio.getEmpleadoLogueado());
        assertNotNull(sesionRepository.findById(idSesion).orElseThrow().getFechaHoraFin());
    }
}
