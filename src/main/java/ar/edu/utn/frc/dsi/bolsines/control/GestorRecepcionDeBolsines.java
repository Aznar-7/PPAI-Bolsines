package ar.edu.utn.frc.dsi.bolsines.control;

import ar.edu.utn.frc.dsi.bolsines.control.dto.BolsinResumen;
import ar.edu.utn.frc.dsi.bolsines.control.dto.DetalleBolsin;
import ar.edu.utn.frc.dsi.bolsines.control.dto.DocumentacionVista;
import ar.edu.utn.frc.dsi.bolsines.control.dto.InicioRecepcion;
import ar.edu.utn.frc.dsi.bolsines.control.dto.RemitoVista;
import ar.edu.utn.frc.dsi.bolsines.control.dto.ResultadoRecepcion;
import ar.edu.utn.frc.dsi.bolsines.control.dto.ResumenRecepcion;
import ar.edu.utn.frc.dsi.bolsines.control.dto.SituacionRecepcion;
import ar.edu.utn.frc.dsi.bolsines.entity.Bolsin;
import ar.edu.utn.frc.dsi.bolsines.entity.CambioEstadoBolsin;
import ar.edu.utn.frc.dsi.bolsines.entity.ComisionMedica;
import ar.edu.utn.frc.dsi.bolsines.entity.DetalleRemito;
import ar.edu.utn.frc.dsi.bolsines.entity.Documentacion;
import ar.edu.utn.frc.dsi.bolsines.entity.Empleado;
import ar.edu.utn.frc.dsi.bolsines.entity.Estado;
import ar.edu.utn.frc.dsi.bolsines.entity.Remito;
import ar.edu.utn.frc.dsi.bolsines.repository.BolsinRepository;
import ar.edu.utn.frc.dsi.bolsines.repository.EstadoRepository;
import ar.edu.utn.frc.dsi.bolsines.servicio.AvisoNotificacion;
import ar.edu.utn.frc.dsi.bolsines.servicio.InterfazNotificacion;
import ar.edu.utn.frc.dsi.bolsines.servicio.ServicioSesion;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.annotation.SessionScope;

/**
 * <<control>> del CU 28 Registrar recepcion de bolsin. Duenio: T5 y T6 (Agustin).
 *
 * Coordina el caso de uso (patron GRASP Controlador): no cambia estados por su cuenta, le pide a
 * cada entidad que haga lo suyo (patron GRASP Experto). La cadena es la del diagrama de secuencia:
 * gestor -> Bolsin.recibirBolsin -> Remito.recibir -> DetalleRemito.aceptarDocumentacion
 * -> Documentacion.aceptar -> el estado actual de la documentacion (patron State).
 *
 * Vive en la sesion HTTP porque recuerda el bolsin seleccionado y las marcas entre pantallas.
 * Guarda el id del bolsin, no el objeto: entre una pantalla y otra el objeto queda desconectado
 * de la base, asi que se vuelve a leer en cada paso.
 *
 * CONTRATO CON LA PANTALLA: los cinco metodos publicos de abajo. Sus firmas no se cambian sin
 * avisar a Aznar.
 */
@Component
@SessionScope
public class GestorRecepcionDeBolsines {

    // ---------- atributos del diagrama de clases ----------
    private LocalDateTime fechaHoraActual;
    private Empleado empleadoLogueado;
    private ComisionMedica cmUsuario;
    private Long idBolsinSeleccionado;
    private Estado estadoRecibidoEnCMDestino;
    private Estado estadoRecibidoYAceptado;
    private Map<Long, SituacionRecepcion> opSeleccionada;
    private ResumenRecepcion resumenSeleccionado;

    // ---------- colaboradores ----------
    private final BolsinRepository bolsinRepository;
    private final EstadoRepository estadoRepository;
    private final ServicioSesion servicioSesion;
    private final InterfazNotificacion notificacion;

