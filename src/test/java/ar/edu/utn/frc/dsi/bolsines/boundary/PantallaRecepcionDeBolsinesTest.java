package ar.edu.utn.frc.dsi.bolsines.boundary;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.forwardedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Criterios de aceptacion de la T7 contra la API de la pantalla, con los datos de prueba del gestor.
 * Los filtros A1/A2 y los textos se prueban en el front (frontend/src/pantallas/*.test.tsx).
 */
@SpringBootTest(properties = "bolsines.gestor.datos-de-mentira=true")
@AutoConfigureMockMvc
class PantallaRecepcionDeBolsinesTest {

    @Autowired
    private MockMvc mvc;

    private MockHttpSession ingresar(String usuario, String contrasena, int estadoEsperado) throws Exception {
        MockHttpSession sesion = new MockHttpSession();
        mvc.perform(post("/api/sesion").session(sesion).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"usuario\":\"" + usuario + "\",\"contrasena\":\"" + contrasena + "\"}"))
                .andExpect(status().is(estadoEsperado));
        return sesion;
    }

    @Test
    void sinSesionNoSeEntraALaBandeja() throws Exception {
        mvc.perform(get("/api/recepcion")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/recepcion/1")).andExpect(status().isUnauthorized());
    }

    @Test
    void conDatosIncorrectosNoEntra() throws Exception {
        MockHttpSession sesion = ingresar("silvina", "otra", 401);
        mvc.perform(get("/api/recepcion").session(sesion)).andExpect(status().isUnauthorized());
    }

    @Test
    void conCamposVaciosNoIntentaIngresar() throws Exception {
        ingresar("", "", 400);
    }

    @Test
    void usuarioValidoVeSuNombreSuCmYLosBolsinesEnviados() throws Exception {
        MockHttpSession sesion = ingresar("silvina", "bolsines", 204);
        mvc.perform(get("/api/sesion").session(sesion)).andExpect(jsonPath("$.logueado").value(true));
        mvc.perform(get("/api/recepcion").session(sesion))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombreEmpleado").value("Silvina Romero"))
                .andExpect(jsonPath("$.cmUsuario").value("Comision Medica Central"))
                .andExpect(jsonPath("$.bolsines[0].cmOrigen").value("CM Mendoza"))
                .andExpect(jsonPath("$.bolsines[0].numeroPrecinto").value("004512"));
    }

    @Test
    void seleccionarUnBolsinDevuelveSusRemitosAunqueSeEntreDirecto() throws Exception {
        MockHttpSession sesion = ingresar("silvina", "bolsines", 204);
        mvc.perform(get("/api/recepcion/1").session(sesion))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.remitos[0].numero").value(213))
                .andExpect(jsonPath("$.remitos[0].documentacion[0].asunto").exists());
    }

    @Test
    void unRechazoDelGestorLlegaComoMensaje() throws Exception {
        MockHttpSession sesion = ingresar("silvina", "bolsines", 204);
        mvc.perform(get("/api/recepcion/99").session(sesion))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.detail").value("No existe el bolsin 99"));
    }

    @Test
    void cerrarSesionVuelveAPedirIngreso() throws Exception {
        MockHttpSession sesion = ingresar("silvina", "bolsines", 204);
        mvc.perform(delete("/api/sesion").session(sesion)).andExpect(status().isNoContent());
        mvc.perform(get("/api/recepcion")).andExpect(status().isUnauthorized());
    }

    @Test
    void lasRutasDelFrontDevuelvenLaPaginaDeReact() throws Exception {
        mvc.perform(get("/recepcion/1")).andExpect(forwardedUrl("/index.html"));
    }
}
