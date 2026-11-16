import { motion, useReducedMotion } from 'motion/react'
import { useId, useState, type FormEvent, type ReactNode } from 'react'
import { useLoaderData, useNavigate, useSearchParams } from 'react-router'
import { api, ErrorApi, type EstadoSesion } from '../api'
import { Marca } from '../componentes/Marca'
import { boton } from '../componentes/estilos'
import { PrecintoColgante } from '../componentes/Precinto'
import { SelectorTema } from '../componentes/Tema'

export function Ingreso() {
  const { modoDePrueba } = useLoaderData() as EstadoSesion
  const navegar = useNavigate()
  const [parametros] = useSearchParams()
  const [usuario, setUsuario] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [verContrasena, setVerContrasena] = useState(false)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [intento, setIntento] = useState(0)
  const quieto = useReducedMotion()
  const idError = useId()

  async function ingresar(evento: FormEvent) {
    evento.preventDefault()
    if (!usuario.trim() || !contrasena) {
      setError('Completá el usuario y la contraseña.')
      setIntento((n) => n + 1)
      return
    }
    setEnviando(true)
    setError('')
    try {
      await api.ingresar(usuario.trim(), contrasena)
      const volver = parametros.get('volver')
      navegar(volver?.startsWith('/') && !volver.startsWith('//') ? volver : '/inicio', {
        replace: true,
        viewTransition: true,
      })
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : 'No se pudo ingresar.')
      setIntento((n) => n + 1)
      setContrasena('')
      setEnviando(false)
    }
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-[#1f319a] text-white lg:flex lg:flex-col oscuro:bg-[#111a46]">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-28 bg-[repeating-linear-gradient(90deg,rgb(255_255_255/0.07)_0_2px,transparent_2px_10px)]"
        />
        <div className="relative z-10 flex items-center gap-3 p-10">
          <Marca className="size-9" />
          <span className="text-lg font-bold">Bolsines</span>
        </div>
        <div className="relative flex flex-1 flex-col items-center">
          <BocaDelBolsin />
          <PrecintoColgante
            numero="004512"
            className="-mt-3 h-[min(50vh,420px)] w-auto drop-shadow-[0_30px_40px_rgb(0_0_0/0.35)]"
          />
        </div>
        <p className="relative z-10 max-w-md p-10 text-lg leading-relaxed text-white/80">
          Recepción de bolsines entre comisiones médicas. Buscás por el número de precinto, controlás lo que vino y
          queda registrado.
        </p>
      </aside>

      <main className="relative flex items-center justify-center px-4 py-16 sm:px-8">
        <div className="absolute top-4 right-4">
          <SelectorTema compacto />
        </div>
        <div className="w-full max-w-sm">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <Marca className="size-9" />
            <span className="text-lg font-bold">Bolsines</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Ingresá al sistema</h1>
          <p className="mt-2 text-tenue">Con el usuario de tu comisión médica.</p>

          <motion.form
            noValidate
            onSubmit={ingresar}
            className="mt-8 space-y-5"
            key={intento}
            animate={error && !quieto ? { x: [0, -8, 7, -5, 3, 0] } : undefined}
            transition={{ duration: 0.4 }}
            aria-describedby={error ? idError : undefined}
          >
            <Campo etiqueta="Usuario" htmlFor="usuario">
              <input
                id="usuario"
                autoFocus
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                aria-invalid={!!error}
                className={claseCampo}
              />
            </Campo>
            <Campo etiqueta="Contraseña" htmlFor="contrasena">
              <div className="relative">
                <input
                  id="contrasena"
                  type={verContrasena ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  aria-invalid={!!error}
                  className={`${claseCampo} pr-20`}
                />
                <button
                  type="button"
                  onClick={() => setVerContrasena((v) => !v)}
                  aria-pressed={verContrasena}
                  className="absolute inset-y-1.5 right-1.5 rounded-md px-2.5 text-sm font-medium text-sello hover:bg-sello-claro"
                >
                  {verContrasena ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </Campo>

            <p id={idError} role="alert" className="min-h-6 text-sm font-medium text-rechazo">
              {error}
            </p>

            <button
              type="submit"
              disabled={enviando}
              className={`${boton.primario} w-full py-3.5 text-base disabled:cursor-wait`}
            >
              {enviando ? 'Ingresando…' : 'Ingresar'}
            </button>
          </motion.form>

          {modoDePrueba && (
            <div className="mt-10 rounded-xl border border-dashed border-precinto-hondo/40 bg-precinto-claro p-4 text-sm">
              <p className="font-semibold">Datos de prueba</p>
              <p className="mt-1 text-tenue">
                Están cargados los usuarios de la demo. Para la Comisión Médica Central entrá con{' '}
                <strong className="text-grafito">sromero</strong> y la contraseña <strong className="text-grafito">1234</strong>.
              </p>
              <button
                type="button"
                onClick={() => {
                  setUsuario('sromero')
                  setContrasena('1234')
                  setError('')
                }}
                className="mt-3 font-semibold text-sello underline decoration-2 underline-offset-4"
              >
                Completar los datos de prueba
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

const claseCampo =
  'block w-full rounded-xl border border-linea-fuerte bg-hoja px-4 py-3 text-base outline-none transition-[border-color,box-shadow] focus:border-sello focus:shadow-[0_0_0_4px_rgb(46_70_200/0.15)] aria-[invalid=true]:border-rechazo'

function Campo({ etiqueta, htmlFor, children }: { etiqueta: string; htmlFor: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold">
        {etiqueta}
      </label>
      {children}
    </div>
  )
}

/** La boca del bolsin de lona, cerrada con el fleje del precinto. */
function BocaDelBolsin() {
  return (
    <svg viewBox="0 0 360 120" aria-hidden className="w-[min(70%,360px)]">
      <path d="M20 0 H340 L318 92 Q180 118 42 92 Z" fill="#2c41b8" />
      <path d="M20 0 H340 L318 92 Q180 118 42 92 Z" fill="url(#lona)" opacity="0.5" />
      <path d="M44 78 Q180 102 316 78" fill="none" stroke="#c9d2ff" strokeOpacity="0.45" strokeWidth="2" strokeDasharray="7 6" />
      <path d="M150 96 Q180 112 210 96" fill="none" stroke="#F5C400" strokeWidth="9" strokeLinecap="round" />
      <defs>
        <pattern id="lona" width="6" height="6" patternUnits="userSpaceOnUse">
          <path d="M0 6 L6 0" stroke="#000" strokeOpacity="0.18" strokeWidth="1" />
        </pattern>
      </defs>
    </svg>
  )
}