    /**
     * Mientras Vale no termine la sesion (T2) y los datos (T1), la pantalla trabaja con datos de
     * mentira. Se controla con bolsines.gestor.datos-de-mentira en application.properties.
     * En la T9 se pone en false y se borra GestorDatosDeMentira.
     */
    private final boolean usarDatosDeMentira;
    private final GestorDatosDeMentira mentira = new GestorDatosDeMentira();

    public GestorRecepcionDeBolsines(BolsinRepository bolsinRepository, EstadoRepository estadoRepository,
                                     ServicioSesion servicioSesion, InterfazNotificacion notificacion,
                                     @Value("${bolsines.gestor.datos-de-mentira:false}") boolean usarDatosDeMentira) {
        this.bolsinRepository = bolsinRepository;
        this.estadoRepository = estadoRepository;
        this.servicioSesion = servicioSesion;
        this.notificacion = notificacion;
        this.usarDatosDeMentira = usarDatosDeMentira;
    }

    // =====================================================================
    // CONTRATO PUBLICO (lo usa PantallaRecepcionDeBolsines)
    // =====================================================================

    /** Pasos 1 a 4: CM del usuario logueado y bolsines en estado Enviado hacia esa CM. */
    @Transactional(readOnly = true)
    public InicioRecepcion opcionRegistrarRecepcionDeBolsin() {
        if (usarDatosDeMentira) {
            return mentira.inicio();
        }
        empleadoLogueado = getUsuarioLogueado();
        cmUsuario = getCM();

        List<BolsinResumen> bolsines = new ArrayList<>();
        for (Bolsin bolsin : getBolsinParaCM()) {
            bolsines.add(resumir(bolsin));
        }
        return new InicioRecepcion(empleadoLogueado.getNombre() + " " + empleadoLogueado.getApellido(),
                cmUsuario.getName(), cmUsuario.esCentral(), bolsines);
    }

    /** Pasos 5 y 6: guarda el bolsin elegido y devuelve sus remitos y documentacion. */
    @Transactional(readOnly = true)
    public DetalleBolsin tomarSeleccionBolsin(Long idBolsin) {
        if (usarDatosDeMentira) {
            return mentira.detalle(idBolsin);
        }
        Bolsin bolsin = bolsinRepository.findById(idBolsin)
                .orElseThrow(() -> new RecepcionException("No existe el bolsin seleccionado."));
        if (!bolsin.esDeCM(cmUsuario) || !bolsin.esEnviado()) {
            throw new RecepcionException("El bolsin " + bolsin.getNumeroBolsin()
                    + " no esta pendiente de recepcion en tu comision medica.");
        }
        idBolsinSeleccionado = bolsin.getId();
        opSeleccionada = null;
        resumenSeleccionado = null;
        return detallar(bolsin);
    }

    /**
     * Pasos 7 a 9: recibe como llego cada documentacion (id de documentacion -> situacion).
     * Lo que no viene en el mapa se toma como RECIBIDA. Devuelve como va a quedar todo.
     *
     * @throws RecepcionException si se marca REDIRIGIR y la CM del usuario no es la CMC (A5)
     */
    @Transactional(readOnly = true)
    public ResumenRecepcion tomarSeleccionRecepcionBolsin(Map<Long, SituacionRecepcion> marcas) {
        if (usarDatosDeMentira) {
            return mentira.resumen(marcas);
        }
        Bolsin bolsin = getBolsinSeleccionado();
        opSeleccionada = new HashMap<>(marcas);
        resumenSeleccionado = armarResumen(bolsin);
        return resumenSeleccionado;
    }

