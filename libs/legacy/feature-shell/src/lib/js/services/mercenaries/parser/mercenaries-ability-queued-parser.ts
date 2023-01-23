import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../../models/game-event';
import { MainWindowState } from '../../../models/mainwindow/main-window-state';
import { MercenariesAction, MercenariesBattleState } from '../../../models/mercenaries/mercenaries-battle-state';
import { sortByProperties } from '../../utils';
import { isPassiveMercsTreasure } from '../mercenaries-utils';
import { MercenariesParser } from './_mercenaries-parser';

export class MercenariesAbilityQueuedParser implements MercenariesParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	public eventType = () => GameEvent.MERCENARIES_ABILITY_QUEUED;

	public applies = (battleState: MercenariesBattleState) => battleState != null;

	public async parse(
		battleState: MercenariesBattleState,
		event: GameEvent,
		mainWindowState: MainWindowState,
	): Promise<MercenariesBattleState> {
		const [ownerCardId, controllerId, localPlayer, entityId] = event.parse();
		const abilityCardId = event.additionalData.abilityCardId;
		const abilitySpeed = event.additionalData.abilitySpeed;

		if (!localPlayer) {
			console.error('[merc-ability-queued-parser] no local player present', event);
			return battleState;
		}
		if (!ownerCardId || !abilityCardId) {
			console.error('[merc-ability-queued-parser] missing information', event);
			return battleState;
		}

		const isPlayer = controllerId === localPlayer.PlayerId;
		const action: MercenariesAction = isPassiveMercsTreasure(abilityCardId, this.allCards)
			? null
			: {
					side: isPlayer ? 'player' : 'opponent',
					abilityCardId: abilityCardId,
					ownerCardId: ownerCardId,
					ownerEntityId: entityId,
					speed: abilitySpeed,
			  };
		const actionQueue: readonly MercenariesAction[] =
			// No "unqueue" event is emitted when we simply change the chosen action
			[...battleState.actionQueue.filter((a) => a.ownerEntityId !== entityId), action]
				.filter((action) => !!action)
				.sort(
					sortByProperties((action: MercenariesAction) => [
						// First sort by speed, and in case of speed ties the player actions first
						action.speed,
						action.side === 'player' ? 1 : 2,
					]),
				);
		return battleState.update({
			actionQueue: actionQueue,
		} as MercenariesBattleState);
	}
}
