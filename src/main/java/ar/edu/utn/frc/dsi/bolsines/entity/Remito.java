package ar.edu.utn.frc.dsi.bolsines.entity;

import jakarta.persistence.CascadeType;
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

/** Duenio: T5 (Agustin). */
@Entity
public class Remito {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDateTime fecha;
    private Integer numero;

    @ManyToOne
    private ComisionMedica origen;

    @ManyToOne
    private ComisionMedica destino;

    @ManyToOne
    private Estado estado;

    @OneToMany(cascade = CascadeType.ALL)
    @JoinColumn(name = "remito_id")
    @OrderBy("numero")
    private List<DetalleRemito> detalleRemito = new ArrayList<>();

    protected Remito() {
    }

    public Remito(Integer numero, LocalDateTime fecha, ComisionMedica origen, ComisionMedica destino, Estado estado) {
        this.numero = numero;
        this.fecha = fecha;
        this.origen = origen;
        this.destino = destino;
        this.estado = estado;
    }

    // ---------- metodos del diagrama de clases ----------

    public String mostrarInfoRemito() {
        return "Remito " + numero;
    }

    public Integer getNumero() {
        return numero;
    }

    /**
     * Flujo principal: el remito pasa al estado que le indica el gestor (Recibido y aceptado)
     * y le pide a cada detalle que acepte su documentacion.
     */
    public void recibir(LocalDateTime fechaHoraActual, Empleado empleado, Estado estadoRemito) {
        setEstado(estadoRemito);
        for (DetalleRemito detalle : detalleRemito) {
            detalle.aceptarDocumentacion(fechaHoraActual, empleado);
        }
    }

    // ---------- soporte ----------

    public void agregarDetalle(DetalleRemito detalle) {
        detalleRemito.add(detalle);
    }

    public List<DetalleRemito> getDetalleRemito() {
        return detalleRemito;
    }

    public Estado getEstado() {
        return estado;
    }

    public void setEstado(Estado estado) {
        this.estado = estado;
    }

    public ComisionMedica getOrigen() {
        return origen;
    }

    public ComisionMedica getDestino() {
        return destino;
    }

    public LocalDateTime getFecha() {
        return fecha;
    }

    public Long getId() {
        return id;
    }
}
