import { GameEvent } from '../../../models/game-event';
import { MainWindowState } from '../../../models/mainwindow/main-window-state';
import { BattleMercenary, MercenariesBattleState } from '../../../models/mercenaries/mercenaries-battle-state';
import { MercenariesParser } from './_mercenaries-parser';

export class MercenariesZonePositionChangedParser implements MercenariesParser {
	public eventType = () => GameEvent.ZONE_POSITION_CHANGED;

	public applies = (battleState: MercenariesBattleState) => battleState != null;

	public async parse(
		battleState: MercenariesBattleState,
		event: GameEvent,
		mainWindowState: MainWindowState,
	): Promise<MercenariesBattleState> {
		const [cardId, controllerId, localPlayer, entityId] = event.parse();
		const isPlayer = controllerId === localPlayer.PlayerId;
		const team = isPlayer ? battleState.playerTeam : battleState.opponentTeam;
		if (!team.mercenaries?.map((merc) => merc.entityId).includes(entityId)) {
			return battleState;
		}

		const newTeam = team.updateMercenary(
			entityId,
			BattleMercenary.create({
				zonePosition: event.additionalData.zonePosition,
			}),
		);
		return battleState.update({
			playerTeam: isPlayer ? newTeam : battleState.playerTeam,
			opponentTeam: isPlayer ? battleState.opponentTeam : newTeam,
		} as MercenariesBattleState);
	}
}
