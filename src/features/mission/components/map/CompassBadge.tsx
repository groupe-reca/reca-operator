/**
 * Badge boussole **statique** : la carte ne tourne jamais (`map.rotateTo` n'est
 * jamais appelé), donc "N" pointe toujours vers le haut de l'écran. Une boussole
 * pilotée par l'orientation réelle du téléphone reste hors scope (backlog tache4).
 */
export function CompassBadge() {
  return (
    <div
      className="absolute left-3 top-3 flex size-9 flex-col items-center justify-center gap-0.5 rounded-full border border-border-subtle bg-surface-card/90 shadow-md backdrop-blur-sm"
      aria-hidden="true"
    >
      <div className="h-0 w-0 border-x-4 border-b-[6px] border-x-transparent border-b-reca-red" />
      <span className="text-[10px] font-bold leading-none text-text">N</span>
    </div>
  )
}
