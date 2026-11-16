# Cambios para que los diagramas coincidan con el código

Comparación del código final (rama `main`) con los diagramas de la versión V1: `PPAI-2-Estructura-V1` (clases), `PPAI-2-Secuencia-V1` (secuencia) y `PPAI-2-ME-V1` (máquina de estados).

La consigna evalúa la "consistencia con el modelado": los nombres de clases, métodos y parámetros tienen que ser los mismos en los diagramas y en el código. Lo más fácil es **ajustar los diagramas al código**, que ya está probado.

En la columna "Código" los tipos se escriben como en Java. En el diagrama se pueden dejar los de UML: `LocalDateTime` → `DateTime`, `List<X>` → `X[]`.

---

## 1. Diagrama de clases

### Patrón State (lo más importante)

| Clase | En el V1 | En el código | Qué cambiar |
|---|---|---|---|
| `Registrado` | `Registrado` | `Registrada` | Renombrar la clase (como en la máquina de estados). |
| `EstadoDocumentacion` | `remitar()`, `rechazar()`, `redirigir()`, etc. **sin parámetros**. Solo `aceptar` tiene parámetros | Las 12 operaciones tienen los mismos parámetros: `(documentacion: Documentacion, fechaHoraActual: DateTime, empleado: Empleado, cambiosEstado: CambioEstadoDocumentacion[]): void` | Poner esos 4 parámetros en las 12 operaciones. |
| `EstadoDocumentacion` | — | `# buscarCEActual(cambiosEstado: CambioEstadoDocumentacion[]): CambioEstadoDocumentacion` y `# crearCambioEstado(fechaHoraActual: DateTime, estado: EstadoDocumentacion, empleado: Empleado): CambioEstadoDocumentacion` | Agregarlos acá como **protegidos** (`#`). En el V1 están solo en `EnBolsinEnviado`, pero los usan todos los estados. |
| `EstadoDocumentacion` | — | `+ getNombre(): String` y `+ desdeNombre(nombre: String): EstadoDocumentacion` (estático) | Agregar. `desdeNombre` es el que reconstruye el estado cuando se lee de la base. |
| `EnBolsinEnviado` | `buscarCEActual`, `crearEstado`, `crearCambioEstado` | No existe `crearEstado()`: cada transición crea el estado nuevo directamente (`new RecibidaYAceptada()`) | Sacar esos tres métodos de `EnBolsinEnviado`, porque `buscarCEActual` y `crearCambioEstado` pasan a la clase abstracta y `crearEstado` no existe. |
| Cada estado concreto | Solo `new()` | Cada uno redefine sus transiciones (ver tabla abajo) | Agregar en cada caja los métodos que redefine. Es lo que muestra el patrón a simple vista. |
| `RecibidaYAceptada`, `DeBaja` | `new()` | No redefinen nada | Dejarlas vacías (son finales: todo les queda prohibido). |

Métodos que redefine cada estado concreto (todos con los 4 parámetros de arriba):

| Estado | Redefine |
|---|---|
| `Registrada` | `remitar` |
| `EnRemito` | `cancelarRemito`, `generarBolsin` |
| `EnBolsinSaliente` | `modificarBolsin`, `eliminarBolsin`, `retirarBolsin` |
| `EnBolsinEnviado` | `aceptar`, `rechazar`, `registrarFaltaDocumentacion`, `redirigir` |
| `ParaRedirigir` | `aceptar`, `rechazar` |
| `RecibidaYRechazada` | `reenviar` |
| `NoRecibida` | `cancelarRemito`, `darDeBaja` |
| `RecibidaYAceptada`, `DeBaja` | nada |

**Clase nueva:** `TransicionInvalidaException`. Es la que lanza `EstadoDocumentacion` cuando un estado no permite una operación. Conviene ponerla, porque explica el "por defecto todo está prohibido".

### `Documentacion` (el contexto del patrón)

| En el V1 | En el código | Qué cambiar |
|---|---|---|
| `new(asunto, fechaPase, numero)` | `new(asunto: String, fechaPase: DateTime, numero: Integer, tipo: TipoDocumentacion)` | Agregar el parámetro `tipo`. |
| `remitar(): void`, `rechazar(): void`, etc. sin parámetros | Las 12 con `(fechaHoraActual: DateTime, empleado: Empleado): void` | Agregar los 2 parámetros. |
| `getTipoDocumetacion()` | `getTipoDocumentacion(): TipoDocumentacion` | Corregir el nombre (le faltaba una "n"). |
| `crearCambioEstadoDocumentacion()`, `actualizarEstadoDocumentacion()` | No existen | Sacarlos: eso ahora lo hace el estado. |
| — | Atributos `- estadoActual: EstadoDocumentacion` y `- cambiosEstado: CambioEstadoDocumentacion[]` | Agregarlos como atributos o mostrarlos como las asociaciones "estado actual" y "cambios de estado". |

