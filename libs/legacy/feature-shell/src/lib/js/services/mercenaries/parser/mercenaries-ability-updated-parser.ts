import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../../models/game-event';
import { MainWindowState } from '../../../models/mainwindow/main-window-state';
import { BattleAbility, MercenariesBattleState } from '../../../models/mercenaries/mercenaries-battle-state';
import { getMercCardLevel, isPassiveMercsTreasure } from '../mercenaries-utils';
import { MercenariesParser } from './_mercenaries-parser';

export class MercenariesAbilityUpdatedParser implements MercenariesParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	public eventType = () => GameEvent.MERCENARIES_ABILITY_UPDATE;

	public applies = (battleState: MercenariesBattleState) => battleState != null;

	public async parse(
		battleState: MercenariesBattleState,
		event: GameEvent,
		mainWindowState: MainWindowState,
	): Promise<MercenariesBattleState> {
		const [cardId, controllerId, localPlayer, entityId] = event.parse();
		if (!localPlayer) {
			console.error('[merc-ability-updated-parser] no local player present', event);
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
			console.warn('[merc-ability-updated-parser] missing owner', ownerEntityId);
			return battleState;
		}

		const refAbilityCard = this.allCards.getCard(cardId);
		const isTreasure = event.additionalData.isTreasure;
		const newMerc = abilityOwner.updateAbility(
			entityId,
			cardId,
			BattleAbility.create({
				entityId: entityId,
				cardId: cardId,
				cooldown: event.additionalData.abilityCooldownConfig ?? refAbilityCard.mercenaryAbilityCooldown,
				cooldownLeft: event.additionalData.abilityCurrentCooldown ?? refAbilityCard.mercenaryAbilityCooldown,
				level: getMercCardLevel(cardId),
				speed: isPassiveMercsTreasure(cardId, this.allCards)
					? null
					: event.additionalData.abilitySpeed ?? refAbilityCard.cost ?? 0,
				totalUsed: 0,
				isTreasure: isTreasure,
			}),
		);
		const newTeam = team.updateMercenary(newMerc.entityId, newMerc);
		return battleState.update({
			playerTeam: isPlayer ? newTeam : battleState.playerTeam,
			opponentTeam: isPlayer ? battleState.opponentTeam : newTeam,
		} as MercenariesBattleState);
	}
}
