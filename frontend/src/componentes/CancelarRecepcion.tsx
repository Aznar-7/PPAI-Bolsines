import { X } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { api } from '../api'
import { borrarMarcas } from '../situaciones'
import { Dialogo } from './Dialogo'

/** Observacion 1 del CU: la encargada puede cancelar cuando quiera. Pregunta antes, y no registra nada. */
export function CancelarRecepcion({ idBolsin, className = '' }: { idBolsin: number; className?: string }) {
  const [abierto, setAbierto] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const navegar = useNavigate()

  async function cancelar() {
    setOcupado(true)
    await api.cancelar().catch(() => undefined) // si el gestor ya no tenia nada seleccionado, igual se sale
    borrarMarcas(idBolsin)
    navegar('/recepcion', { replace: true, viewTransition: true })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-rechazo transition-colors hover:bg-rechazo-claro ${className}`}
      >
        <X aria-hidden className="size-4" />
        Cancelar la recepción
      </button>
      <Dialogo
        abierto={abierto}
        titulo="¿Cancelar la recepción de este bolsín?"
        confirmar="Sí, cancelar"
        quedarse="Seguir con la recepción"
        ocupado={ocupado}
        onConfirmar={cancelar}
        onCerrar={() => setAbierto(false)}
      >
        No se registra nada: el bolsín vuelve a la bandeja como pendiente y lo que marcaste se descarta.
      </Dialogo>
    </>
  )
}
