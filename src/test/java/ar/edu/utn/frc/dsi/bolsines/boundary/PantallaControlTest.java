package ar.edu.utn.frc.dsi.bolsines.boundary;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import java.util.List;
import org.hamcrest.Matchers;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Criterios de la T8 contra la API de la pantalla, con el gestor real y los datos de la demo (T1).
 * Cada test usa un bolsin distinto porque confirmar cambia la base.
 */
@SpringBootTest(properties = {"bolsines.gestor.datos-de-mentira=false", "bolsines.datos-de-prueba.cargar=true",
        "spring.datasource.url=jdbc:h2:mem:pantalla-control-test"})
@AutoConfigureMockMvc
class PantallaControlTest {

    @Autowired
    private MockMvc mvc;

    private MockHttpSession ingresar(String usuario) throws Exception {
        MockHttpSession sesion = new MockHttpSession();
        mvc.perform(post("/api/sesion").session(sesion).contentType(MediaType.APPLICATION_JSON)
                .content("{\"usuario\":\"" + usuario + "\",\"contrasena\":\"1234\"}")).andExpect(status().isNoContent());
        return sesion;
    }

    /** Elige el bolsin por su precinto y devuelve el id de su primera documentacion. */
    private long elegir(MockHttpSession sesion, String precinto) throws Exception {
        String inicio = mvc.perform(get("/api/recepcion").session(sesion)).andReturn().getResponse().getContentAsString();
        List<Integer> ids = JsonPath.read(inicio, "$.bolsines[?(@.numeroPrecinto == '" + precinto + "')].id");
        String detalle = mvc.perform(get("/api/recepcion/" + ids.get(0)).session(sesion))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return ((Number) JsonPath.read(detalle, "$.remitos[0].documentacion[0].id")).longValue();
    }

    private String marcas(long idDocumentacion, String situacion) {
        return "{\"" + idDocumentacion + "\":\"" + situacion + "\"}";
    }

    @Test
    void todoLlegoYSeConfirmaCompletaElFlujoPrincipalYAvisaALaCmDeOrigen() throws Exception {
        MockHttpSession sesion = ingresar("sromero");
        elegir(sesion, "004533");
        mvc.perform(post("/api/recepcion/seleccion").session(sesion).contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estadoFinalBolsin").value("Recibido en CM destino"))
                .andExpect(jsonPath("$.remitos[0].estadoFinal").value("Recibido y aceptado"));
        mvc.perform(post("/api/recepcion/confirmacion").session(sesion))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.responsable").value("Silvina Romero"))
                .andExpect(jsonPath("$.avisos[0].cmDestino").exists())
                .andExpect(jsonPath("$.avisos[0].email").exists());
    }

    @Test
    void unDocumentoFaltanteDejaElRemitoParcialEnElResumen() throws Exception {
        MockHttpSession sesion = ingresar("sromero");
        long idDoc = elegir(sesion, "004512");
        mvc.perform(post("/api/recepcion/seleccion").session(sesion).contentType(MediaType.APPLICATION_JSON)
                        .content(marcas(idDoc, "FALTANTE")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.documentacion[?(@.id == " + idDoc + ")].situacion").value("FALTANTE"))
                .andExpect(jsonPath("$.remitos[0].estadoFinal").value("Recibido y aceptado parcial"));
        mvc.perform(delete("/api/recepcion/seleccion").session(sesion)).andExpect(status().isNoContent());
    }

    @Test
    void cancelarNoRegistraNada() throws Exception {
        MockHttpSession sesion = ingresar("sromero");
        elegir(sesion, "004577");
        mvc.perform(post("/api/recepcion/seleccion").session(sesion).contentType(MediaType.APPLICATION_JSON).content("{}"));
        mvc.perform(delete("/api/recepcion/seleccion").session(sesion)).andExpect(status().isNoContent());
        mvc.perform(post("/api/recepcion/confirmacion").session(sesion)).andExpect(status().isConflict());
        mvc.perform(get("/api/recepcion").session(sesion))
                .andExpect(jsonPath("$.bolsines[?(@.numeroPrecinto == '004577')]").isNotEmpty());
    }

    @Test
    void redirigirFueraDeLaCmcSeRechazaConSuMensaje() throws Exception {
        MockHttpSession sesion = ingresar("lpaz");
        String inicio = mvc.perform(get("/api/recepcion").session(sesion)).andReturn().getResponse().getContentAsString();
        String precinto = JsonPath.read(inicio, "$.bolsines[0].numeroPrecinto");
        long idDoc = elegir(sesion, precinto);
        mvc.perform(post("/api/recepcion/seleccion").session(sesion).contentType(MediaType.APPLICATION_JSON)
                        .content(marcas(idDoc, "REDIRIGIR")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.detail").value(Matchers.containsString("Comision Medica Central")));
    }
}
