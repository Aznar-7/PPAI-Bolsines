import type { BolsinResumen } from '../api'
import { fechaYHora, haceCuanto, peso } from '../formato'
import { EtiquetaPrecinto } from './Precinto'

/**
 * El rotulo de envio del bolsin: lo mismo que esta pegado en la bolsa, para reconocerla en la mesa.
 * La usan la bandeja (vista previa) y el control.
 */
export function FichaBolsin({ bolsin: b, cmDestino, conTransicion }: { bolsin: BolsinResumen; cmDestino: string; conTransicion?: boolean }) {
  return (
    <div className="relative">
      <div className="flex items-start justify-between gap-3 px-5 pt-5">
        <div>
          <p className="text-xs text-tenue">Bolsín</p>
          <p className="text-2xl leading-none font-bold cifras ancho-titular">N.º {b.numeroBolsin}</p>
        </div>
        <EtiquetaPrecinto numero={b.numeroPrecinto} id={conTransicion ? b.id : undefined} />
      </div>

      <Troquel />

      <dl className="space-y-3 px-5">
        <div className="grid grid-cols-[3rem_1fr] items-baseline gap-2">
          <dt className="text-xs text-tenue">De</dt>
          <dd>
            <p className="text-lg leading-tight font-bold">{b.cmOrigen}</p>
            <p className="text-xs text-tenue">
              {haceCuanto(b.fechaEnvio).replace('enviado', 'Enviado')}, {fechaYHora(b.fechaEnvio)}
            </p>
          </dd>
        </div>
        <div className="grid grid-cols-[3rem_1fr] items-baseline gap-2">
          <dt className="text-xs text-tenue">Para</dt>
          <dd className="text-lg leading-tight font-bold">{cmDestino}</dd>
        </div>
      </dl>

      <Troquel />

      <dl className="grid grid-cols-3 px-5 pb-5 text-center">
        <Dato titulo="Remitos" valor={b.cantidadRemitos} />
        <Dato titulo="Documentos" valor={b.cantidadDocumentos} />
        <Dato titulo="Peso" valor={peso(b.peso)} />
      </dl>
    </div>
  )
}

/** Linea troquelada con las muescas de los costados, como un rotulo que se puede cortar. */
function Troquel() {
  return (
    <div aria-hidden className="relative my-4">
      <span className="absolute top-1/2 -left-[9px] size-[18px] -translate-y-1/2 rounded-full border border-linea bg-papel [clip-path:inset(0_0_0_50%)]" />
      <div className="troquel mx-4" />
      <span className="absolute top-1/2 -right-[9px] size-[18px] -translate-y-1/2 rounded-full border border-linea bg-papel [clip-path:inset(0_50%_0_0)]" />
    </div>
  )
}

function Dato({ titulo, valor }: { titulo: string; valor: string | number }) {
  return (
    <div>
      <dt className="text-xs text-tenue">{titulo}</dt>
      <dd className="mt-0.5 text-lg font-bold cifras">{valor}</dd>
    </div>
  )
}
