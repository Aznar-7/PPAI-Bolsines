package ar.edu.utn.frc.dsi.bolsines.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import java.time.LocalDateTime;

/** Duenio: T5 (Agustin). */
@Entity
public class DetalleRemito {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDateTime fecha;
    private Integer numero;

    @ManyToOne(cascade = CascadeType.ALL)
    private Documentacion documentacion;

    protected DetalleRemito() {
    }

    public DetalleRemito(Integer numero, LocalDateTime fecha, Documentacion documentacion) {
        this.numero = numero;
        this.fecha = fecha;
        this.documentacion = documentacion;
    }

    public Documentacion getDocumentacion() {
        return documentacion;
    }

    /** Flujo principal: delega en documentacion.aceptar(...). Lo de adentro es el patron State. */
    public void aceptarDocumentacion(LocalDateTime fechaHoraActual, Empleado empleado) {
        documentacion.aceptar(fechaHoraActual, empleado);
    }

    /**
     * Le pide a la documentacion la operacion que corresponde a como llego.
     *
     * El switch es sobre lo que eligio el usuario, NO sobre el estado de la documentacion: aca se
     * decide QUE pedir; si se puede y a que estado pasa lo decide el estado actual (patron State).
     */
    public void recibirDocumentacion(LocalDateTime fechaHoraActual, Empleado empleado, SituacionRecepcion situacion) {
        switch (situacion) {
            case RECIBIDA -> aceptarDocumentacion(fechaHoraActual, empleado);
            case FALTANTE -> documentacion.registrarFaltaDocumentacion(fechaHoraActual, empleado);
            case NO_CORRESPONDE -> documentacion.rechazar(fechaHoraActual, empleado);
            case REDIRIGIR -> documentacion.redirigir(fechaHoraActual, empleado);
        }
    }

    public Integer getNumero() {
        return numero;
    }

    public LocalDateTime getFecha() {
        return fecha;
    }

    public Long getId() {
        return id;
    }
}
