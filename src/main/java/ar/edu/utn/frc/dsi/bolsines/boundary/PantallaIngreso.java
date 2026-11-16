package ar.edu.utn.frc.dsi.bolsines.boundary;

import ar.edu.utn.frc.dsi.bolsines.servicio.ServicioSesion;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * <<boundary>> del ingreso al sistema. Duenio: T7 (Aznar).
 *
 * No valida nada por su cuenta: le pasa usuario y contrasena al servicio de sesion (T2).
 */
@RestController
@RequestMapping("/api/sesion")
public class PantallaIngreso {

    /** Marca de sesion mientras no existe el servicio real. Se borra en la T9 junto con los datos de mentira. */
    static final String INGRESO_DE_PRUEBA = "ingresoDePrueba";
    static final String USUARIO_DE_PRUEBA = "silvina";
    static final String CONTRASENA_DE_PRUEBA = "bolsines";

    private final ServicioSesion servicioSesion;
    private final boolean modoDePrueba;

    public PantallaIngreso(ServicioSesion servicioSesion,
                           @Value("${bolsines.gestor.datos-de-mentira:false}") boolean modoDePrueba) {
        this.servicioSesion = servicioSesion;
        this.modoDePrueba = modoDePrueba;
    }

    public record Credenciales(@NotBlank String usuario, @NotBlank String contrasena) {
    }

    public record EstadoSesion(boolean logueado, boolean modoDePrueba) {
    }

    @GetMapping
    public EstadoSesion consultarSesion(HttpSession sesion) {
        return new EstadoSesion(haySesion(servicioSesion, sesion), modoDePrueba);
    }

    @PostMapping
    public ResponseEntity<?> tomarIngreso(@Valid @RequestBody Credenciales credenciales, HttpServletRequest request) {
        if (!validar(credenciales, request.getSession())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ProblemDetail.forStatusAndDetail(
                    HttpStatus.UNAUTHORIZED, "El usuario o la contraseña no son correctos."));
        }
        request.changeSessionId(); // evita la fijacion de sesion: el id cambia al ingresar
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping
    public ResponseEntity<Void> cerrarSesion(HttpSession sesion) {
        try {
            servicioSesion.cerrarSesion();
        } catch (UnsupportedOperationException sinServicioTodavia) {
            // ponytail: hasta la T2 no hay nada que cerrar en el servicio; invalidar la sesion HTTP alcanza.
        }
        sesion.invalidate();
        return ResponseEntity.noContent().build();
    }

    private boolean validar(Credenciales c, HttpSession sesion) {
        try {
            return servicioSesion.iniciarSesion(c.usuario(), c.contrasena());
        } catch (UnsupportedOperationException sinServicioTodavia) {
            // ponytail: mientras la T2 no este, en modo de prueba se entra con un usuario fijo. Se borra en la T9.
            boolean valido = modoDePrueba && USUARIO_DE_PRUEBA.equals(c.usuario())
                    && CONTRASENA_DE_PRUEBA.equals(c.contrasena());
            if (valido) {
                sesion.setAttribute(INGRESO_DE_PRUEBA, Boolean.TRUE);
            }
            return valido;
        }
    }

    static boolean haySesion(ServicioSesion servicioSesion, HttpSession sesion) {
        return servicioSesion.haySesion() || sesion.getAttribute(INGRESO_DE_PRUEBA) != null;
    }
}
