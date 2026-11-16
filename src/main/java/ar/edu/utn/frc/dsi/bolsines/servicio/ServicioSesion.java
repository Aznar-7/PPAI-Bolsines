package ar.edu.utn.frc.dsi.bolsines.servicio;

import ar.edu.utn.frc.dsi.bolsines.entity.Empleado;
import ar.edu.utn.frc.dsi.bolsines.entity.Sesion;
import ar.edu.utn.frc.dsi.bolsines.entity.Usuario;
import ar.edu.utn.frc.dsi.bolsines.repository.EmpleadoRepository;
import ar.edu.utn.frc.dsi.bolsines.repository.SesionRepository;
import ar.edu.utn.frc.dsi.bolsines.repository.UsuarioRepository;
import java.time.LocalDateTime;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.annotation.SessionScope;

/**
 * Login simple y usuario logueado. Duenio: T2 (Vale).
 *
 * Vive en la sesion HTTP: cada navegador tiene su propio usuario logueado. Cada inicio de sesion
 * queda guardado en la base (entidad Sesion) con su fecha y hora de inicio y de fin.
 *
 * Es un login minimo para que exista un usuario logueado: la contrasena se compara en texto plano,
 * sin Spring Security. Alcanza para el trabajo practico, no para produccion.
 */
@Service
@SessionScope
public class ServicioSesion {

    private final UsuarioRepository usuarioRepository;
    private final EmpleadoRepository empleadoRepository;
    private final SesionRepository sesionRepository;

    private Sesion sesionActual;

    public ServicioSesion(UsuarioRepository usuarioRepository, EmpleadoRepository empleadoRepository,
                          SesionRepository sesionRepository) {
        this.usuarioRepository = usuarioRepository;
        this.empleadoRepository = empleadoRepository;
        this.sesionRepository = sesionRepository;
    }

    /** Valida usuario y contrasena y crea la Sesion. Devuelve false si los datos son incorrectos. */
    @Transactional
    public boolean iniciarSesion(String usuario, String contrasena) {
        Optional<Usuario> encontrado = usuarioRepository.findByNombre(usuario);
        if (encontrado.isEmpty() || !encontrado.get().getContrasena().equals(contrasena)) {
            return false;
        }
        if (sesionActual != null) {
            cerrarSesion();
        }
        sesionActual = sesionRepository.save(new Sesion(LocalDateTime.now(), encontrado.get()));
        return true;
    }

    /** Registra la fecha y hora de fin de la sesion actual. */
    @Transactional
    public void cerrarSesion() {
        if (sesionActual == null) {
            return;
        }
        sesionActual.setFechaHoraFin(LocalDateTime.now());
        sesionRepository.save(sesionActual);
        sesionActual = null;
    }

    public boolean haySesion() {
        return sesionActual != null;
    }

    public Sesion getSesionActual() {
        return sesionActual;
    }

    /**
     * Camino del diagrama: Sesion.getUsuario() -> a cada Empleado esTuUsuario() -> el empleado.
     * Devuelve null si no hay nadie logueado (el gestor responde "No hay un usuario logueado").
     */
    @Transactional(readOnly = true)
    public Empleado getEmpleadoLogueado() {
        if (sesionActual == null) {
            return null;
        }
        Usuario usuario = sesionActual.getUsuario();
        for (Empleado empleado : empleadoRepository.findAll()) {
            if (empleado.esTuUsuario(usuario)) {
                return empleado;
            }
        }
        return null;
    }
}