    /** Pasos 10 a 12: registra la recepcion, notifica (CU 29) y devuelve el resultado. */
    @Transactional
    public ResultadoRecepcion tomarConfirmacionRegistro() {
        if (usarDatosDeMentira) {
            return mentira.resultado();
        }
        if (resumenSeleccionado == null) {
            throw new RecepcionException("Primero hay que indicar como llego la documentacion.");
        }
        if (resumenSeleccionado.documentacion().stream()
                .anyMatch(d -> d.situacion() != SituacionRecepcion.RECIBIDA)) {
            throw new UnsupportedOperationException("TODO T6: flujos alternativos A3, A4 y A5");
        }
        Bolsin bolsin = getBolsinSeleccionado();

        fechaHoraActual = obtenerFechaHoraActual();
        buscarEstados();
        actualizarEstados(bolsin);
        bolsinRepository.save(bolsin);

        List<AvisoNotificacion> avisos = ejecutarCU29();
        ResultadoRecepcion resultado = new ResultadoRecepcion(fechaHoraActual,
                empleadoLogueado.getNombre() + " " + empleadoLogueado.getApellido(),
                resumenSeleccionado, avisos);
        finDeCU();
        return resultado;
    }

    /** Observacion 1 / A6: descarta el bolsin seleccionado y las marcas sin guardar nada. */
    public void cancelar() {
        if (usarDatosDeMentira) {
            mentira.cancelar();
            return;
        }
        finDeCU();
    }

    // =====================================================================
    // METODOS INTERNOS DEL DIAGRAMA DE SECUENCIA
    // =====================================================================

    /** Camino del diagrama: Sesion -> Usuario -> Empleado. Lo resuelve el servicio de sesion (T2). */
    private Empleado getUsuarioLogueado() {
        Empleado empleado = servicioSesion.getEmpleadoLogueado();
        if (empleado == null) {
            throw new RecepcionException("No hay un usuario logueado.");
        }
        return empleado;
    }

    private ComisionMedica getCM() {
        return empleadoLogueado.getCM();
    }

    /** Recorre los bolsines y se queda con los enviados hacia la CM del usuario (pasos 3 y 4). */
    private List<Bolsin> getBolsinParaCM() {
        List<Bolsin> bolsinesParaCM = new ArrayList<>();
        for (Bolsin bolsin : bolsinRepository.findAll()) {
            if (bolsin.esDeCM(cmUsuario) && bolsin.esEnviado()) {
                bolsinesParaCM.add(bolsin);
            }
        }
        return bolsinesParaCM;
    }

    private LocalDateTime obtenerFechaHoraActual() {
        return LocalDateTime.now();
    }

    /**
     * Recorre los Estado y se queda con el de ambito Bolsin "Recibido en CM destino" y el de
     * ambito Remito "Recibido y aceptado". Son los dos loops del diagrama de secuencia.
     */
    private void buscarEstados() {
        estadoRecibidoEnCMDestino = null;
        estadoRecibidoYAceptado = null;
        for (Estado estado : estadoRepository.findAll()) {
            if (estado.esAmbito(Estado.AMBITO_BOLSIN) && estado.esRecibidoEnCMDestino()) {
                estadoRecibidoEnCMDestino = estado;
            }
            if (estado.esAmbito(Estado.AMBITO_REMITO) && estado.esRecibidoYAceptado()) {
                estadoRecibidoYAceptado = estado;
            }
        }
        if (estadoRecibidoEnCMDestino == null || estadoRecibidoYAceptado == null) {
            throw new IllegalStateException("Faltan cargar los estados 'Recibido en CM destino' (Bolsin) "
                    + "o 'Recibido y aceptado' (Remito).");
        }
    }

    /** El gestor no cambia estados: se lo pide al bolsin, que a su vez se lo pide a cada remito. */
    private void actualizarEstados(Bolsin bolsin) {
        bolsin.recibirBolsin(fechaHoraActual, empleadoLogueado, estadoRecibidoEnCMDestino, estadoRecibidoYAceptado);
    }

    /** <<include>> CU 29 Notificar recepcion de bolsin. */
    private List<AvisoNotificacion> ejecutarCU29() {
        return notificacion.notificarRecepcion(resumenSeleccionado);
    }

