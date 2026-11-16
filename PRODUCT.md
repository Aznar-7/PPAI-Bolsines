# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Encargada de Bolsines (EB) de una Comisión Médica (CM). Administrativa sin perfil técnico, trabaja en la mesa de entradas con PC de escritorio (monitor, teclado y mouse). Recibe unos 30 bolsines por día que llegan precintados desde otras CM y tiene que registrar qué vino en cada uno.

## Product Purpose

CU 28 "Registrar recepción de bolsín" del sistema Bolsines (DSI 2026, UTN FRC, Grupo 4). La EB encuentra el bolsín por su número de precinto, controla documento por documento lo que llegó y confirma; el sistema actualiza estados (patrón State) y avisa por mail (simulado) a la CM de origen. Éxito: registrar un bolsín sin dudar en ningún paso y sin errores de marcado.

## Operating Context

- Objetos reales: bolsín (bolsa precintada), precinto numerado amarillo, remitos con su documentación (expedientes, dictámenes, estudios médicos).
- Situaciones de cada documento: Llegó, Falta (A3), No corresponde (A4), Redirigir (A5, solo Comisión Médica Central).
- Dolores del journey: encontrar su bolsín rápido por precinto; "¿qué opción elijo?"; "¿y si me equivoqué?"; "¿le llegó el mail a Córdoba?".
- Se defiende ante docentes: la pantalla no decide nada, todo pasa por el gestor.

## Capabilities and Constraints

- Stack: React + Vite + TypeScript + Tailwind v4 + Motion en `frontend/`, servido por Spring Boot; la API es `PantallaRecepcionDeBolsines` (boundary).
- Alcance de navegación: solo el CU 28 (inicio, recepción, salir). Nada que no funcione: sin Historial ni Avisos.
- Fuera de alcance: escaneo con cámara, modo mesa móvil, historial, adjuntos, PDF.
- Mientras no esté la T2, ingreso de prueba con usuario fijo.

## Brand Commitments

Nombre: Bolsines. Español rioplatense (voseo), tono administrativo claro y cálido. Sin UX del grupo como referencia: diseño propio.

## Product Principles

1. Claridad ante todo: en cada pantalla se sabe dónde estás, qué falta y qué pasa al tocar cada botón.
2. El precinto es la llave: el número del precinto es el dato que la EB tiene en la mano, siempre visible y buscable.
3. Nada irreversible sin ver antes el resultado.
4. La pantalla muestra, el gestor decide.

## Accessibility & Inclusion

WCAG 2.2 AA: foco visible, todo operable con teclado, contraste AA, respeto por reduced motion.
