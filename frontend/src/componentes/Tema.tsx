import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'

type Preferencia = 'claro' | 'oscuro' | 'sistema'

const CLAVE = 'bolsines-tema'
const EVENTO = 'bolsines-tema'
const oscuroDelSistema = () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false

function leer(): Preferencia {
  try {
    const guardada = localStorage.getItem(CLAVE)
    return guardada === 'claro' || guardada === 'oscuro' ? guardada : 'sistema'
  } catch {
    return 'sistema'
  }
}

/** Pone data-tema en <html>. index.html hace lo mismo antes del primer pintado para que no parpadee. */
function aplicar(preferencia: Preferencia) {
  const tema = preferencia === 'sistema' ? (oscuroDelSistema() ? 'oscuro' : 'claro') : preferencia
  document.documentElement.dataset.tema = tema
}

function useTema() {
  const [preferencia, setPreferencia] = useState<Preferencia>(leer)

  // Hay mas de un selector en pantalla (barra lateral y barra de celular): se mantienen de acuerdo.
  useEffect(() => {
    const alCambiar = (e: Event) => setPreferencia((e as CustomEvent<Preferencia>).detail)
    window.addEventListener(EVENTO, alCambiar)
    return () => window.removeEventListener(EVENTO, alCambiar)
  }, [])

  useEffect(() => {
    aplicar(preferencia)
    try {
      if (preferencia === 'sistema') localStorage.removeItem(CLAVE)
      else localStorage.setItem(CLAVE, preferencia)
    } catch {
      /* sin almacenamiento: el tema dura lo que la pestana */
    }
    if (preferencia !== 'sistema' || !window.matchMedia) return
    const consulta = window.matchMedia('(prefers-color-scheme: dark)')
    const alCambiar = () => aplicar('sistema')
    consulta.addEventListener('change', alCambiar)
    return () => consulta.removeEventListener('change', alCambiar)
  }, [preferencia])

  const elegir = (p: Preferencia) => window.dispatchEvent(new CustomEvent(EVENTO, { detail: p }))
  return [preferencia, elegir] as const
}

const OPCIONES: { valor: Preferencia; texto: string; icono: LucideIcon }[] = [
  { valor: 'claro', texto: 'Claro', icono: Sun },
  { valor: 'oscuro', texto: 'Oscuro', icono: Moon },
  { valor: 'sistema', texto: 'Automático', icono: Monitor },
]

/** Selector de tema: tres opciones visibles, la elegida se marca con una pastilla que se desliza. */
export function SelectorTema({ compacto = false }: { compacto?: boolean }) {
  const [preferencia, setPreferencia] = useTema()

  if (compacto) {
    const i = OPCIONES.findIndex((o) => o.valor === preferencia)
    const siguiente = OPCIONES[(i + 1) % OPCIONES.length]
    const Actual = OPCIONES[i].icono
    return (
      <button
        type="button"
        onClick={() => setPreferencia(siguiente.valor)}
        aria-label={`Tema: ${OPCIONES[i].texto}. Cambiar a ${siguiente.texto}`}
        className="grid size-9 place-items-center rounded-lg text-tenue transition-colors hover:bg-hoja hover:text-grafito"
      >
        <Actual aria-hidden className="size-[1.125rem]" />
      </button>
    )
  }

  return (
    <div role="radiogroup" aria-label="Tema de la pantalla" className="grid grid-cols-3 rounded-lg bg-papel p-0.5">
      {OPCIONES.map(({ valor, texto, icono: Icono }) => {
        const activo = preferencia === valor
        return (
          <button
            key={valor}
            type="button"
            role="radio"
            aria-checked={activo}
            title={texto}
            onClick={() => setPreferencia(valor)}
            className={`relative grid h-8 place-items-center rounded-md transition-colors ${activo ? 'text-grafito' : 'text-tenue hover:text-grafito'}`}
          >
            {activo && (
              <motion.span
                layoutId="tema-activo"
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                className="absolute inset-0 rounded-md bg-hoja-alta shadow-[0_1px_2px_rgb(0_0_0/0.12)]"
              />
            )}
            <Icono aria-hidden className="relative size-4" />
            <span className="sr-only">{texto}</span>
          </button>
        )
      })}
    </div>
  )
}
