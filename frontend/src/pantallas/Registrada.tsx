import { ArrowRight, Check, House, LoaderCircle, Mail } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router'
import type { ResultadoRecepcion, Situacion } from '../api'
import { boton } from '../componentes/estilos'
import { EtiquetaPrecinto } from '../componentes/Precinto'
import { plural } from '../formato'
import { SITUACIONES } from '../situaciones'

const fechaHora = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })

/**
 * Recepcion registrada (pasos 11 y 12). informarEjecucionExitosa: lo que quedo registrado y los
 * avisos del CU 29. El mail es SIMULADO (la catedra lo permite): el servicio de la T2 arma cada aviso
 * y la pantalla muestra su envio, que pasa de "Enviando…" a "Enviado".
 */
export function Registrada() {
  const resultado = (useLocation().state as { resultado?: ResultadoRecepcion } | null)?.resultado
  if (!resultado) return <Navigate to="/recepcion" replace />
  return <Detalle resultado={resultado} />
}

function Detalle({ resultado }: { resultado: ResultadoRecepcion }) {
  const { resumen, avisos } = resultado
  const { bolsin } = resumen.bolsin
  const enviados = useEnvioSimulado(avisos.length)
  const quieto = useReducedMotion()
  const cuenta = (s: Situacion) => resumen.documentacion.filter((d) => d.situacion === s).length

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[20px] border border-linea bg-hoja p-6 shadow-hoja sm:p-10">
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <EtiquetaPrecinto numero={bolsin.numeroPrecinto} id={bolsin.id} grande />
            <h1 className="mt-5 text-[2.25rem] leading-[1.05] font-bold tracking-[-0.025em] ancho-titular">Recepción registrada</h1>
            <p className="mt-3 max-w-[52ch] text-[1.0625rem] text-tenue">
              El bolsín N.º {bolsin.numeroBolsin} de {bolsin.cmOrigen} quedó en estado{' '}
              <strong className="font-semibold text-grafito">{resumen.estadoFinalBolsin}</strong>, a nombre de{' '}
              {resultado.responsable}, el {fechaHora.format(new Date(resultado.fechaHora)).replace(/\.$/, '')}.
            </p>
          </div>
          <Sello animar={!quieto} fecha={new Date(resultado.fechaHora)} />
        </div>

        <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-linea bg-linea sm:grid-cols-4">
          {(['RECIBIDA', 'FALTANTE', 'NO_CORRESPONDE', 'REDIRIGIR'] as Situacion[]).map((s) => {
            const { estadoFinal, icono: Icono, color } = SITUACIONES[s]
            return (
              <div key={s} className="bg-hoja px-4 py-3">
                <dt className={`flex items-center gap-1.5 text-xs font-semibold ${color}`}>
                  <Icono aria-hidden className="size-3.5" />
                  {estadoFinal}
                </dt>
                <dd className="mt-1 text-2xl font-bold cifras">{cuenta(s)}</dd>
              </div>
            )
          })}
        </dl>
        <p className="mt-3 text-sm text-tenue">
          {resumen.remitos.map((r) => `Remito ${r.numero}: ${r.estadoFinal.toLowerCase()}`).join('. ')}.
        </p>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section aria-labelledby="titulo-avisos" className="rounded-panel border border-linea bg-hoja p-6">
          <h2 id="titulo-avisos" className="font-bold">
            Avisos a las comisiones de origen
          </h2>
          <p className="text-sm text-tenue">
            Envío simulado: se arma el mail del CU 29 y queda registrado, pero no sale a internet.
          </p>
          <ul className="mt-4 space-y-3">
            {avisos.map((aviso, i) => (
              <Aviso key={aviso.cmDestino} aviso={aviso} enviado={i < enviados} />
            ))}
          </ul>
        </section>

        <div className="space-y-2.5 rounded-panel border border-linea bg-hoja p-5 lg:sticky lg:top-8">
          <p className="font-bold">¿Seguimos?</p>
          <Link to="/recepcion" viewTransition className={`${boton.primario} w-full py-3`}>
            Recibir el siguiente bolsín
            <ArrowRight aria-hidden className="size-4" />
          </Link>
          <Link to="/inicio" viewTransition className={`${boton.secundario} w-full`}>
            <House aria-hidden className="size-4" />
            Volver al inicio
          </Link>
        </div>
      </div>

      <Notificaciones avisos={avisos.slice(0, enviados).map((a) => a.cmDestino)} />
    </div>
  )
}

