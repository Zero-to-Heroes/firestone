import { GameEvent } from '../../../models/game-event';
import { MainWindowState } from '../../../models/mainwindow/main-window-state';
import { MercenariesAction, MercenariesBattleState } from '../../../models/mercenaries/mercenaries-battle-state';
import { sortByProperties } from '../../utils';
import { MercenariesParser } from './_mercenaries-parser';
import { CardsFacadeService } from '../../cards-facade.service';
import { isPassiveMercsTreasure } from '../mercenaries-utils';

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

		var actionQueue: readonly MercenariesAction[];

		if (!isPassiveMercsTreasure(abilityCardId, this.allCards)) {
			const isPlayer = controllerId === localPlayer.PlayerId;
			const action: MercenariesAction = {
				side: isPlayer ? 'player' : 'opponent',
				abilityCardId: abilityCardId,
				ownerCardId: ownerCardId,
				ownerEntityId: entityId,
				speed: abilitySpeed,
			};
			actionQueue =
				// No "unqueue" event is emitted when we simply change the chosen action
				[...battleState.actionQueue.filter((a) => a.ownerEntityId !== entityId), action ].sort(
					sortByProperties((action: MercenariesAction) => [
						// First sort by speed, and in case of speed ties the player actions first
						action.speed,
						action.side === 'player' ? 1 : 2,
					]),
				);
		}
		else{
			actionQueue =
				[...battleState.actionQueue.filter((a) => a.ownerEntityId !== entityId)].sort(
					sortByProperties((action: MercenariesAction) => [
						action.speed,
						action.side === 'player' ? 1 : 2,
					]),
				);
		}
		return battleState.update({
			actionQueue: actionQueue,
		} as MercenariesBattleState);
	}
}
