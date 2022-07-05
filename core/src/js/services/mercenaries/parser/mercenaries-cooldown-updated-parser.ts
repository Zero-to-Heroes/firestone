import { GameEvent } from '../../../models/game-event';
import { MainWindowState } from '../../../models/mainwindow/main-window-state';
import { BattleAbility, MercenariesBattleState } from '../../../models/mercenaries/mercenaries-battle-state';
import { CardsFacadeService } from '../../cards-facade.service';
import { MercenariesParser } from './_mercenaries-parser';

export class MercenariesCooldownUpdatedParser implements MercenariesParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	public eventType = () => GameEvent.MERCENARIES_COOLDOWN_UPDATED;

	public applies = (battleState: MercenariesBattleState) => battleState != null;

	public async parse(
		battleState: MercenariesBattleState,
		event: GameEvent,
		mainWindowState: MainWindowState,
	): Promise<MercenariesBattleState> {
		const [cardId, controllerId, localPlayer, entityId] = event.parse();

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
