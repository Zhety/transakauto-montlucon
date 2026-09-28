import { headers } from 'next/headers'
import { boardBase } from './board-path'

/** Base du tableau pour la requête en cours — composants serveur uniquement. */
export async function currentBoardBase(): Promise<string> {
  return boardBase((await headers()).get('host'))
}
