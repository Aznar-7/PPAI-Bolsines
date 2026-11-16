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

    private final ServicioSesion servicioSesion;
    private final boolean modoDePrueba;

    public PantallaIngreso(ServicioSesion servicioSesion,
                           @Value("${bolsines.datos-de-prueba.cargar:true}") boolean modoDePrueba) {
        this.servicioSesion = servicioSesion;
        this.modoDePrueba = modoDePrueba;
    }

    public record Credenciales(@NotBlank String usuario, @NotBlank String contrasena) {
    }

    /** modoDePrueba: estan cargados los usuarios de la demo, asi la pantalla de ingreso los sugiere. */
    public record EstadoSesion(boolean logueado, boolean modoDePrueba) {
    }

    @GetMapping
    public EstadoSesion consultarSesion(HttpSession sesion) {
        return new EstadoSesion(servicioSesion.haySesion(), modoDePrueba);
    }

    @PostMapping
    public ResponseEntity<?> tomarIngreso(@Valid @RequestBody Credenciales credenciales, HttpServletRequest request) {
        if (!servicioSesion.iniciarSesion(credenciales.usuario(), credenciales.contrasena())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ProblemDetail.forStatusAndDetail(
                    HttpStatus.UNAUTHORIZED, "El usuario o la contraseña no son correctos."));
        }
        request.changeSessionId(); // evita la fijacion de sesion: el id cambia al ingresar
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping
    public ResponseEntity<Void> cerrarSesion(HttpSession sesion) {
        servicioSesion.cerrarSesion();
        sesion.invalidate();
        return ResponseEntity.noContent().build();
    }
}
