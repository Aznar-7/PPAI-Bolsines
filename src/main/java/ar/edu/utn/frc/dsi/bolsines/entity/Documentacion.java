package ar.edu.utn.frc.dsi.bolsines.entity;

import ar.edu.utn.frc.dsi.bolsines.entity.estado.EstadoDocumentacion;
import ar.edu.utn.frc.dsi.bolsines.entity.estado.EstadoDocumentacionConverter;
import ar.edu.utn.frc.dsi.bolsines.entity.estado.Registrada;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * CONTEXTO del patron State. Duenio: T4 (Trini).
 *
 * Cada operacion de la maquina de estados es UNA linea que delega en el estado actual:
 *   estadoActual.aceptar(this, fechaHoraActual, empleado, cambiosEstado);
 * Sin ifs ni switch preguntando en que estado esta.
 */
@Entity
public class Documentacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String asunto;
    private LocalDateTime fechaPase;
    private Integer numero;

    @ManyToOne
    private TipoDocumentacion tieneUn;

    @Convert(converter = EstadoDocumentacionConverter.class)
    @Column(name = "estado_actual")
    private EstadoDocumentacion estadoActual;

    @OneToMany(cascade = CascadeType.ALL)
    @JoinColumn(name = "documentacion_id")
    @OrderBy("fechaHoraInicio")
    private List<CambioEstadoDocumentacion> cambiosEstado = new ArrayList<>();

    protected Documentacion() {
    }

    /**
     * new(asunto, fechaPase, numero) del diagrama.
     */
    public Documentacion(String asunto, LocalDateTime fechaPase, Integer numero, TipoDocumentacion tipo) {
        this.asunto = asunto;
        this.fechaPase = fechaPase;
        this.numero = numero;
        this.tieneUn = tipo;
        this.estadoActual = new Registrada();
        agregarCambioEstado(new CambioEstadoDocumentacion(fechaPase, estadoActual, null));
    }

    // ---------- transiciones: delegan en el estado actual ----------

    public void remitar(LocalDateTime fechaHoraActual, Empleado empleado) {
        estadoActual.remitar(this, fechaHoraActual, empleado, cambiosEstado);
    }

    public void cancelarRemito(LocalDateTime fechaHoraActual, Empleado empleado) {
        estadoActual.cancelarRemito(this, fechaHoraActual, empleado, cambiosEstado);
    }

    public void generarBolsin(LocalDateTime fechaHoraActual, Empleado empleado) {
        estadoActual.generarBolsin(this, fechaHoraActual, empleado, cambiosEstado);
    }

    public void modificarBolsin(LocalDateTime fechaHoraActual, Empleado empleado) {
        estadoActual.modificarBolsin(this, fechaHoraActual, empleado, cambiosEstado);
    }

    public void eliminarBolsin(LocalDateTime fechaHoraActual, Empleado empleado) {
        estadoActual.eliminarBolsin(this, fechaHoraActual, empleado, cambiosEstado);
    }

    public void retirarBolsin(LocalDateTime fechaHoraActual, Empleado empleado) {
        estadoActual.retirarBolsin(this, fechaHoraActual, empleado, cambiosEstado);
    }

    public void aceptar(LocalDateTime fechaHoraActual, Empleado empleado) {
        estadoActual.aceptar(this, fechaHoraActual, empleado, cambiosEstado);
    }

    public void rechazar(LocalDateTime fechaHoraActual, Empleado empleado) {
        estadoActual.rechazar(this, fechaHoraActual, empleado, cambiosEstado);
    }

    public void registrarFaltaDocumentacion(LocalDateTime fechaHoraActual, Empleado empleado) {
        estadoActual.registrarFaltaDocumentacion(this, fechaHoraActual, empleado, cambiosEstado);
    }

    public void redirigir(LocalDateTime fechaHoraActual, Empleado empleado) {
        estadoActual.redirigir(this, fechaHoraActual, empleado, cambiosEstado);
    }

    public void reenviar(LocalDateTime fechaHoraActual, Empleado empleado) {
        estadoActual.reenviar(this, fechaHoraActual, empleado, cambiosEstado);
    }

    public void darDeBaja(LocalDateTime fechaHoraActual, Empleado empleado) {
        estadoActual.darDeBaja(this, fechaHoraActual, empleado, cambiosEstado);
    }

    // ---------- usados por los estados concretos al terminar una transicion ----------

    public void setEstado(EstadoDocumentacion estado) {
        this.estadoActual = estado;
    }

    public void agregarCambioEstado(CambioEstadoDocumentacion cambioEstado) {
        cambiosEstado.add(cambioEstado);
    }

    // ---------- consultas ----------

    public String getAsunto() {
        return asunto;
    }

    public TipoDocumentacion getTipoDocumentacion() {
        return tieneUn;
    }

    public EstadoDocumentacion getEstado() {
        return estadoActual;
    }

    public List<CambioEstadoDocumentacion> getCambiosEstado() {
        return cambiosEstado;
    }

    public LocalDateTime getFechaPase() {
        return fechaPase;
    }

    public Integer getNumero() {
        return numero;
    }

    public Long getId() {
        return id;
    }
}
