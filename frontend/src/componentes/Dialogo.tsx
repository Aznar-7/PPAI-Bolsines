import { TriangleAlert } from 'lucide-react'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { boton } from './estilos'

/**
 * Dialogo de "¿seguro?" sobre <dialog> nativo: atrapa el foco, Esc lo cierra y el fondo queda inerte.
 * Se usa solo para lo que no tiene vuelta atras.
 */
export function Dialogo({
  abierto,
  titulo,
  children,
  confirmar,
  quedarse,
  onConfirmar,
  onCerrar,
  ocupado = false,
}: {
  abierto: boolean
  titulo: string
  children: ReactNode
  confirmar: string
  quedarse: string
  onConfirmar: () => void
  onCerrar: () => void
  ocupado?: boolean
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const idTitulo = useId()

  useEffect(() => {
    const dialogo = ref.current
    if (!dialogo) return
    // Sin showModal (navegadores viejos, jsdom) se abre igual, como dialogo comun.
    if (abierto && !dialogo.open) {
      if (dialogo.showModal) dialogo.showModal()
      else dialogo.setAttribute('open', '')
    }
    if (!abierto && dialogo.open) {
      if (dialogo.close) dialogo.close()
      else dialogo.removeAttribute('open')
    }
  }, [abierto])

  return (
    <dialog
      ref={ref}
      aria-labelledby={idTitulo}
      onClose={onCerrar}
      onClick={(e) => e.target === ref.current && onCerrar()}
      className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-[18px] border border-linea bg-hoja p-0 text-grafito shadow-levantada backdrop:bg-[rgb(12_17_32/0.45)] backdrop:backdrop-blur-[2px] open:animate-[aparecer_180ms_cubic-bezier(0.22,1,0.36,1)]"
    >
      {abierto && (
        <div className="p-6">
          <div className="flex items-start gap-4">
            <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-rechazo-claro text-rechazo">
              <TriangleAlert className="size-5" />
            </span>
            <div>
              <h2 id={idTitulo} className="text-lg font-bold">
                {titulo}
              </h2>
              <div className="mt-1.5 text-tenue">{children}</div>
            </div>
          </div>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" autoFocus onClick={onCerrar} className={boton.secundario}>
              {quedarse}
            </button>
            <button
              type="button"
              onClick={onConfirmar}
              disabled={ocupado}
              className="inline-flex items-center justify-center rounded-lg bg-rechazo px-4 py-2.5 text-[0.9375rem] font-semibold text-sobre-sello transition-[filter] hover:brightness-110 disabled:opacity-60"
            >
              {confirmar}
            </button>
          </div>
        </div>
      )}
    </dialog>
  )
}
