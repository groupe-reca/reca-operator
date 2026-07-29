type CompassBadgeProps = {
  /** Cap (degrés) actuellement appliqué à la caméra, `null` tant qu'inconnu. */
  headingDeg: number | null
}

/**
 * Badge boussole : la carte tourne désormais avec le cap du déplacement
 * (caméra « conduite »), donc l'aiguille tourne à l'**inverse** du cap pour
 * continuer à pointer le vrai nord. Cap inconnu (`null`) → aiguille au repos
 * (pointe vers le haut de l'écran, comportement précédent).
 */
export function CompassBadge({ headingDeg }: CompassBadgeProps) {
  const rotation = headingDeg === null ? 0 : -headingDeg

  return (
    <div
      className="absolute left-3 top-[calc(env(safe-area-inset-top)+108px)] z-30 flex size-9 flex-col items-center justify-center gap-0.5 rounded-full border border-white/10 bg-surface-card/70 shadow-md backdrop-blur-md"
      aria-hidden="true"
    >
      <div
        className="flex flex-col items-center gap-0.5 transition-transform duration-500 ease-out"
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        <div className="h-0 w-0 border-x-4 border-b-[6px] border-x-transparent border-b-reca-red" />
        <span className="text-[10px] font-bold leading-none text-text">N</span>
      </div>
    </div>
  )
}
