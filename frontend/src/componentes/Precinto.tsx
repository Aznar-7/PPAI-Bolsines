import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

/** Etiqueta amarilla del precinto, la que la encargada lee en la mesa. Es el dato con el que busca. */
export function EtiquetaPrecinto({
  numero,
  resaltado = '',
  grande = false,
  id,
}: {
  numero: string
  resaltado?: string
  grande?: boolean
  id?: number
}) {
  return (
    <span
      className={`relative inline-flex w-fit items-center gap-2 rounded-etiqueta bg-precinto text-grafito shadow-[inset_0_-2px_0_rgb(0_0_0/0.12)] ${
        grande ? 'py-2 pr-4 pl-3 text-2xl' : 'py-1 pr-2.5 pl-2 text-base'
      }`}
      style={id ? { viewTransitionName: `precinto-${id}` } : undefined}
    >
      <span
        aria-hidden
        className={`rounded-full bg-papel shadow-[inset_0_1px_2px_rgb(0_0_0/0.35)] ${grande ? 'size-3' : 'size-2'}`}
      />
      <span className="ancho-precinto leading-none">{conResaltado(numero, resaltado)}</span>
    </span>
  )
}

function conResaltado(numero: string, buscado: string): ReactNode {
  const desde = buscado ? numero.indexOf(buscado) : -1
  if (desde < 0) return numero
  return (
    <>
      {numero.slice(0, desde)}
      <mark className="rounded-[3px] bg-grafito px-px text-precinto">{numero.slice(desde, desde + buscado.length)}</mark>
      {numero.slice(desde + buscado.length)}
    </>
  )
}

/** El precinto colgando de la boca del bolsin: el unico gesto grande del ingreso. */
export function PrecintoColgante({ numero, className = '' }: { numero: string; className?: string }) {
  const quieto = useReducedMotion()
  return (
    <motion.svg
      viewBox="0 0 220 360"
      role="img"
      aria-label={`Precinto número ${numero}`}
      className={className}
      style={{ transformOrigin: '110px 18px' }}
      initial={quieto ? false : { rotate: -16 }}
      animate={{ rotate: 0 }}
      transition={{ type: 'spring', stiffness: 38, damping: 4.2, mass: 1.1, delay: 0.25 }}
    >
      {/* fleje de plastico que pasa por la boca del bolsin */}
      <path
        d="M110 18 C 70 40, 70 120, 104 150 M110 18 C 150 40, 150 120, 116 150"
        fill="none"
        stroke="#F5C400"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <circle cx="110" cy="18" r="9" fill="#1F319A" stroke="#F5C400" strokeWidth="5" />
      {/* cuerpo del precinto */}
      <rect x="38" y="146" width="144" height="196" rx="16" fill="#F5C400" />
      <rect x="38" y="146" width="144" height="196" rx="16" fill="url(#brillo)" />
      <rect x="92" y="160" width="36" height="14" rx="7" fill="#1F319A" opacity="0.9" />
      {Array.from({ length: 5 }, (_, i) => (
        <rect key={i} x={62 + i * 20} y="296" width="8" height="30" rx="2" fill="#8A6D00" opacity="0.28" />
      ))}
      <text
        x="110"
        y="226"
        textAnchor="middle"
        fontFamily="Encode Sans Variable, sans-serif"
        fontSize="13"
        fontWeight="600"
        fill="#1B2230"
        opacity="0.7"
        letterSpacing="1"
      >
        Precinto
      </text>
      <text
        x="110"
        y="268"
        textAnchor="middle"
        fontFamily="Encode Sans Variable, sans-serif"
        fontSize="30"
        fontWeight="800"
        textLength="118"
        lengthAdjust="spacingAndGlyphs"
        fill="#1B2230"
        style={{ fontStretch: '125%', fontVariantNumeric: 'tabular-nums' }}
      >
        {numero}
      </text>
      <defs>
        <linearGradient id="brillo" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="0.35" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.08" />
        </linearGradient>
      </defs>
    </motion.svg>
  )
}
