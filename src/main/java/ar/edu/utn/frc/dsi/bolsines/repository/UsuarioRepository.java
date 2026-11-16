package ar.edu.utn.frc.dsi.bolsines.repository;

import ar.edu.utn.frc.dsi.bolsines.entity.Usuario;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/** Duenio: T1/T2 (Vale). Spring genera la implementacion a partir del nombre de cada metodo. */
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    /** select ... from usuario where nombre = ? (para el login). */
    Optional<Usuario> findByNombre(String nombre);
}
