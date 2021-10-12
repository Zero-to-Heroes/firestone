import { GameEvent } from '../../../models/game-event';
import { MainWindowState } from '../../../models/mainwindow/main-window-state';
import { BattleAbility, MercenariesBattleState } from '../../../models/mercenaries/mercenaries-battle-state';
import { CardsFacadeService } from '../../cards-facade.service';
import { getMercCardLevel } from '../mercenaries-utils';
import { MercenariesParser } from './_mercenaries-parser';

export class MercenariesAbilityRevealedParser implements MercenariesParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	public eventType = () => GameEvent.MERCENARIES_ABILITY_REVEALED;

	public applies = (battleState: MercenariesBattleState) => battleState != null;

	public parse(
		battleState: MercenariesBattleState,
		event: GameEvent,
		mainWindowState: MainWindowState,
	): MercenariesBattleState | PromiseLike<MercenariesBattleState> {
		const [cardId, controllerId, localPlayer, entityId] = event.parse();
		if (!localPlayer) {
			console.error('[merc-ability-revealed-parser] no local player present', event);
			return battleState;
		}
		if (!cardId) {
			console.debug(
				'[merc-ability-revealed-parser] no card id, so no iteresting info to get from that event',
				event,
			);
			return battleState;
		}

		const ownerEntityId = event.additionalData.abilityOwnerEntityId;
		const isPlayer = controllerId === localPlayer.PlayerId;
		const team = isPlayer ? battleState.playerTeam : battleState.opponentTeam;
		const abilityOwner = team.getMercenary(ownerEntityId);
		if (!abilityOwner) {
			console.warn(
				'[merc-ability-revealed-parser] missing owner',
				ownerEntityId,
				team,
				isPlayer,
				controllerId,
				localPlayer.PlayerId,
				battleState,
				event,
			);
			return battleState;
		}

		const refAbilityCard = this.allCards.getCard(cardId);
		const newMerc = abilityOwner.updateAbility(
			entityId,
			cardId,
			BattleAbility.create({
				entityId: entityId,
				cardId: cardId,
				cooldown: event.additionalData.abilityCooldownConfig ?? refAbilityCard.mercenaryAbilityCooldown,
				cooldownLeft: event.additionalData.abilityCurrentCooldown ?? refAbilityCard.mercenaryAbilityCooldown,
				level: getMercCardLevel(cardId),
				speed: event.additionalData.abilitySpeed ?? refAbilityCard.cost,
				totalUsed: 0,
			}),
		);
		const newTeam = team.updateMercenary(newMerc.entityId, newMerc);
		return battleState.update({
			playerTeam: isPlayer ? newTeam : battleState.playerTeam,
			opponentTeam: isPlayer ? battleState.opponentTeam : newTeam,
		} as MercenariesBattleState);
	}
}
