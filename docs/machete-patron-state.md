# Machete: el patrón State en el código

Para ensayar antes de la defensa. **Cualquiera de los cuatro tiene que poder explicarlo con el código abierto**, porque la nota es individual.

## El problema, en una frase

Una documentación pasa por 9 estados y lo que se puede hacer con ella depende del estado en que está. Sin el patrón, cada operación (aceptar, rechazar, redirigir…) tendría su cadena de `if (estado es X) … else if (estado es Y) … else error`, repetida en todos lados. Con State, la documentación **no pregunta en qué estado está**: le pide la operación a su estado actual, y cada estado es una clase que sabe qué hacer.

## Las piezas

| Rol en el patrón | Clase | Dónde está |
|---|---|---|
| **Contexto** | `Documentacion` | `entity/Documentacion.java` |
| **Estado** (abstracto) | `EstadoDocumentacion` | `entity/estado/EstadoDocumentacion.java` |
| **Estados concretos** | `Registrada`, `EnRemito`, `EnBolsinSaliente`, `EnBolsinEnviado`, `ParaRedirigir`, `RecibidaYAceptada`, `RecibidaYRechazada`, `NoRecibida`, `DeBaja` | `entity/estado/` |

## El recorrido para mostrar (2 minutos)

Abrir los archivos en este orden (rutas desde `src/main/java/ar/edu/utn/frc/dsi/bolsines/`):

1. **`entity/Documentacion.java`, línea 92: `aceptar`.**
   > "La documentación no decide nada. Una sola línea: le pasa la operación a su estado actual."
   ```java
   estadoActual.aceptar(this, fechaHoraActual, empleado, cambiosEstado);
   ```
   No hay ningún `if`. Las 12 operaciones son iguales.

2. **`entity/estado/EstadoDocumentacion.java`, línea 52.**
   > "La clase abstracta declara todas las operaciones, y **por defecto todas están prohibidas**: lanzan `TransicionInvalidaException`."

   Cada estado concreto redefine solo las que puede hacer. Lo que no redefine queda prohibido solo.

3. **`entity/estado/EnBolsinEnviado.java`, línea 16: `aceptar`.**
   > "Este es el estado del caso de uso. Permite cuatro operaciones: aceptar, rechazar, registrar falta y redirigir."

   Una transición son siempre los mismos pasos:
   1. Busca el cambio de estado vigente (`buscarCEActual`).
   2. Lo cierra con la fecha y hora.
   3. **Crea el estado nuevo: `new RecibidaYAceptada()`.** Esta línea ES la transición. Quien decide a qué estado se pasa es el estado, no la documentación ni el gestor.
   4. Crea el nuevo `CambioEstadoDocumentacion` con el empleado responsable. De ahí sale la trazabilidad que pide la regla de negocio.
   5. Le avisa a la documentación su nuevo estado (`setEstado`) y le agrega el cambio al historial.

4. **`entity/estado/RecibidaYAceptada.java`, línea 7.**
   > "Es un estado final: no redefine nada. Por eso, desde acá cualquier operación está prohibida."

5. **En la app**, recibir un bolsín y después **en H2** (`http://localhost:8080/h2-console`):
   ```sql
   SELECT asunto, estado_actual FROM documentacion;
   ```
   > "El estado se guarda por el nombre de su clase. Al leerlo, `EstadoDocumentacionConverter` crea el objeto de estado que corresponde."

## Preguntas que pueden hacer

**¿Dónde está el patrón?**
En `entity/estado/`: la clase abstracta y los 9 estados. `Documentacion` es el contexto.

**¿Qué problema resuelve?**
Sin el patrón habría `if`/`switch` por estado en cada operación, repetidos en todos lados. Con el patrón, cada regla está en un solo lugar: en la clase de ese estado.

**¿Quién decide el próximo estado?**
El estado actual. Por ejemplo, en `EnBolsinEnviado.aceptar` se hace `new RecibidaYAceptada()`.

**¿Qué pasa si se agrega un estado nuevo?**
Se crea una clase nueva que extiende `EstadoDocumentacion` y redefine sus transiciones, y se agrega en el mapa de `desdeNombre`. No se toca `Documentacion` ni los otros estados (principio abierto/cerrado).

**¿Y si se pide una operación que el estado no permite?**
La clase abstracta lanza `TransicionInvalidaException`. Por ejemplo, aceptar una documentación que está `Registrada`. El gestor la convierte en un mensaje para la pantalla y la transacción se deshace, así que no queda nada guardado a medias.

**En `DetalleRemito` hay un `switch`. ¿Eso no rompe el patrón?**
No. Ese `switch` (`entity/DetalleRemito.java`, línea 50) es sobre **lo que eligió el usuario** (llegó, falta, no corresponde, redirigir), no sobre el estado de la documentación. El detalle decide qué operación pedir; si se puede y a qué estado pasa lo decide el estado actual. La misma marca "aceptar" lleva a lugares distintos según el estado en que esté la documentación.

**¿Por qué Bolsín y Remito no usan State?**
La consigna asignó a los grupos pares la máquina de estados de Documentación. Bolsín y Remito siguen con la clase `Estado` del análisis, que tiene un nombre y un ámbito.

**¿Cómo se guarda el estado en la base?**
Los estados no tienen datos propios, así que se guarda el nombre de la clase en la columna `estado_actual`. `EstadoDocumentacionConverter` traduce en los dos sentidos.

**¿Qué patrones GRASP se ven?**
- **Controlador:** `GestorRecepcionDeBolsines` coordina el caso de uso.
- **Experto:** cada entidad actualiza lo suyo. `Bolsin` → `Remito` → `DetalleRemito` → `Documentacion` → su estado.
- **Polimorfismo:** es el corazón de State. La misma llamada `estadoActual.aceptar(...)` hace cosas distintas según la clase del estado.

**¿Por qué el mail está simulado?**
La cátedra lo permite. Está detrás de `InterfazNotificacion`: para mandar mails reales se escribe otra implementación y el gestor no cambia.

## Ejercicio para cada uno

Con el código abierto y sin leer este machete:

1. Explicar los 5 pasos de `EnBolsinEnviado.aceptar`.
2. Decir qué pasa si se llama a `aceptar` sobre una documentación `RecibidaYAceptada`, y mostrar en el código por qué pasa.
3. Contestar "¿qué hay que tocar para agregar un estado nuevo?".
