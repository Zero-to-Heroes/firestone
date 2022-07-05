import { GameEvent } from '../../../models/game-event';
import { MainWindowState } from '../../../models/mainwindow/main-window-state';
import { BattleAbility, MercenariesBattleState } from '../../../models/mercenaries/mercenaries-battle-state';
import { CardsFacadeService } from '../../cards-facade.service';
import { MercenariesParser } from './_mercenaries-parser';

export class MercenariesAbilityActivatedParser implements MercenariesParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	public eventType = () => GameEvent.MERCENARIES_ABILITY_ACTIVATED;

	public applies = (battleState: MercenariesBattleState) => battleState != null;

	public async parse(
		battleState: MercenariesBattleState,
		event: GameEvent,
		mainWindowState: MainWindowState,
	): Promise<MercenariesBattleState> {
		const [cardId, controllerId, localPlayer, entityId] = event.parse();
		if (!localPlayer) {
			console.error('[merc-ability-activated-parser] no local player present', event);
			return battleState;
		}
		if (!cardId) {
			return battleState;
		}

		const ownerEntityId = event.additionalData.abilityOwnerEntityId;
		const isPlayer = controllerId === localPlayer.PlayerId;
		const team = isPlayer ? battleState.playerTeam : battleState.opponentTeam;
		const abilityOwner = team.getMercenary(ownerEntityId);
		if (!abilityOwner) {
			console.warn('[merc-ability-activated-parser] missing owner', ownerEntityId);
			return battleState;
		}
		const existingAbility = abilityOwner.getAbility(entityId);
		const newMerc = abilityOwner.updateAbility(
			entityId,
			cardId,
			BattleAbility.create({
				totalUsed: (existingAbility?.totalUsed ?? 0) + 1,
			}),
		);
		const newTeam = team.updateMercenary(newMerc.entityId, newMerc);
		return battleState.update({
			playerTeam: isPlayer ? newTeam : battleState.playerTeam,
			opponentTeam: isPlayer ? battleState.opponentTeam : newTeam,
		} as MercenariesBattleState);
	}
}
