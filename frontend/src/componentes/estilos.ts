/** Vocabulario unico de botones: el primario siempre se ve igual en todas las pantallas. */
export const boton = {
  primario:
    'inline-flex items-center justify-center gap-2 rounded-lg bg-sello px-4 py-2.5 text-[0.9375rem] font-semibold text-sobre-sello shadow-[0_1px_0_rgb(255_255_255/0.15)_inset,0_1px_2px_rgb(31_49_154/0.4)] transition-[background-color,transform] hover:bg-sello-hondo active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60',
  secundario:
    'inline-flex items-center justify-center gap-2 rounded-lg border border-linea-fuerte bg-hoja px-4 py-2.5 text-[0.9375rem] font-semibold text-grafito transition-colors hover:border-sello/50 hover:bg-sello-claro/50 active:translate-y-px',
  fantasma:
    'inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-sello transition-colors hover:bg-sello-claro',
}
