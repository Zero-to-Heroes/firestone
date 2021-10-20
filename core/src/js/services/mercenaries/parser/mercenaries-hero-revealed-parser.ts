import { GameEvent } from '../../../models/game-event';
import { MainWindowState } from '../../../models/mainwindow/main-window-state';
import {
	BattleAbility,
	BattleEquipment,
	BattleMercenary,
	MercenariesBattleState,
	MercenariesBattleTeam,
} from '../../../models/mercenaries/mercenaries-battle-state';
import { CardsFacadeService } from '../../cards-facade.service';
import {
	getHeroRole,
	getMercCardLevel,
	getMercLevelFromExperience,
	normalizeMercenariesCardId,
} from '../mercenaries-utils';
import { MercenariesParser } from './_mercenaries-parser';

export class MercenariesHeroRevealedParser implements MercenariesParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	public eventType = () => GameEvent.MERCENARIES_HERO_REVEALED;

	public applies = (battleState: MercenariesBattleState) => battleState != null;

	public parse(
		battleState: MercenariesBattleState,
		event: GameEvent,
		mainWindowState: MainWindowState,
	): MercenariesBattleState | PromiseLike<MercenariesBattleState> {
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
		const refMerc = normalizedCardId
			? mainWindowState.mercenaries.referenceData.mercenaries.find(
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
		const turnsElapsed = Math.max(0, battleState.currentTurn - 1);
		// console.debug('turnsElapsed', turnsElapsed, battleState.currentTurn, battleState);
		const mercenary: BattleMercenary = BattleMercenary.create({
			entityId: entityId,
			cardId: refMercCard?.id,
			creatorCardId: event.additionalData.creatorCardId,
			isDead: event.additionalData.isDead,
			zone: event.additionalData.zone,
			zonePosition: event.additionalData.zonePosition,
			abilities: (
				refMerc?.abilities.map((refAbility) => {
					const refTier = [...refAbility.tiers].sort((a, b) => a.tier - b.tier).pop();
					if (!refTier) {
						console.warn('could not find refTier', refAbility?.tiers, refAbility.abilityId, refAbility);
						return null;
					}
					const refCard = this.allCards.getCardFromDbfId(refTier.cardDbfId);
					return BattleAbility.create({
						entityId: null,
						cardId: refCard.id,
						level: refTier.tier,
						cooldown: refCard.mercenaryAbilityCooldown ?? 0,
						cooldownLeft: Math.max(0, (refCard.mercenaryAbilityCooldown ?? 0) - turnsElapsed),
						speed: refCard.cost,
						totalUsed: null,
						isTreasure: false,
					});
				}) ?? []
			).filter(
				(ability) => !abilityCardIdsFromMemory?.length || abilityCardIdsFromMemory.includes(ability.cardId),
			),
			inPlay: false,
			level: event.additionalData.mercenariesExperience
				? getMercLevelFromExperience(
						event.additionalData.mercenariesExperience,
						mainWindowState.mercenaries.referenceData,
				  )
				: null,
			role: refMercCard?.id ? getHeroRole(refMercCard.mercenaryRole) : null,
			equipment: refMercEquipment
				? BattleEquipment.create({
						entityId: null,
						cardId: refMercEquipment.id,
						level: getMercCardLevel(refMercEquipment.id),
				  })
				: null,
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
