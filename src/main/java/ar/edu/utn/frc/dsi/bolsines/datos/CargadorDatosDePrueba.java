package ar.edu.utn.frc.dsi.bolsines.datos;

import ar.edu.utn.frc.dsi.bolsines.entity.Bolsin;
import ar.edu.utn.frc.dsi.bolsines.entity.CambioEstadoBolsin;
import ar.edu.utn.frc.dsi.bolsines.entity.ComisionMedica;
import ar.edu.utn.frc.dsi.bolsines.entity.DetalleRemito;
import ar.edu.utn.frc.dsi.bolsines.entity.Documentacion;
import ar.edu.utn.frc.dsi.bolsines.entity.Empleado;
import ar.edu.utn.frc.dsi.bolsines.entity.Estado;
import ar.edu.utn.frc.dsi.bolsines.entity.Remito;
import ar.edu.utn.frc.dsi.bolsines.entity.TipoDocumentacion;
import ar.edu.utn.frc.dsi.bolsines.entity.Usuario;
import ar.edu.utn.frc.dsi.bolsines.repository.BolsinRepository;
import ar.edu.utn.frc.dsi.bolsines.repository.ComisionMedicaRepository;
import ar.edu.utn.frc.dsi.bolsines.repository.EmpleadoRepository;
import ar.edu.utn.frc.dsi.bolsines.repository.EstadoRepository;
import ar.edu.utn.frc.dsi.bolsines.repository.TipoDocumentacionRepository;
import ar.edu.utn.frc.dsi.bolsines.repository.UsuarioRepository;
import java.time.LocalDateTime;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Carga los datos de prueba de la demo al arrancar, solo si la base esta vacia. Duenio: T1.
 *
 * Hay un bolsin preparado para cada flujo que se muestra en la defensa (ver el guion en el README).
 * La documentacion llega a EnBolsinEnviado pasando por la maquina de estados (remitar,
 * generarBolsin, retirarBolsin), asi queda con su historial completo como en la realidad.
 *
 * Se apaga con bolsines.datos-de-prueba.cargar=false (lo usan los tests).
 */
