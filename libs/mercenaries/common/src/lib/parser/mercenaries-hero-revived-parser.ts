import { GameEvent } from '@firestone/game-state';
import { MercenariesBattleState } from '../services/mercenaries-battle-state';
import { MercenariesParser } from './_mercenaries-parser';

export class MercenariesHeroRevivedParser implements MercenariesParser {
	public eventType = () => GameEvent.MERCENARIES_HERO_REVIVED;

	public applies = (battleState: MercenariesBattleState) => battleState != null;

	public async parse(battleState: MercenariesBattleState, event: GameEvent): Promise<MercenariesBattleState> {
		const [cardId, controllerId, localPlayer, entityId] = event.parse();
		if (!localPlayer) {
			console.error('[merc-minions-died-parser] no local player present', event);
			return battleState;
		}

		const isPlayer = controllerId === localPlayer.PlayerId;
		const team = isPlayer ? battleState.playerTeam : battleState.opponentTeam;
		const newTeam = team.updateMercenary(entityId, { isDead: false });
		// team.update({
		// 	// We only remove the minions that were created during combat to avoid polluting too much the list
		// 	mercenaries: team.mercenaries.filter((merc) => !merc.creatorCardId || merc.entityId !== entityId),
		// });
		const result = battleState.update({
			playerTeam: isPlayer ? newTeam : battleState.playerTeam,
			opponentTeam: isPlayer ? battleState.opponentTeam : newTeam,
		} as MercenariesBattleState);
		return result;
	}
}
