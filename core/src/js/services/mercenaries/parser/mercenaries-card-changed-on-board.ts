import { GameEvent } from '../../../models/game-event';
import { MainWindowState } from '../../../models/mainwindow/main-window-state';
import {
	BattleAbility,
	BattleEquipment,
	BattleMercenary,
	MercenariesBattleState,
} from '../../../models/mercenaries/mercenaries-battle-state';
import { CardsFacadeService } from '../../cards-facade.service';
import { getHeroRole } from '../mercenaries-utils';
import { MercenariesParser } from './_mercenaries-parser';


export class MercenariesCardChangedOnBoardParser implements MercenariesParser {
	constructor(private readonly allCards: CardsFacadeService) {}
	public eventType = () => GameEvent.CARD_CHANGED_ON_BOARD;
	public applies = (battleState: MercenariesBattleState) => battleState != null;
	public async parse(
		battleState: MercenariesBattleState,
		event: GameEvent,
		mainWindowState: MainWindowState,
	): Promise<MercenariesBattleState> {
		const [cardId, controllerId, localPlayer, entityId] = event.parse();
		if (!localPlayer) {
			console.error('[merc-card-changed-on-board-parser] no local player present', event);
			return battleState;
		}
		if (!cardId) {
			console.debug('[merc-card-changed-on-board-parser] no card Id', event);
			return battleState;
		}
		const normalizedCardId = cardId;
		const refData = mainWindowState?.mercenaries?.referenceData;
		const refMerc = refData?.mercenaries?.find(
			(merc) =>
				this.allCards.getCardFromDbfId(merc.cardDbfId).id === normalizedCardId,
		);
		const refMercCard = this.allCards.getCard(normalizedCardId);
		const isPlayer = controllerId === localPlayer.PlayerId;
		const team = isPlayer ? battleState.playerTeam : battleState.opponentTeam;
		const existingMerc = team.getMercenary(entityId);

		if (!existingMerc) {
			console.warn('[merc-card-changed-on-board-parser] trying to change non-existing merc', entityId, refMercCard.name, cardId);
		}
		const newTeam = team.updateMercenary(
			entityId,
			BattleMercenary.create({ 
				cardId: refMercCard.id,
                role: getHeroRole(refMercCard.mercenaryRole),
                //We should first add alternative merc skins to refData (Genn, Archmage Khadgar)
                /*abilities:
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
					}) ?? existingMerc.abilities,*/
			}),
		);
		return battleState.update({
			playerTeam: isPlayer ? newTeam : battleState.playerTeam,
			opponentTeam: isPlayer ? battleState.opponentTeam : newTeam,
		} as MercenariesBattleState);
	}
}
