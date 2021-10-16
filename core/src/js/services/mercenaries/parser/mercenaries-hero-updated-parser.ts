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
		if (!cardId) {
			return battleState;
		}

		const normalizedCardId = normalizeMercenariesCardId(cardId);
		const refMerc = mainWindowState.mercenaries.referenceData.mercenaries.find(
			(merc) =>
				normalizeMercenariesCardId(this.allCards.getCardFromDbfId(merc.cardDbfId).id) === normalizedCardId,
		);
		if (!refMerc) {
			return battleState;
		}

		const refMercCard = this.allCards.getCard(normalizedCardId);
		const refMercEquipment = this.allCards.getCardFromDbfId(event.additionalData.mercenariesEquipmentId);
		const isPlayer = controllerId === localPlayer.PlayerId;
		const team = isPlayer ? battleState.playerTeam : battleState.opponentTeam;
		const newTeam = team.updateMercenary(
			entityId,
			BattleMercenary.create({
				cardId: refMercCard.id,
				zone: event.additionalData.zone,
				zonePosition: event.additionalData.zonePosition,
				abilities: refMerc.abilities.map((refAbility) => {
					const refTier = [...refAbility.tiers].sort((a, b) => a.tier - b.tier).pop();
					const refCard = this.allCards.getCardFromDbfId(refTier.cardDbfId);
					return BattleAbility.create({
						entityId: null,
						cardId: refCard.id,
						level: refTier.tier,
						cooldown: refCard.mercenaryAbilityCooldown ?? 0,
						cooldownLeft: refCard.mercenaryAbilityCooldown ?? 0,
						speed: refCard.cost,
						totalUsed: null,
						isTreasure: false,
					});
				}),
				level: getMercLevelFromExperience(
					event.additionalData.mercenariesExperience,
					mainWindowState.mercenaries.referenceData,
				),
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
