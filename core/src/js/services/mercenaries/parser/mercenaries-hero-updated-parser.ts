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
			console.debug(
				'[merc-hero-revealed-parser] no card id, so no iteresting info to get from that event',
				event,
			);
			return battleState;
		}

		const normalizedCardId = normalizeMercenariesCardId(cardId);
		const refMerc = mainWindowState.mercenaries.referenceData.mercenaries.find(
			(merc) =>
				normalizeMercenariesCardId(this.allCards.getCardFromDbfId(merc.cardDbfId).id) === normalizedCardId,
		);
		if (!refMerc) {
			console.debug(
				'[merc-hero-revealed-parser] not a merc, returning',
				cardId,
				normalizedCardId,
				event,
				mainWindowState.mercenaries.referenceData,
			);
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
				abilities: refMerc.abilities.map((refAbility) => {
					const refCard = this.allCards.getCardFromDbfId(refAbility.cardDbfId);
					return BattleAbility.create({
						entityId: null,
						cardId: refCard.id,
						level: getMercCardLevel(refCard.id),
						cooldown: refCard.mercenaryAbilityCooldown ?? 0,
						cooldownLeft: refCard.mercenaryAbilityCooldown ?? 0,
						speed: refCard.cost,
						totalUsed: null,
					});
				}),
				level: getMercLevelFromExperience(
					event.additionalData.mercenariesExperience,
					mainWindowState.mercenaries.referenceData,
				),
				role: getHeroRole(refMercCard.mercenaryRole),
				treasures: [],
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