/** Cada aviso tarda un poco en "salir", uno detras del otro, como un envio real. */
function useEnvioSimulado(cantidad: number) {
  const [enviados, setEnviados] = useState(0)
  useEffect(() => {
    if (enviados >= cantidad) return
    const t = setTimeout(() => setEnviados((n) => n + 1), enviados === 0 ? 1600 : 1100)
    return () => clearTimeout(t)
  }, [enviados, cantidad])
  return enviados
}

function Aviso({ aviso, enviado }: { aviso: ResultadoRecepcion['avisos'][number]; enviado: boolean }) {
  return (
    <li className="rounded-xl border border-linea p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-sello-claro text-sello">
            <Mail className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold">{aviso.cmDestino}</p>
            <p className="truncate text-sm text-tenue">{aviso.email}</p>
          </div>
        </div>
        <span
          aria-live="polite"
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors duration-300 ${
            enviado ? 'bg-llego-claro text-llego' : 'bg-papel text-tenue'
          }`}
        >
          {enviado ? <Check aria-hidden className="size-3.5" /> : <LoaderCircle aria-hidden className="size-3.5 animate-spin" />}
          {enviado ? 'Enviado' : 'Enviando…'}
        </span>
      </div>
      <p className="mt-3 text-sm font-medium">{aviso.asunto}</p>
      <ul className="mt-1.5 space-y-0.5 text-sm text-tenue">
        {aviso.detalle.map((linea) => (
          <li key={linea}>{linea}</li>
        ))}
      </ul>
    </li>
  )
}

/** El sello de goma de la recepcion: el unico golpe fuerte de la app, cuando el trabajo esta hecho. */
function Sello({ animar, fecha }: { animar: boolean; fecha: Date }) {
  return (
    <motion.div
      aria-hidden
      initial={animar ? { scale: 2.4, rotate: -24, opacity: 0, filter: 'blur(6px)' } : false}
      animate={{ scale: 1, rotate: -9, opacity: 1, filter: 'blur(0px)' }}
      transition={{ type: 'spring', stiffness: 420, damping: 22, mass: 1.2, delay: 0.25 }}
      className="mx-auto grid w-56 place-items-center rounded-2xl border-[5px] border-sello px-5 py-4 text-center text-sello [mask-image:radial-gradient(circle_at_30%_40%,black_60%,rgb(0_0_0/0.82)_100%)]"
    >
      <span className="block w-full border-y-2 border-sello py-1 text-[1.75rem] leading-none font-black tracking-[0.12em] uppercase [font-stretch:125%]">
        Recibido
      </span>
      <span className="mt-2 text-xs font-bold">En CM destino</span>
      <span className="text-xs font-semibold cifras">{fecha.toLocaleDateString('es-AR')}</span>
    </motion.div>
  )
}

/** Toasts de "El mail ha sido enviado", uno por aviso, que se van solos. */
function Notificaciones({ avisos }: { avisos: string[] }) {
  const [ocultos, setOcultos] = useState<string[]>([])
  const visibles = avisos.filter((cm) => !ocultos.includes(cm))
  const ultimo = avisos[avisos.length - 1]
  useEffect(() => {
    if (!ultimo) return
    const t = setTimeout(() => setOcultos((o) => [...o, ultimo]), 4200)
    return () => clearTimeout(t)
  }, [ultimo])

  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed right-4 bottom-4 z-50 flex flex-col items-end gap-2">
      <AnimatePresence>
        {visibles.map((cm) => (
          <motion.div
            key={cm}
            layout
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className="pointer-events-auto flex items-center gap-3 rounded-xl border border-linea bg-hoja-alta px-4 py-3 shadow-levantada"
          >
            <span className="grid size-8 place-items-center rounded-full bg-llego-claro text-llego">
              <Check aria-hidden className="size-4" />
            </span>
            <div>
              <p className="text-sm font-semibold">El mail ha sido enviado</p>
              <p className="text-xs text-tenue">A {cm}</p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      <span className="sr-only">{plural(avisos.length, 'aviso enviado', 'avisos enviados')}</span>
    </div>
  )
}
