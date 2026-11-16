import { Marca } from './Marca'

/** Mientras llega lo primero del gestor: la forma de la pantalla, sin saltos cuando aparece el contenido. */
export function Cargando() {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15.5rem_minmax(0,1fr)]" aria-busy="true" aria-label="Cargando">
      <div className="hidden border-r border-linea bg-panel p-5 lg:block">
        <Marca className="size-8" />
        <div className="mt-10 space-y-2">
          <div className="h-9 animate-pulse rounded-lg bg-hoja/70" />
          <div className="h-9 animate-pulse rounded-lg bg-hoja/50" />
        </div>
      </div>
      <div className="mesa px-4 pt-8 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[76rem] space-y-6">
          <div className="h-4 w-40 animate-pulse rounded bg-linea" />
          <div className="h-9 w-80 max-w-full animate-pulse rounded-lg bg-linea" />
          <div className="h-64 animate-pulse rounded-[20px] bg-hoja" />
        </div>
      </div>
    </div>
  )
}
