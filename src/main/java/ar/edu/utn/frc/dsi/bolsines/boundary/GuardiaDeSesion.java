package ar.edu.utn.frc.dsi.bolsines.boundary;

import ar.edu.utn.frc.dsi.bolsines.servicio.ServicioSesion;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Sin sesion no se entra a la recepcion: el gestor necesita saber quien esta logueado.
 * Responde 401 y el front manda al ingreso.
 */
@Configuration
public class GuardiaDeSesion implements HandlerInterceptor, WebMvcConfigurer {

    private final ServicioSesion servicioSesion;

    public GuardiaDeSesion(ServicioSesion servicioSesion) {
        this.servicioSesion = servicioSesion;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(this).addPathPatterns("/api/recepcion", "/api/recepcion/**");
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws Exception {
        if (PantallaIngreso.haySesion(servicioSesion, request.getSession())) {
            return true;
        }
        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write("{\"status\":401,\"detail\":\"Ingresá con tu usuario para recibir bolsines.\"}");
        return false;
    }
}
