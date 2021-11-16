import { sortBy } from 'lodash';
import { GameEvent } from '../../../models/game-event';
import { MainWindowState } from '../../../models/mainwindow/main-window-state';
import { MercenariesAction, MercenariesBattleState } from '../../../models/mercenaries/mercenaries-battle-state';
import { MercenariesParser } from './_mercenaries-parser';

export class MercenariesAbilityQueuedParser implements MercenariesParser {
	public eventType = () => GameEvent.MERCENARIES_ABILITY_QUEUED;

	public applies = (battleState: MercenariesBattleState) => battleState != null;

	public parse(
		battleState: MercenariesBattleState,
		event: GameEvent,
		mainWindowState: MainWindowState,
	): MercenariesBattleState | PromiseLike<MercenariesBattleState> {
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
		const action: MercenariesAction = {
			side: isPlayer ? 'player' : 'opponent',
			abilityCardId: abilityCardId,
			ownerCardId: ownerCardId,
			ownerEntityId: entityId,
			speed: abilitySpeed,
		};
		const actionQueue: readonly MercenariesAction[] = sortBy(
			// No "unqueue" event is emitted when we simply change the chosen action
			[...battleState.actionQueue.filter((a) => a.ownerEntityId !== action.ownerEntityId), action],
			(action: MercenariesAction) => action.speed,
		);
		return battleState.update({
			actionQueue: actionQueue,
		} as MercenariesBattleState);
	}
}
