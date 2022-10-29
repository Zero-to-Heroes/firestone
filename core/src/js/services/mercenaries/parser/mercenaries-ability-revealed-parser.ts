import { GameEvent } from '../../../models/game-event';
import { MainWindowState } from '../../../models/mainwindow/main-window-state';
import { BattleAbility, MercenariesBattleState } from '../../../models/mercenaries/mercenaries-battle-state';
import { CardsFacadeService } from '../../cards-facade.service';
import { getMercCardLevel, isPassiveMercsTreasure } from '../mercenaries-utils';
import { MercenariesParser } from './_mercenaries-parser';

export class MercenariesAbilityRevealedParser implements MercenariesParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	public eventType = () => GameEvent.MERCENARIES_ABILITY_REVEALED;

	public applies = (battleState: MercenariesBattleState) => battleState != null;

	public async parse(
		battleState: MercenariesBattleState,
		event: GameEvent,
		mainWindowState: MainWindowState,
	): Promise<MercenariesBattleState> {
		const [cardId, controllerId, localPlayer, entityId] = event.parse();
		if (!localPlayer) {
			console.error('[merc-ability-revealed-parser] no local player present', event);
			return battleState;
		}

		const ownerEntityId = event.additionalData.abilityOwnerEntityId;
		const isPlayer = controllerId === localPlayer.PlayerId;
		const team = isPlayer ? battleState.playerTeam : battleState.opponentTeam;
		const abilityOwner = team.getMercenary(ownerEntityId);
		if (!cardId) {
			return battleState;
		}
		if (!abilityOwner) {
			console.warn('[merc-ability-revealed-parser] missing owner', ownerEntityId);
			return battleState;
		}

		const refAbilityCard = this.allCards.getCard(cardId);
		const isTreasure = event.additionalData.isTreasure;
		const newAbility = BattleAbility.create({
			entityId: entityId,
			cardId: cardId,
			cooldown: event.additionalData.abilityCooldownConfig ?? refAbilityCard.mercenaryAbilityCooldown,
			cooldownLeft: 0,
			level: getMercCardLevel(cardId),
			speed: isPassiveMercsTreasure(cardId, this.allCards)
				? null
				: event.additionalData.abilitySpeed ?? refAbilityCard.cost ?? 0,
			totalUsed: 0,
			isTreasure: isTreasure,
		});
		// Because in PvE, abilities are revealed as you encounter them
		// In PvP that's probably the case as well by the way, so let's see how it behaves in that case
		// (in PvP we initialize all the abilities because mercs are in the reference data, which is not the
		// case for the abilities of all minions in PvE, apparently)
		const newMerc = abilityOwner.updateAbility(entityId, cardId, newAbility);
		const newTeam = team.updateMercenary(newMerc.entityId, newMerc);
		return battleState.update({
			playerTeam: isPlayer ? newTeam : battleState.playerTeam,
			opponentTeam: isPlayer ? battleState.opponentTeam : newTeam,
		} as MercenariesBattleState);
	}
}