@Component
@ConditionalOnProperty(name = "bolsines.datos-de-prueba.cargar", havingValue = "true", matchIfMissing = true)
public class CargadorDatosDePrueba implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(CargadorDatosDePrueba.class);
    private static final String CONTRASENA = "1234";

    private final ComisionMedicaRepository comisionMedicaRepository;
    private final UsuarioRepository usuarioRepository;
    private final EmpleadoRepository empleadoRepository;
    private final TipoDocumentacionRepository tipoDocumentacionRepository;
    private final EstadoRepository estadoRepository;
    private final BolsinRepository bolsinRepository;

    // ---------- lo que se va creando, para armar los bolsines ----------
    private ComisionMedica central;
    private ComisionMedica mendoza;
    private ComisionMedica cordoba;
    private ComisionMedica salta;
    private ComisionMedica parana;
    private ComisionMedica laPlata;

    private TipoDocumentacion expediente;
    private TipoDocumentacion dictamen;
    private TipoDocumentacion estudioMedico;
    private TipoDocumentacion cartaDocumento;

    private Estado bolsinCreado;
    private Estado bolsinCerrado;
    private Estado bolsinEnviado;
    private Estado remitoEnBolsinSaliente;
    private Estado remitoEnBolsinEnviado;

    private int proximoNumeroDocumentacion = 1;

    public CargadorDatosDePrueba(ComisionMedicaRepository comisionMedicaRepository,
                                 UsuarioRepository usuarioRepository, EmpleadoRepository empleadoRepository,
                                 TipoDocumentacionRepository tipoDocumentacionRepository,
                                 EstadoRepository estadoRepository, BolsinRepository bolsinRepository) {
        this.comisionMedicaRepository = comisionMedicaRepository;
        this.usuarioRepository = usuarioRepository;
        this.empleadoRepository = empleadoRepository;
        this.tipoDocumentacionRepository = tipoDocumentacionRepository;
        this.estadoRepository = estadoRepository;
        this.bolsinRepository = bolsinRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (cargar()) {
            log.info("Datos de prueba cargados: {} bolsines. Ingresar con sromero / {} (CMC).",
                    bolsinRepository.count(), CONTRASENA);
        } else {
            log.info("La base ya tenia datos: no se cargan los de prueba.");
        }
    }

    /** Carga todo si la base esta vacia. Devuelve false si ya habia datos. */
    @Transactional
    public boolean cargar() {
        if (comisionMedicaRepository.count() > 0) {
            return false;
        }
        cargarComisionesMedicas();
        cargarTiposDocumentacion();
        cargarEstados();
        cargarEmpleadosYBolsines();
        return true;
    }

    // =====================================================================
    // DATOS DE SOPORTE
    // =====================================================================

    private void cargarComisionesMedicas() {
        central = cm(ComisionMedica.CODIGO_CENTRAL, "Comision Medica Central", "Av. de Mayo 760, C.A.B.A.");
        mendoza = cm("MZA", "CM Mendoza", "San Martin 1150, Mendoza");
        cordoba = cm("COR", "CM Cordoba", "Colon 350, Cordoba");
        salta = cm("SAL", "CM Salta", "Belgrano 420, Salta");
        parana = cm("PAR", "CM Parana", "Urquiza 800, Parana");
        laPlata = cm("LPL", "CM La Plata", "Calle 7 1020, La Plata");
    }

    private ComisionMedica cm(String codigo, String nombre, String direccion) {
        String email = "mesa." + codigo.toLowerCase() + "@comisiones.gob.ar";
        return comisionMedicaRepository.save(new ComisionMedica(codigo, nombre, direccion, email, "0800-333-0000"));
    }

    private void cargarTiposDocumentacion() {
        expediente = tipoDocumentacionRepository.save(new TipoDocumentacion("Expediente", "Expediente de un tramite"));
        dictamen = tipoDocumentacionRepository.save(new TipoDocumentacion("Dictamen", "Dictamen de una comision medica"));
        estudioMedico = tipoDocumentacionRepository.save(new TipoDocumentacion("Estudio medico", "Estudios e imagenes"));
        cartaDocumento = tipoDocumentacionRepository.save(new TipoDocumentacion("Carta documento", "Comunicacion fehaciente"));
    }

    /**
     * Estados de Bolsin y de Remito (la Documentacion usa el patron State, no esta clase).
     * Los que busca el gestor usan las constantes de Estado.
     */
    private void cargarEstados() {
        bolsinCreado = estado("Creado", "El bolsin se esta armando", Estado.AMBITO_BOLSIN);
        bolsinCerrado = estado("Cerrado", "Bolsin precintado, listo para el correo", Estado.AMBITO_BOLSIN);
        bolsinEnviado = estado(Estado.ENVIADO, "El correo retiro el bolsin", Estado.AMBITO_BOLSIN);
        estado(Estado.RECIBIDO_EN_CM_DESTINO, "El bolsin llego a la CM destino", Estado.AMBITO_BOLSIN);
        estado("De baja", "Bolsin eliminado", Estado.AMBITO_BOLSIN);

        estado("Creado", "Remito generado", Estado.AMBITO_REMITO);
        remitoEnBolsinSaliente = estado("En bolsin saliente", "Remito dentro de un bolsin", Estado.AMBITO_REMITO);
        remitoEnBolsinEnviado = estado("En bolsin enviado", "El bolsin del remito fue enviado", Estado.AMBITO_REMITO);
        estado(Estado.RECIBIDO_Y_ACEPTADO, "Llego toda la documentacion", Estado.AMBITO_REMITO);
        estado(Estado.RECIBIDO_Y_ACEPTADO_PARCIAL, "No llego bien toda la documentacion", Estado.AMBITO_REMITO);
    }

    private Estado estado(String nombre, String descripcion, String ambito) {
        return estadoRepository.save(new Estado(nombre, descripcion, ambito));
    }

    private Empleado encargado(String usuario, String nombre, String apellido, ComisionMedica cm) {
        Usuario u = usuarioRepository.save(new Usuario(usuario, CONTRASENA));
        return empleadoRepository.save(new Empleado(nombre, apellido, usuario + "@comisiones.gob.ar", u, cm));
    }

    // =====================================================================
    // BOLSINES: uno por cada flujo de la demo
    // =====================================================================

    private void cargarEmpleadosYBolsines() {
        encargado("sromero", "Silvina", "Romero", central);
        Empleado deMendoza = encargado("pgil", "Pedro", "Gil", mendoza);
        Empleado deCordoba = encargado("lpaz", "Laura", "Paz", cordoba);
        Empleado deSalta = encargado("mrios", "Martin", "Rios", salta);
        Empleado deParana = encargado("aluna", "Ana", "Luna", parana);
        Empleado deLaPlata = encargado("cvega", "Carlos", "Vega", laPlata);

        LocalDateTime ahora = LocalDateTime.now().withSecond(0).withNano(0);

        // Flujo principal: llega todo completo.
        Bolsin b1291 = enviado(1291, "004533", 480, cordoba, central, deCordoba, ahora.minusDays(2));
        remito(b1291, 410, deCordoba, ahora.minusDays(2),
                doc("Expediente de incapacidad laboral - Legajo 8812", expediente),
                doc("Dictamen de comision - Legajo 8812", dictamen),
                doc("Estudio audiometrico - Legajo 8812", estudioMedico));

        // A3: el EB marca que falta la radiografia.
        Bolsin b1287 = enviado(1287, "004512", 1250, mendoza, central, deMendoza, ahora.minusDays(3));
        remito(b1287, 213, deMendoza, ahora.minusDays(3),
                doc("Expediente de enfermedad profesional - Legajo 5521", expediente),
                doc("Dictamen de comision - Legajo 5521", dictamen));
        remito(b1287, 214, deMendoza, ahora.minusDays(3),
                doc("Radiografia de rodilla - Legajo 6034", estudioMedico),
                doc("Expediente de accidente in itinere - Legajo 6034", expediente));
        remito(b1287, 215, deMendoza, ahora.minusDays(3),
                doc("Carta documento al empleador - Legajo 7190", cartaDocumento));

        // A4: llega documentacion que no corresponde a la CMC.
        Bolsin b1302 = enviado(1302, "004577", 300, parana, central, deParana, ahora.minusDays(1));
        remito(b1302, 512, deParana, ahora.minusDays(1),
                doc("Dictamen de comision - Legajo 3307", dictamen),
                doc("Expediente para CM Rosario - Legajo 3410", expediente));

        // A5: documentacion que hay que redirigir a un area de la sede central.
        Bolsin b1275 = enviado(1275, "004498", 650, salta, central, deSalta, ahora.minusDays(2));
        remito(b1275, 620, deSalta, ahora.minusDays(2),
                doc("Recurso de apelacion - Legajo 9021 (para Asuntos Legales)", expediente),
                doc("Dictamen de comision - Legajo 9021", dictamen));
        remito(b1275, 621, deSalta, ahora.minusDays(2),
                doc("Estudio de resonancia - Legajo 9188", estudioMedico));

        // De repuesto, por si hay que repetir algun flujo.
        Bolsin b1310 = enviado(1310, "004601", 420, laPlata, central, deLaPlata, ahora.minusDays(1));
        remito(b1310, 700, deLaPlata, ahora.minusDays(1),
                doc("Expediente de incapacidad laboral - Legajo 1204", expediente),
                doc("Estudio de laboratorio - Legajo 1204", estudioMedico));

        Bolsin b1315 = enviado(1315, "004620", 900, mendoza, central, deMendoza, ahora.minusHours(5));
        remito(b1315, 216, deMendoza, ahora.minusHours(5),
                doc("Expediente de reingreso - Legajo 4470", expediente),
                doc("Dictamen de comision - Legajo 4470", dictamen));
        remito(b1315, 217, deMendoza, ahora.minusHours(5),
                doc("Carta documento a la ART - Legajo 4512", cartaDocumento),
                doc("Estudio ergometrico - Legajo 4512", estudioMedico));

        // Va a CM Cordoba: no aparece para la CMC. Con lpaz sirve para ver que solo la CMC redirige.
        Bolsin b1320 = enviado(1320, "004640", 350, mendoza, cordoba, deMendoza, ahora.minusDays(1));
        remito(b1320, 218, deMendoza, ahora.minusDays(1),
                doc("Expediente de incapacidad laboral - Legajo 2290", expediente));

        // Todavia Cerrado (el correo no lo retiro): no aparece en ningun listado.
        Bolsin b1325 = cerrado(1325, "004650", 200, salta, central, deSalta, ahora.minusHours(3));
        Remito remito622 = new Remito(622, ahora.minusHours(4), salta, central, remitoEnBolsinSaliente);
        Documentacion pendiente = new Documentacion("Expediente pendiente de envio - Legajo 9300",
                ahora.minusDays(1), proximoNumeroDocumentacion++, expediente);
        pendiente.remitar(ahora.minusHours(6), deSalta);
        pendiente.generarBolsin(ahora.minusHours(4), deSalta);
        remito622.agregarDetalle(new DetalleRemito(1, ahora.minusHours(4), pendiente));
        b1325.agregarRemito(remito622);

        bolsinRepository.save(b1291);
        bolsinRepository.save(b1287);
        bolsinRepository.save(b1302);
        bolsinRepository.save(b1275);
        bolsinRepository.save(b1310);
        bolsinRepository.save(b1315);
        bolsinRepository.save(b1320);
        bolsinRepository.save(b1325);
    }

    /** Bolsin con su historial Creado -> Cerrado -> Enviado (este ultimo vigente). */
    private Bolsin enviado(int numero, String precinto, int pesoGramos, ComisionMedica origen,
                           ComisionMedica destino, Empleado responsable, LocalDateTime fechaEnvio) {
        Bolsin bolsin = new Bolsin(numero, precinto, pesoGramos, fechaEnvio.minusDays(1), origen, destino);
        CambioEstadoBolsin creado = new CambioEstadoBolsin(fechaEnvio.minusDays(1), bolsinCreado, responsable);
        creado.setFechaHoraFin(fechaEnvio.minusHours(12));
        CambioEstadoBolsin cerrado = new CambioEstadoBolsin(fechaEnvio.minusHours(12), bolsinCerrado, responsable);
        cerrado.setFechaHoraFin(fechaEnvio);
        bolsin.agregarCambioEstado(creado);
        bolsin.agregarCambioEstado(cerrado);
        bolsin.agregarCambioEstado(new CambioEstadoBolsin(fechaEnvio, bolsinEnviado, responsable));
        return bolsin;
    }

    /** Bolsin con su historial Creado -> Cerrado (este ultimo vigente). */
    private Bolsin cerrado(int numero, String precinto, int pesoGramos, ComisionMedica origen,
                           ComisionMedica destino, Empleado responsable, LocalDateTime fechaCierre) {
        Bolsin bolsin = new Bolsin(numero, precinto, pesoGramos, fechaCierre.minusHours(2), origen, destino);
        CambioEstadoBolsin creado = new CambioEstadoBolsin(fechaCierre.minusHours(2), bolsinCreado, responsable);
        creado.setFechaHoraFin(fechaCierre);
        bolsin.agregarCambioEstado(creado);
        bolsin.agregarCambioEstado(new CambioEstadoBolsin(fechaCierre, bolsinCerrado, responsable));
        return bolsin;
    }

    /**
     * Remito "En bolsin enviado" cuya documentacion se lleva por la maquina de estados hasta
     * EnBolsinEnviado, con el empleado de la CM de origen como responsable de cada cambio.
     */
    private void remito(Bolsin bolsin, int numero, Empleado responsable, LocalDateTime fechaEnvio,
                        DocumentacionNueva... documentos) {
        Remito remito = new Remito(numero, fechaEnvio.minusDays(2), bolsin.getCmOrigen(), bolsin.getDestino(),
                remitoEnBolsinEnviado);
        int numeroDetalle = 1;
        for (DocumentacionNueva nueva : documentos) {
            Documentacion documentacion = new Documentacion(nueva.asunto(), fechaEnvio.minusDays(4),
                    proximoNumeroDocumentacion++, nueva.tipo());
            documentacion.remitar(fechaEnvio.minusDays(2), responsable);
            documentacion.generarBolsin(fechaEnvio.minusDays(1), responsable);
            documentacion.retirarBolsin(fechaEnvio, responsable);
            remito.agregarDetalle(new DetalleRemito(numeroDetalle++, fechaEnvio.minusDays(2), documentacion));
        }
        bolsin.agregarRemito(remito);
    }

    private static DocumentacionNueva doc(String asunto, TipoDocumentacion tipo) {
        return new DocumentacionNueva(asunto, tipo);
    }

    private record DocumentacionNueva(String asunto, TipoDocumentacion tipo) {
    }
}
