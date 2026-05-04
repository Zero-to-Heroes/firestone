import { GameEvent } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import {
	BattleAbility,
	BattleEquipment,
	BattleMercenary,
	MercenariesBattleState,
	MercenariesBattleTeam,
} from '../services/mercenaries-battle-state';
import { MercenariesReferenceDataService } from '../services/mercenaries-reference-data.service';
import {
	getHeroRole,
	getMercCardLevel,
	getMercLevelFromExperience,
	normalizeMercenariesCardId,
} from '../services/mercenaries-utils';
import { MercenariesParser } from './_mercenaries-parser';

export class MercenariesHeroRevealedParser implements MercenariesParser {
	constructor(
		private readonly allCards: CardsFacadeService,
		private readonly mercenariesReferenceData: MercenariesReferenceDataService,
	) {}

	public eventType = () => GameEvent.MERCENARIES_HERO_REVEALED;

	public applies = (battleState: MercenariesBattleState) => battleState != null;

	public async parse(battleState: MercenariesBattleState, event: GameEvent): Promise<MercenariesBattleState> {
		const [cardId, controllerId, localPlayer, entityId] = event.parse();
		if (!localPlayer) {
			console.error('[merc-hero-revealed-parser] no local player present', event);
			return battleState;
		}
		const opponentPlayer = event.opponentPlayer;
		// In PvE, mercs can summon minions, and we want to know what they can do
		// Maybe we should remove from the list the mercs that are created once they die
		if (
			// !!event.additionalData.creatorCardId ||
			controllerId !== localPlayer.PlayerId &&
			controllerId !== opponentPlayer.PlayerId
		) {
			console.warn('[merc-hero-revealed-parser] probably invoking a merc while in combat', event, battleState);
			return battleState;
		}

		const isPlayer = controllerId === localPlayer.PlayerId;
		const team = isPlayer ? battleState.playerTeam : battleState.opponentTeam;

		const normalizedCardId = normalizeMercenariesCardId(cardId);
		const refData = await this.mercenariesReferenceData.referenceData$$.getValueWithInit();
		const refMerc = normalizedCardId
			? refData?.mercenaries?.find(
					(merc) =>
						normalizeMercenariesCardId(this.allCards.getCardFromDbfId(merc.cardDbfId).id) ===
						normalizedCardId,
				)
			: null;

		const refMercCard = normalizedCardId ? this.allCards.getCard(normalizedCardId) : null;
		const refMercEquipment = event.additionalData.mercenariesEquipmentId
			? this.allCards.getCardFromDbfId(event.additionalData.mercenariesEquipmentId)
			: null;
		const mercFromMemory = isPlayer
			? battleState.mercenariesFromMemory?.Map?.PlayerTeam?.find((merc) => merc.Id === refMerc?.id)
			: null;
		const abilityCardIdsFromMemory = (mercFromMemory?.Abilities ?? []).map((ability) => ability.CardId);
		const mercenary: BattleMercenary = BattleMercenary.create({
			mercenaryId: refMerc?.id,
			entityId: entityId,
			cardId: refMercCard?.id,
			creatorCardId: event.additionalData.creatorCardId,
			isDead: event.additionalData.isDead,
			zone: event.additionalData.zone,
			zonePosition: event.additionalData.zonePosition,
			abilities: (
				refMerc?.abilities
					.map((refAbility) => {
						const refTier = [...refAbility.tiers].sort((a, b) => a.tier - b.tier).pop();
						if (!refTier) {
							console.warn('could not find refTier', refAbility?.tiers, refAbility.abilityId, refAbility);
							return null;
						}
						const refCard = this.allCards.getCardFromDbfId(refTier.cardDbfId);
						return BattleAbility.create({
							entityId: undefined,
							cardId: refCard.id,
							level: refTier.tier,
							cooldown: refCard.mercenaryAbilityCooldown ?? 0,
							cooldownLeft: 0,
							speed: refCard.cost ?? 0,
							totalUsed: undefined,
							isTreasure: false,
						});
					})
					.filter((ability) => !!ability) ?? []
			).filter(
				(ability) => !abilityCardIdsFromMemory?.length || abilityCardIdsFromMemory.includes(ability.cardId),
			),
			inPlay: false,
			level: event.additionalData.mercenariesExperience
				? getMercLevelFromExperience(event.additionalData.mercenariesExperience, refData ?? undefined)
				: undefined,
			role: refMercCard?.id ? getHeroRole(refMercCard.mercenaryRole) : undefined,
			equipment: refMercEquipment
				? BattleEquipment.create({
						entityId: undefined,
						cardId: refMercEquipment.id,
						level: getMercCardLevel(refMercEquipment.id),
					})
				: undefined,
		});

		const newTeam = team.update({
			mercenaries: [...(team.mercenaries ?? []), mercenary] as readonly BattleMercenary[],
		} as MercenariesBattleTeam);
		return battleState.update({
			playerTeam: isPlayer ? newTeam : battleState.playerTeam,
			opponentTeam: isPlayer ? battleState.opponentTeam : newTeam,
		} as MercenariesBattleState);
	}
}
