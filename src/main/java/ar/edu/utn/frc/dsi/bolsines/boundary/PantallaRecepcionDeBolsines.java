package ar.edu.utn.frc.dsi.bolsines.boundary;

import ar.edu.utn.frc.dsi.bolsines.control.GestorRecepcionDeBolsines;
import ar.edu.utn.frc.dsi.bolsines.control.RecepcionException;
import ar.edu.utn.frc.dsi.bolsines.control.dto.DetalleBolsin;
import ar.edu.utn.frc.dsi.bolsines.control.dto.InicioRecepcion;
import ar.edu.utn.frc.dsi.bolsines.control.dto.ResultadoRecepcion;
import ar.edu.utn.frc.dsi.bolsines.control.dto.ResumenRecepcion;
import ar.edu.utn.frc.dsi.bolsines.entity.SituacionRecepcion;
import jakarta.servlet.http.HttpSession;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * <<boundary>> del CU 28. Duenio: T7 y T8 (Aznar).
 *
 * La pantalla del diagrama esta en dos partes: este controller recibe cada accion del EB y se la
 * pasa al gestor, y el front en React (frontend/src/pantallas) muestra lo que el gestor devuelve
 * (habilitarPantalla, mostrarCM, solicitarSeleccionBolsin, mostrarNroRemito...).
 * No hay logica de negocio aca: todo lo decide GestorRecepcionDeBolsines.
 */
@RestController
@RequestMapping("/api/recepcion")
public class PantallaRecepcionDeBolsines {

    /** El gestor averigua quien esta logueado en el primer paso; sin eso no puede seguir. */
    private static final String RECEPCION_INICIADA = "recepcionIniciada";

    private final GestorRecepcionDeBolsines gestor;

    public PantallaRecepcionDeBolsines(GestorRecepcionDeBolsines gestor) {
        this.gestor = gestor;
    }

    /** Paso 1: el EB elige registrar la recepcion. Devuelve su CM y los bolsines enviados hacia ella (pasos 2 a 4). */
    @GetMapping
    public InicioRecepcion opcionRegistrarRecepcionDelBolsin(HttpSession sesion) {
        InicioRecepcion inicio = gestor.opcionRegistrarRecepcionDeBolsin();
        sesion.setAttribute(RECEPCION_INICIADA, Boolean.TRUE);
        return inicio;
    }

    /** Paso 5: el EB selecciona un bolsin. Devuelve sus remitos y documentacion (paso 6). */
    @GetMapping("/{idBolsin}")
    public DetalleBolsin tomarSeleccionBolsin(@PathVariable Long idBolsin, HttpSession sesion) {
        if (sesion.getAttribute(RECEPCION_INICIADA) == null) {
            opcionRegistrarRecepcionDelBolsin(sesion); // entro directo al bolsin sin pasar por la bandeja
        }
        return gestor.tomarSeleccionBolsin(idBolsin);
    }

    /**
     * Pasos 7 y 8: el EB indica como llego cada documentacion (id -> situacion). Devuelve como va a
     * quedar todo para pedir la confirmacion (paso 9, solicitarConfirmacionRegistro en el front).
     */
    @PostMapping("/seleccion")
    public ResumenRecepcion tomarSeleccionRecepcionBolsin(@RequestBody Map<Long, SituacionRecepcion> marcas) {
        return gestor.tomarSeleccionRecepcionBolsin(marcas);
    }

    /** Paso 10: el EB confirma. Devuelve lo registrado y los avisos del CU 29 (informarEjecucionExitosa en el front). */
    @PostMapping("/confirmacion")
    public ResultadoRecepcion tomarConfirmacionRegistro() {
        return gestor.tomarConfirmacionRegistro();
    }

    /** Observacion 1: el EB cancela la recepcion. No se registra nada. */
    @DeleteMapping("/seleccion")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancelar() {
        gestor.cancelar();
    }

    /** El gestor rechazo la accion: el front muestra el mensaje en la misma pantalla, sin perder lo marcado. */
    @ExceptionHandler(RecepcionException.class)
    public ProblemDetail mostrarRechazo(RecepcionException e) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, e.getMessage());
    }
}