### `CambioEstadoDocumentacion`

| En el V1 | En el código |
|---|---|
| `setFechaYHoraFin(...)` | `setFechaHoraFin(fechaHoraActual: DateTime): void` (sin la "Y") |

### `GestorRecepcionDeBolsines`

**Atributos.** Reemplazar los del V1 por estos:

```
- fechaHoraActual: DateTime
- empleadoLogueado: Empleado
- cmUsuario: ComisionMedica
- idBolsinSeleccionado: Long
- estadoRecibidoEnCMDestino: Estado
- estadoRecibidoYAceptado: Estado
- estadoRecibidoYAceptadoParcial: Estado
- opSeleccionada: Map<Long, SituacionRecepcion>
- resumenSeleccionado: ResumenRecepcion
```

Se sacan `documentacionSeleccionada`, `estadoRecibidaYAceptada`, `numeroPrecinto`, `CMOrigen` y `remitosSeleccionados`. El estado de la documentación ya no lo busca el gestor: lo decide el patrón State.

**Métodos:**

```
+ opcionRegistrarRecepcionDeBolsin(): InicioRecepcion
+ tomarSeleccionBolsin(idBolsin: Long): DetalleBolsin
+ tomarSeleccionRecepcionBolsin(marcas: Map<Long, SituacionRecepcion>): ResumenRecepcion
+ tomarConfirmacionRegistro(): ResultadoRecepcion
+ cancelar(): void
- getUsuarioLogueado(): Empleado
- getCM(): ComisionMedica
- getBolsinParaCM(): Bolsin[]
- obtenerFechaHoraActual(): DateTime
- buscarEstados(): void
- actualizarEstados(bolsin: Bolsin): void
- validarMarcas(bolsin: Bolsin, marcas: Map<Long, SituacionRecepcion>): void
- ejecutarCU29(): AvisoNotificacion[]
- finDeCU(): void
```

- `FinDeCU` → `finDeCU`, con minúscula.
- `cancelar()` es nuevo (Observación 1 y A6).
- `solicitarSeleccionBolsin`, `getRemitos`, `solicitarSeleccionRecepcionBolsin` y `solicitarConfirmacionRegistro` no están en el gestor: "solicitar" es responsabilidad de la pantalla, que ya los tiene. Sacarlos del gestor.

### `Bolsin`, `Remito`, `DetalleRemito`, `Estado`

| Clase | Qué cambiar |
|---|---|
| `Bolsin` | Agregar `+ esEnviado(): boolean`. `crearCambioEstadoBolsin()` pasa a `crearCambioEstadoBolsin(fechaHoraActual: DateTime, estado: Estado, empleado: Empleado): void`. Agregar la versión con novedades: `recibirBolsin(fechaHoraActual: DateTime, empleado: Empleado, estadoBolsin: Estado, estadoRemito: Estado, estadoRemitoParcial: Estado, situaciones: Map<Long, SituacionRecepcion>): void`. |
| `Remito` | Agregar `recibir(fechaHoraActual: DateTime, empleado: Empleado, estadoRemito: Estado, estadoRemitoParcial: Estado, situaciones: Map<Long, SituacionRecepcion>): void`. |
| `DetalleRemito` | Agregar `+ recibirDocumentacion(fechaHoraActual: DateTime, empleado: Empleado, situacion: SituacionRecepcion): void`. |
| `Estado` | Agregar `+ esRecibidoYAceptadoParcial(): boolean`. Es un **dato** más de ámbito Remito, no el patrón State. |

En `Bolsin` y `Remito` siguen existiendo las versiones con menos parámetros, como en el V1. Si el diagrama queda más limpio, alcanza con mostrar las nuevas.

### Clases nuevas que conviene agregar

