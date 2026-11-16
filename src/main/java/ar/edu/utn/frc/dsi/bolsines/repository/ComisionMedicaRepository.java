package ar.edu.utn.frc.dsi.bolsines.repository;

import ar.edu.utn.frc.dsi.bolsines.entity.ComisionMedica;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/** Duenio: T1/T2 (Vale). Spring genera la implementacion a partir del nombre de cada metodo. */
public interface ComisionMedicaRepository extends JpaRepository<ComisionMedica, Long> {

    /** select ... from comision_medica where name = ? (para saber a que email avisar en el CU 29). */
    Optional<ComisionMedica> findByName(String name);
}
