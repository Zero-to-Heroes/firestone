import { GameEvent } from '../../../models/game-event';
import { MainWindowState } from '../../../models/mainwindow/main-window-state';
import { BattleMercenary, MercenariesBattleState } from '../../../models/mercenaries/mercenaries-battle-state';
import { MercenariesParser } from './_mercenaries-parser';

export class MercenariesZoneChangedParser implements MercenariesParser {
	public eventType = () => GameEvent.ZONE_CHANGED;

	public applies = (battleState: MercenariesBattleState) => battleState != null;

	public async parse(
		battleState: MercenariesBattleState,
		event: GameEvent,
		mainWindowState: MainWindowState,
	): Promise<MercenariesBattleState> {
		const [cardId, controllerId, localPlayer, entityId] = event.parse();
		const isPlayer = controllerId === localPlayer.PlayerId;
		const team = isPlayer ? battleState.playerTeam : battleState.opponentTeam;
		// console.debug('[merc-zone] zone event', event, cardId, controllerId, entityId);
		if (!team.mercenaries?.map((merc) => merc.entityId)?.includes(entityId)) {
			// console.debug('[merc-zone] not about a merc, returning', event);
			return battleState;
		}

		const newTeam = team.updateMercenary(
			entityId,
			BattleMercenary.create({
				zone: event.additionalData.zone,
			}),
		);
		// console.debug('[merc-zone] updated team', newTeam, team);
		return battleState.update({
			playerTeam: isPlayer ? newTeam : battleState.playerTeam,
			opponentTeam: isPlayer ? battleState.opponentTeam : newTeam,
		} as MercenariesBattleState);
	}
}
