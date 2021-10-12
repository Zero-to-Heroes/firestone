import { GameEvent } from '../../../models/game-event';
import { MainWindowState } from '../../../models/mainwindow/main-window-state';
import { MercenariesBattleState } from '../../../models/mercenaries/mercenaries-battle-state';
import { CardsFacadeService } from '../../cards-facade.service';
import { MercenariesParser } from './_mercenaries-parser';

export class MercenariesHeroDiedParser implements MercenariesParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	public eventType = () => GameEvent.MINIONS_DIED;

	public applies = (battleState: MercenariesBattleState) => battleState != null;

	public parse(
		battleState: MercenariesBattleState,
		event: GameEvent,
		mainWindowState: MainWindowState,
	): MercenariesBattleState | PromiseLike<MercenariesBattleState> {
		const [, , localPlayer] = event.parse();
		if (!localPlayer) {
			console.error('[merc-minions-died-parser] no local player present', event);
			return battleState;
		}

		const deadMinions = event.additionalData.deadMinions;
		let workingBattleState = battleState;
		for (const deadMinion of deadMinions) {
			const entityId = deadMinion.EntityId;
			const controllerId = deadMinion.ControllerId;
			const isPlayer = controllerId === localPlayer.PlayerId;
			const team = isPlayer ? battleState.playerTeam : battleState.opponentTeam;
			const newTeam = team.update({
				// We only remove the minions that were created during combat to avoid polluting too much the list
				mercenaries: team.mercenaries.filter((merc) => !merc.creatorCardId || merc.entityId !== entityId),
			});
			workingBattleState = workingBattleState.update({
				playerTeam: isPlayer ? newTeam : battleState.playerTeam,
				opponentTeam: isPlayer ? battleState.opponentTeam : newTeam,
			} as MercenariesBattleState);
		}
		return workingBattleState;
	}
}