    private void finDeCU() {
        idBolsinSeleccionado = null;
        opSeleccionada = null;
        resumenSeleccionado = null;
    }

    // =====================================================================
    // ARMADO DE LO QUE SE LE DEVUELVE A LA PANTALLA
    // =====================================================================

    private Bolsin getBolsinSeleccionado() {
        if (idBolsinSeleccionado == null) {
            throw new RecepcionException("Primero hay que seleccionar un bolsin.");
        }
        return bolsinRepository.findById(idBolsinSeleccionado)
                .orElseThrow(() -> new RecepcionException("El bolsin seleccionado ya no existe."));
    }

    private BolsinResumen resumir(Bolsin bolsin) {
        int documentos = 0;
        for (Remito remito : bolsin.getRemitos()) {
            documentos += remito.getDetalleRemito().size();
        }
        return new BolsinResumen(bolsin.getId(), bolsin.getNumeroBolsin(), bolsin.getNroPrecinto(),
                bolsin.getCmOrigen().getName(), bolsin.getRemitos().size(), documentos, bolsin.getPeso(),
                fechaEnvio(bolsin));
    }

    /** Fecha en que el bolsin paso a Enviado: el inicio de su cambio de estado vigente. */
    private LocalDateTime fechaEnvio(Bolsin bolsin) {
        for (CambioEstadoBolsin cambioEstado : bolsin.getCambiosEstado()) {
            if (cambioEstado.esActual()) {
                return cambioEstado.getFechaHoraInicio();
            }
        }
        return bolsin.getFecha();
    }

    /** Paso 6: por cada remito su numero, y por cada documentacion su asunto y su tipo. */
    private DetalleBolsin detallar(Bolsin bolsin) {
        List<RemitoVista> remitos = new ArrayList<>();
        for (Remito remito : bolsin.getRemitos()) {
            List<DocumentacionVista> documentacion = new ArrayList<>();
            for (DetalleRemito detalle : remito.getDetalleRemito()) {
                Documentacion doc = detalle.getDocumentacion();
                documentacion.add(new DocumentacionVista(doc.getId(), doc.getNumero(), doc.getAsunto(),
                        doc.getTipoDocumentacion().getNombre()));
            }
            remitos.add(new RemitoVista(remito.getNumero(), documentacion));
        }
        return new DetalleBolsin(resumir(bolsin), bolsin.getDestino().getName(), remitos);
    }

    /** Paso 9: como van a quedar el bolsin, cada remito y cada documentacion si se confirma. */
    private ResumenRecepcion armarResumen(Bolsin bolsin) {
        List<ResumenRecepcion.Remito> remitos = new ArrayList<>();
        List<ResumenRecepcion.Documento> documentos = new ArrayList<>();
        Set<String> cmANotificar = new LinkedHashSet<>();

        for (Remito remito : bolsin.getRemitos()) {
            boolean completo = true;
            for (DetalleRemito detalle : remito.getDetalleRemito()) {
                Documentacion doc = detalle.getDocumentacion();
                SituacionRecepcion situacion = opSeleccionada.getOrDefault(doc.getId(), SituacionRecepcion.RECIBIDA);
                completo &= situacion == SituacionRecepcion.RECIBIDA;
                documentos.add(new ResumenRecepcion.Documento(doc.getId(), remito.getNumero(), doc.getAsunto(),
                        doc.getTipoDocumentacion().getNombre(), situacion));
            }
            remitos.add(new ResumenRecepcion.Remito(remito.getNumero(),
                    completo ? Estado.RECIBIDO_Y_ACEPTADO : Estado.RECIBIDO_Y_ACEPTADO_PARCIAL));
            cmANotificar.add(remito.getOrigen() != null ? remito.getOrigen().getName() : bolsin.getCmOrigen().getName());
        }
        return new ResumenRecepcion(detallar(bolsin), Estado.RECIBIDO_EN_CM_DESTINO, remitos, documentos,
                new ArrayList<>(cmANotificar));
    }
}
