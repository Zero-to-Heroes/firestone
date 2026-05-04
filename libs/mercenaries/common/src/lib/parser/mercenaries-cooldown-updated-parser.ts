import { GameEvent } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { BattleAbility, MercenariesBattleState } from '../services/mercenaries-battle-state';
import { MercenariesParser } from './_mercenaries-parser';

export class MercenariesCooldownUpdatedParser implements MercenariesParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	public eventType = () => GameEvent.MERCENARIES_COOLDOWN_UPDATED;

	public applies = (battleState: MercenariesBattleState) => battleState != null;

	public async parse(battleState: MercenariesBattleState, event: GameEvent): Promise<MercenariesBattleState> {
		const [cardId, controllerId, localPlayer, entityId] = event.parse();
		if (!localPlayer) {
			return battleState;
		}
		if (!cardId) {
			return battleState;
		}

		const ownerEntityId = event.additionalData.abilityOwnerEntityId;
		const isPlayer = controllerId === localPlayer.PlayerId;
		const team = isPlayer ? battleState.playerTeam : battleState.opponentTeam;
		const abilityOwner = team.getMercenary(ownerEntityId);
		if (!abilityOwner) {
			console.warn('[merc-cooldown-updated-parser] missing owner', ownerEntityId);
			return battleState;
		}

		const newMerc = abilityOwner.updateAbility(
			entityId,
			cardId,
			BattleAbility.create({ cooldownLeft: event.additionalData.newCooldown }),
		);
		const newTeam = team.updateMercenary(newMerc.entityId, newMerc);
		return battleState.update({
			playerTeam: isPlayer ? newTeam : battleState.playerTeam,
			opponentTeam: isPlayer ? battleState.opponentTeam : newTeam,
		} as MercenariesBattleState);
	}
}
