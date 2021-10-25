import { GameEvent } from '../../../models/game-event';
import { MainWindowState } from '../../../models/mainwindow/main-window-state';
import { BattleMercenary, MercenariesBattleState } from '../../../models/mercenaries/mercenaries-battle-state';
import { MercenariesParser } from './_mercenaries-parser';

export class MercenariesZonePositionChangedParser implements MercenariesParser {
	public eventType = () => GameEvent.ZONE_POSITION_CHANGED;

	public applies = (battleState: MercenariesBattleState) => battleState != null;

	public parse(
		battleState: MercenariesBattleState,
		event: GameEvent,
		mainWindowState: MainWindowState,
	): MercenariesBattleState | PromiseLike<MercenariesBattleState> {
		const [cardId, controllerId, localPlayer, entityId] = event.parse();
		const isPlayer = controllerId === localPlayer.PlayerId;
		const team = isPlayer ? battleState.playerTeam : battleState.opponentTeam;
		// console.debug('[merc-zone-position] zone position event', event, cardId, controllerId, entityId);
		if (!team.mercenaries?.map((merc) => merc.entityId).includes(entityId)) {
			console.debug('[merc-zone-position] not about a merc, returning', event);
			return battleState;
		}

		const newTeam = team.updateMercenary(
			entityId,
			BattleMercenary.create({
				zonePosition: event.additionalData.zonePosition,
			}),
		);
		// console.debug('[merc-zone-position] updated team', newTeam, team);
		return battleState.update({
			playerTeam: isPlayer ? newTeam : battleState.playerTeam,
			opponentTeam: isPlayer ? battleState.opponentTeam : newTeam,
		} as MercenariesBattleState);
	}
}
