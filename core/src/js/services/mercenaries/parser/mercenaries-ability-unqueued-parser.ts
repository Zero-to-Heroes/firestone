import { GameEvent } from '../../../models/game-event';
import { MainWindowState } from '../../../models/mainwindow/main-window-state';
import { MercenariesAction, MercenariesBattleState } from '../../../models/mercenaries/mercenaries-battle-state';
import { MercenariesParser } from './_mercenaries-parser';

export class MercenariesAbilityUnqueuedParser implements MercenariesParser {
	public eventType = () => GameEvent.MERCENARIES_ABILITY_UNQUEUED;

	public applies = (battleState: MercenariesBattleState) => battleState != null;

	public parse(
		battleState: MercenariesBattleState,
		event: GameEvent,
		mainWindowState: MainWindowState,
	): MercenariesBattleState | PromiseLike<MercenariesBattleState> {
		const [ownerCardId, controllerId, localPlayer, entityId] = event.parse();
		if (!entityId) {
			console.error('[merc-ability-unqueued-parser] missing information', event);
			return battleState;
		}
		const actionQueue: readonly MercenariesAction[] = battleState.actionQueue.filter(
			(a) => a.ownerEntityId !== entityId,
		);
		return battleState.update({
			actionQueue: actionQueue,
		} as MercenariesBattleState);
	}
}
