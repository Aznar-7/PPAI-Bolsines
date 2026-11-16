package ar.edu.utn.frc.dsi.bolsines.boundary;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Las rutas del front las resuelve React en el navegador. Si alguien recarga o entra directo a una,
 * Spring devuelve la misma pagina y React muestra la pantalla que corresponde.
 */
@Controller
public class RutasFront {

    @GetMapping({"/ingreso", "/inicio", "/recepcion", "/recepcion/**"})
    public String pantalla() {
        return "forward:/index.html";
    }
}
