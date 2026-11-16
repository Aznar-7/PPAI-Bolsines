# Detalles de implementación

Sección para el informe de la Entrega 2. Responde a los puntos que pide la consigna: lenguaje, framework, tecnología, base de datos y framework de persistencia.

## Lenguaje de programación

**Java 21.** Es uno de los dos lenguajes a los que la cátedra da soporte.

## Framework de programación

**Spring Boot 3.5**, con estos módulos:

- **Spring Web (MVC):** recibe los pedidos del navegador. La pantalla del caso de uso (`PantallaRecepcionDeBolsines`) es un controlador web.
- **Thymeleaf:** arma las páginas HTML en el servidor a partir de lo que devuelve el gestor.
- **Spring Data JPA:** acceso a la base de datos (ver persistencia).

El proyecto se construye con **Maven** y las pruebas automáticas usan **JUnit 5**.

## Tecnología

**Aplicación web.** Se usa desde el navegador en `http://localhost:8080`. El código respeta la separación del modelo de análisis en paquetes:

| Paquete | Estereotipo | Clases |
|---|---|---|
| `boundary` | `<<boundary>>` | `PantallaRecepcionDeBolsines` |
| `control` | `<<control>>` | `GestorRecepcionDeBolsines` |
| `entity` | `<<entity>>` | `Bolsin`, `Remito`, `DetalleRemito`, `Documentacion`, `Estado`, etc. |
| `entity.estado` | Patrón State | `EstadoDocumentacion` y sus 9 estados concretos |

## Base de datos

**H2**, embebida en modo archivo (`data/bolsines.mv.db`). No hace falta instalar un motor aparte. Los datos se guardan en disco y sobreviven al reinicio de la aplicación. Se pueden consultar las tablas desde la consola web de H2 (`/h2-console`).

Al arrancar con la base vacía se cargan datos de prueba: comisiones médicas, encargados de bolsines y un bolsín preparado para cada flujo del caso de uso.

## Framework de persistencia

**Spring Data JPA con Hibernate** como implementación de JPA (mapeo objeto-relacional).

- Las clases del dominio se mapean a tablas con anotaciones (`@Entity`, `@Id`, `@ManyToOne`, `@OneToMany`). Hibernate genera las tablas y las consultas SQL.
- El acceso a los datos se hace con repositorios (`BolsinRepository`, `EstadoRepository`, etc.). Son interfaces: Spring genera la implementación, incluso de consultas declaradas solo por el nombre del método, como `findByNombre`.
- Las relaciones de composición se guardan en cascada: al guardar un bolsín se guardan sus remitos, sus detalles, la documentación y los historiales de cambios de estado.
- **Persistencia del patrón State:** los estados de la documentación no tienen datos propios, así que se guardan por su nombre en una columna de texto (por ejemplo `EnBolsinEnviado`). Un `AttributeConverter` (`EstadoDocumentacionConverter`) traduce en los dos sentidos: al guardar escribe el nombre de la clase del estado y al leer crea el objeto de estado que corresponde.
- La confirmación de la recepción se ejecuta en una sola transacción: se guardan todos los cambios de estado o ninguno.

## Notificación por correo (CU 29)

El envío del correo a las comisiones de origen está **simulado**, como permite la cátedra. `NotificacionSimulada` arma el aviso (destinatario, asunto y detalle de la documentación) y lo registra en el log de la aplicación en lugar de enviarlo. La pantalla lo muestra como enviado.

El gestor usa la interfaz `InterfazNotificacion` y no la clase concreta, así que para enviar correos reales alcanza con escribir otra implementación de esa interfaz, sin modificar el gestor.
