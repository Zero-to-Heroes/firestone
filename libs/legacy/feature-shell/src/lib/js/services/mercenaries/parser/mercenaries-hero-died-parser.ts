import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../../models/game-event';
import { MainWindowState } from '../../../models/mainwindow/main-window-state';
import { MercenariesAction, MercenariesBattleState } from '../../../models/mercenaries/mercenaries-battle-state';
import { MercenariesParser } from './_mercenaries-parser';

export class MercenariesHeroDiedParser implements MercenariesParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	public eventType = () => GameEvent.MINIONS_DIED;

	public applies = (battleState: MercenariesBattleState) => battleState != null;

	public async parse(
		battleState: MercenariesBattleState,
		event: GameEvent,
		mainWindowState: MainWindowState,
	): Promise<MercenariesBattleState> {
		const [, , localPlayer] = event.parse();

		const deadMinions = event.additionalData.deadMinions;
		const deadEntityIds: readonly number[] = deadMinions.map((minion) => minion.EntityId);
		const actionQueue: readonly MercenariesAction[] = battleState.actionQueue.filter(
			(a) => !deadEntityIds.includes(a.ownerEntityId),
		);
		const battleStateWithActions = battleState.update({
			// actionQueue: actionQueue,
		});
		if (!localPlayer) {
			console.error('[merc-minions-died-parser] no local player present', event);
			return battleStateWithActions;
		}

		let workingBattleState = battleStateWithActions;
		for (const deadMinion of deadMinions) {
			const entityId = deadMinion.EntityId;
			const controllerId = deadMinion.ControllerId;
			const isPlayer = controllerId === localPlayer.PlayerId;
			const team = isPlayer ? workingBattleState.playerTeam : workingBattleState.opponentTeam;
			const newTeam = team.updateMercenary(entityId, { isDead: true });
			// team.update({
			// 	// We only remove the minions that were created during combat to avoid polluting too much the list
			// 	mercenaries: team.mercenaries.filter((merc) => !merc.creatorCardId || merc.entityId !== entityId),
			// });
			workingBattleState = workingBattleState.update({
				playerTeam: isPlayer ? newTeam : workingBattleState.playerTeam,
				opponentTeam: isPlayer ? workingBattleState.opponentTeam : newTeam,
			} as MercenariesBattleState);
		}
		return workingBattleState;
	}
}