| Clase | Estereotipo | Para qué |
|---|---|---|
| `SituacionRecepcion` | `<<enumeration>>` | `RECIBIDA`, `FALTANTE`, `NO_CORRESPONDE`, `REDIRIGIR`: cómo llegó cada documento. |
| `InterfazNotificacion` | `<<interface>>` | `+ notificarRecepcion(resumen: ResumenRecepcion): AvisoNotificacion[]`. Es la que usa el gestor para el CU 29. |
| `NotificacionSimulada` | implementa `InterfazNotificacion` | Arma el aviso y lo deja en el log (envío simulado). |
| `ServicioSesion` | `<<control>>` | `+ iniciarSesion(usuario, contrasena): boolean`, `+ getEmpleadoLogueado(): Empleado`. El gestor obtiene el empleado logueado a través de este servicio. |

Los objetos que van del gestor a la pantalla (`InicioRecepcion`, `DetalleBolsin`, `ResumenRecepcion`, `ResultadoRecepcion`) se pueden dejar afuera del diagrama, o agregar como `<<DTO>>` sin detalle.

### `PantallaRecepcionDeBolsines`

En el código la pantalla quedó en dos partes:

- El **controlador** (`boundary/PantallaRecepcionDeBolsines.java`) tiene `opcionRegistrarRecepcionDelBolsin`, `tomarSeleccionBolsin`, `tomarSeleccionRecepcionBolsin`, `tomarConfirmacionRegistro` y `cancelar`.
- Las **pantallas de React** (`frontend/src/pantallas/`) hacen los `mostrar...`, `solicitar...`, `habilitarPantalla` e `informarEjecucionExitosa`.

En el diagrama se puede dejar la clase como está, agregándole `+ cancelar()` y una nota: "implementada como controlador REST + pantallas React".

---

## 2. Diagrama de secuencia (la parte rediseñada por el patrón)

Desde `tomarConfirmacionRegistro()`, en este orden:

1. `obtenerFechaHoraActual(): DateTime`
2. `buscarEstados(): void`. En el loop de estados de **Remito**, agregar `esRecibidoYAceptadoParcial(): boolean` después de `esRecibidoYAceptado()`.
3. `actualizarEstados(bolsin): void` → `bolsin.recibirBolsin(fechaHoraActual, empleado, estadoBolsin, estadoRemito, estadoRemitoParcial, situaciones)`.
4. En `Bolsin`: `setFechaHoraFin(...)` sobre el cambio de estado actual, `crearCambioEstadoBolsin(...)`, y por cada remito `recibir(fechaHoraActual, empleado, estadoRemito, estadoRemitoParcial, situaciones)`.
5. En `Remito`: por cada detalle, `recibirDocumentacion(fechaHoraActual, empleado, situacion)`. Al final, `setEstado(estadoRemito o estadoRemitoParcial)`.
6. En `DetalleRemito` (flujo principal, situación RECIBIDA): `aceptarDocumentacion(fechaHoraActual, empleado)` → `documentacion.aceptar(fechaHoraActual, empleado)`.
7. **Patrón State.** En `Documentacion`: `estadoActual.aceptar(documentacion, fechaHoraActual, empleado, cambiosEstado)`. El objeto receptor es `:EnBolsinEnviado`.
8. En `:EnBolsinEnviado`:
   - `buscarCEActual(cambiosEstado): CambioEstadoDocumentacion` (mensaje a sí mismo, heredado), con el loop `*esActual(): boolean`.
   - `setFechaHoraFin(fechaHoraActual): void` sobre el cambio de estado actual.
   - `new(): RecibidaYAceptada`. **Sacar el `crearEstado()` del V1**: el estado nuevo se crea directamente.
   - `crearCambioEstado(fechaHoraActual, nuevoEstado, empleado): CambioEstadoDocumentacion` → `new(fechaHoraInicio, estado, responsable): CambioEstadoDocumentacion`.
   - `documentacion.setEstado(nuevoEstado): void`.
   - `documentacion.agregarCambioEstado(nuevoCambio): void`.
9. `ejecutarCU29()` → `notificacion.notificarRecepcion(resumen): AvisoNotificacion[]`, a través de `InterfazNotificacion`.
10. `finDeCU(): void`.

**Opcional, pero ayuda en la defensa:** un fragmento `alt` en el paso 6 con las cuatro ramas según `situacion`: `aceptar`, `registrarFaltaDocumentacion` (A3), `rechazar` (A4) y `redirigir` (A5). Muestra que el gestor no pregunta el estado y que cada operación lleva a otro estado.

---

## 3. Máquina de estados

**No cambia.** El código tiene exactamente esos 9 estados y esas transiciones. Lo único es que el nombre del estado inicial (`Registrada`) coincida con el de la clase en el diagrama de clases.
