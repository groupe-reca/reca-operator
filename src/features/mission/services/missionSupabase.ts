import { supabase } from '@/lib/supabaseClient'
import type { Mission } from '../domain/types'
import { mapItemToStop } from './missionMapping'
import type { MissionItemJoinRow } from './missionMapping'

/**
 * Source de données officielle : la Mission assignée à l'opérateur connecté et ses
 * MissionItems, lus depuis Supabase (même base que RECA App). Remplace le CSV de
 * démonstration. RECA Operator ne connaît que `Mission` + `MissionItems` : les
 * détails (adresse, GPS, message opérateur, client) sont récupérés par jointure sur
 * le **contrat** ; on ne touche jamais aux modules Contrats / Clients / Routes.
 *
 * Chaîne de résolution de l'opérateur :
 *   `auth.uid()` == `users.id` == `employees.user_id` → `employees.id` → `missions.operator_id`.
 */

const SELECT_WITH_CONTRACT = `
  id,
  statut,
  contract:contracts(adresse_geocodee, latitude, longitude, message_operateur, client:clients(prenom, nom, entreprise))
`

/**
 * Charge la Mission assignée à l'opérateur connecté, ou `null` si l'utilisateur
 * n'est rattaché à aucun employé ou n'a aucune mission active (→ écran « Aucune
 * mission assignée »).
 */
export async function loadAssignedMission(): Promise<Mission | null> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) return null

  // 1. Employé rattaché à cet utilisateur.
  const { data: employee, error: employeeError } = await supabase
    .from('employees')
    .select('id')
    .eq('user_id', userData.user.id)
    .is('deleted_at', null)
    .maybeSingle<{ id: string }>()
  if (employeeError) throw employeeError
  if (!employee) return null

  // 2. Mission active assignée à cet employé.
  const { data: mission, error: missionError } = await supabase
    .from('missions')
    .select('id, numero')
    .eq('operator_id', employee.id)
    .is('deleted_at', null)
    .in('statut', ['planifiee', 'en_cours'])
    .order('date', { ascending: true })
    .order('heure_prevue', { ascending: true })
    .limit(1)
    .maybeSingle<{ id: string; numero: number }>()
  if (missionError) throw missionError
  if (!mission) return null

  // 3. MissionItems de cette mission (contrat joint).
  const { data: items, error: itemsError } = await supabase
    .from('mission_items')
    .select(SELECT_WITH_CONTRACT)
    .eq('mission_id', mission.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })
  if (itemsError) throw itemsError

  const stops = ((items ?? []) as unknown as MissionItemJoinRow[])
    .map(mapItemToStop)
    .filter((stop) => Number.isFinite(stop.lat) && Number.isFinite(stop.lng))

  return {
    nom: `Mission #${mission.numero}`,
    secteur: '',
    stops,
  }
}
