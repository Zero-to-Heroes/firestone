import { GameEvent } from '../../../models/game-event';
import { MainWindowState } from '../../../models/mainwindow/main-window-state';
import {
	BattleAbility,
	BattleEquipment,
	BattleMercenary,
	MercenariesBattleState,
} from '../../../models/mercenaries/mercenaries-battle-state';
import { CardsFacadeService } from '../../cards-facade.service';
import {
	getHeroRole,
	getMercCardLevel,
	getMercLevelFromExperience,
	normalizeMercenariesCardId,
} from '../mercenaries-utils';
import { MercenariesParser } from './_mercenaries-parser';

export class MercenariesHeroUpdatedParser implements MercenariesParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	public eventType = () => GameEvent.ENTITY_UPDATE;

	public applies = (battleState: MercenariesBattleState) => battleState != null;

	public async parse(
		battleState: MercenariesBattleState,
		event: GameEvent,
		mainWindowState: MainWindowState,
	): Promise<MercenariesBattleState> {
		const [cardId, controllerId, localPlayer, entityId] = event.parse();
		if (!localPlayer) {
			console.error('[merc-hero-revealed-parser] no local player present', event);
			return battleState;
		}
		if (!cardId) {
			console.debug('[merc-hero-revealed-parser] no card Id', event);
			return battleState;
		}

		const normalizedCardId = normalizeMercenariesCardId(cardId);
		const refData = mainWindowState?.mercenaries?.referenceData;

		// Sometimes the spawns are not referenced in the data (like for Ahune's Ice Shards),
		// so it's possible that this doesn't return anything
		const refMerc = refData?.mercenaries?.find(
			(merc) =>
				normalizeMercenariesCardId(this.allCards.getCardFromDbfId(merc.cardDbfId).id) === normalizedCardId,
		);

		const refMercCard = this.allCards.getCard(normalizedCardId);
		const refMercEquipment = this.allCards.getCardFromDbfId(event.additionalData?.mercenariesEquipmentId);
		const isPlayer = controllerId === localPlayer.PlayerId;
		const team = isPlayer ? battleState.playerTeam : battleState.opponentTeam;
		const turnsElapsed = Math.max(0, battleState.currentTurn - 1);

		const existingMerc = team.getMercenary(entityId);
		if (!existingMerc) {
			console.warn('[merc-hero-updated] trying to update non-existing merc', entityId, cardId);
			return battleState;
		}

		// console.debug('turnsElapsed', turnsElapsed, battleState.currentTurn, battleState);
		const newTeam = team.updateMercenary(
			entityId,
			BattleMercenary.create({
				cardId: refMercCard.id,
				zone: event.additionalData.zone,
				zonePosition: event.additionalData.zonePosition,
				abilities:
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
							speed: refCard.cost ?? 0,
							totalUsed: null,
							isTreasure: false,
						});
					}) ?? existingMerc.abilities,
				level: getMercLevelFromExperience(event.additionalData.mercenariesExperience, refData),
				role: getHeroRole(refMercCard.mercenaryRole),
				equipment: BattleEquipment.create({
					entityId: null,
					cardId: refMercEquipment.id,
					level: getMercCardLevel(refMercEquipment.id),
				}),
			}),
		);
		return battleState.update({
			playerTeam: isPlayer ? newTeam : battleState.playerTeam,
			opponentTeam: isPlayer ? battleState.opponentTeam : newTeam,
		} as MercenariesBattleState);
	}
}
