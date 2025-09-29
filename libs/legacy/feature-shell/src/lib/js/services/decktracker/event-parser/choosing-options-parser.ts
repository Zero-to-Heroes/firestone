import { CardIds, CardType, Race, hasCorrectTribe } from '@firestone-hs/reference-data';
import { CardOption, DeckState, GameState } from '@firestone/game-state';
import { CardsFacadeService } from 'libs/shared/framework/core/src/lib/services/cards-facade.service';
import { GameEvent } from '../../../models/game-event';
import { ChoosingOptionsGameEvent } from '../../../models/mainwindow/game-events/choosing-options-game-event';
import { EventParser } from './event-parser';

export class ChoosingOptionsParser implements EventParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: ChoosingOptionsGameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		const newDeck = deck.update({
			currentOptions: gameEvent.additionalData.options.map((o) => {
				const result: CardOption = {
					entityId: o.EntityId,
					cardId: o.CardId,
					source: cardId,
					context: gameEvent.additionalData.context,
					questDifficulty: o.QuestDifficulty,
					questReward: o.QuestReward,
					willBeActive: willBeActive(o.CardId, deck, this.allCards),
				};
				return result;
			}),
		});
		// console.debug('[choosing-options] updating options', newDeck.currentOptions, gameEvent);

		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newDeck,
		});
	}

	event(): string {
		return GameEvent.CHOOSING_OPTIONS;
	}
}

const willBeActive = (cardId: string, playerDeck: DeckState, allCards: CardsFacadeService): boolean => {
	if (!playerDeck?.isActivePlayer) {
		return false;
	}

	switch (cardId) {
		case CardIds.BoneFlinger:
		case CardIds.GraveDigging:
		case CardIds.NecroticMortician_CORE_RLK_116:
		case CardIds.NecroticMortician:
		case CardIds.NerubianFlyer:
		case CardIds.NerubianVizier:
		case CardIds.ShadowWordUndeath:
		case CardIds.UnlivingChampion:
			return (
				playerDeck.minionsDeadSinceLastTurn.filter((c) =>
					hasCorrectTribe(allCards.getCard(c.cardId), Race.UNDEAD),
				).length > 0
			);
		case CardIds.AnimatedAvalanche:
		case CardIds.Arcanosaur:
		case CardIds.AridStormer:
		case CardIds.Blazecaller:
		case CardIds.BonfireElemental:
		case CardIds.ElementalLearningTavernBrawl:
		case CardIds.ElementaryReaction:
		case CardIds.ErodedSediment_WW_428:
		case CardIds.FrostfinChomper:
		case CardIds.Gyreworm:
		case CardIds.KalimosPrimalLord_Core_UNG_211:
		case CardIds.KalimosPrimalLord:
		case CardIds.Lamplighter_VAC_442:
		case CardIds.LilypadLurker:
		case CardIds.LivingPrairie_WW_024:
		case CardIds.MinecartCruiser_WW_326:
		case CardIds.ServantOfKalimos_UNG_816:
		case CardIds.ShaleSpider_DEEP_034:
		case CardIds.SpontaneousCombustion_GDB_456:
		case CardIds.SteamSurger:
		case CardIds.StoneSentinel:
		case CardIds.TaintedRemnant_YOG_519:
		case CardIds.ThunderLizard:
		case CardIds.TolvirStoneshaper:
			return playerDeck.elementalsPlayedLastTurn > 0;
		case CardIds.Wartbringer:
			return (
				playerDeck.cardsPlayedThisTurn.filter((c) => c.cardType?.toUpperCase() === CardType[CardType.SPELL])
					.length >= 2
			);
		default:
			return false;
	}
};
