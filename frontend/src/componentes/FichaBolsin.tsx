import type { BolsinResumen } from '../api'
import { fechaYHora, peso } from '../formato'
import { EtiquetaPrecinto } from './Precinto'

/** Todo lo que hace falta para reconocer el bolsin que esta en la mesa. La usan la bandeja y el control. */
export function FichaBolsin({ bolsin: b, cmDestino, conTransicion }: { bolsin: BolsinResumen; cmDestino: string; conTransicion?: boolean }) {
  return (
    <div>
      <p className="text-sm text-tenue">Bolsín N.º {b.numeroBolsin}</p>
      <div className="mt-2">
        <EtiquetaPrecinto numero={b.numeroPrecinto} grande id={conTransicion ? b.id : undefined} />
      </div>

      <ol className="mt-6 text-sm">
        <Tramo punto="border-2 border-tenue bg-hoja" titulo="Sale de" valor={b.cmOrigen} detalle={fechaYHora(b.fechaEnvio)} linea />
        <Tramo punto="bg-sello" titulo="Llega a" valor={cmDestino} detalle="Tu comisión" />
      </ol>

      <dl className="mt-6 grid grid-cols-3 divide-x divide-linea rounded-lg border border-linea text-center">
        <Dato titulo="Remitos" valor={b.cantidadRemitos} />
        <Dato titulo="Documentos" valor={b.cantidadDocumentos} />
        <Dato titulo="Peso" valor={peso(b.peso)} />
      </dl>
    </div>
  )
}

function Tramo({ punto, titulo, valor, detalle, linea }: { punto: string; titulo: string; valor: string; detalle: string; linea?: boolean }) {
  return (
    <li className="relative grid grid-cols-[1.25rem_1fr] gap-x-3 pb-4 last:pb-0">
      {linea && <span aria-hidden className="absolute top-4 bottom-0 left-[0.5625rem] w-0.5 bg-linea" />}
      <span aria-hidden className={`relative mt-1 size-3 justify-self-center rounded-full ${punto}`} />
      <div>
        <p className="text-xs text-tenue">{titulo}</p>
        <p className="font-semibold">{valor}</p>
        <p className="text-xs text-tenue">{detalle}</p>
      </div>
    </li>
  )
}

function Dato({ titulo, valor }: { titulo: string; valor: string | number }) {
  return (
    <div className="px-2 py-3">
      <dt className="text-xs text-tenue">{titulo}</dt>
      <dd className="mt-0.5 font-bold cifras">{valor}</dd>
    </div>
  )
}
