import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@services/cards-facade.service';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { COUNTERSPELLS, globalEffectCards } from '../../hs-utils';
import { modifyDeckForSpecialCards } from './deck-contents-utils';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class CardPlayedByEffectParser implements EventParser {
	constructor(private readonly helper: DeckManipulationHelper, private readonly allCards: CardsFacadeService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.CARD_PLAYED_BY_EFFECT;
	}

	async parse(
		currentState: GameState,
		gameEvent: GameEvent,
		additionalInfo?: {
			secretWillTrigger?: {
				cardId: string;
				reactingToCardId: string;
				reactingToEntityId: number;
			};
			minionsWillDie?: readonly {
				cardId: string;
				entityId: number;
			}[];
		},
	): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		// Only minions end up on the board
		const refCard = this.allCards.getCard(cardId);
		const isOnBoard = refCard && refCard.type === 'Minion';
		const cardWithZone = DeckCard.create({
			entityId: entityId,
			cardId: cardId,
			cardName: refCard?.name,
			manaCost: refCard?.cost,
			rarity: refCard?.rarity?.toLowerCase(),
			zone: isOnBoard ? 'PLAY' : null,
			temporaryCard: false,
		} as DeckCard);
		//console.debug('card with zone', cardWithZone, refCard, cardId);
		const newBoard: readonly DeckCard[] = isOnBoard
			? this.helper.addSingleCardToZone(deck.board, cardWithZone)
			: deck.board;
		const newOtherZone: readonly DeckCard[] = isOnBoard
			? deck.otherZone
			: this.helper.addSingleCardToZone(deck.otherZone, cardWithZone);

		const isCardCountered =
			((additionalInfo?.secretWillTrigger?.reactingToEntityId &&
				additionalInfo?.secretWillTrigger?.reactingToEntityId === entityId) ||
				(additionalInfo?.secretWillTrigger?.reactingToCardId &&
					additionalInfo?.secretWillTrigger?.reactingToCardId === cardId)) &&
			COUNTERSPELLS.includes(additionalInfo?.secretWillTrigger?.cardId as CardIds);

		let newGlobalEffects: readonly DeckCard[] = deck.globalEffects;
		if (!isCardCountered && globalEffectCards.includes(cardId as CardIds)) {
			newGlobalEffects = this.helper.addSingleCardToZone(
				deck.globalEffects,
				cardWithZone?.update({
					// So that if the card is sent back to hand, we can track multiple plays of it
					entityId: null,
				} as DeckCard),
			);
		}
		const newPlayerDeck = Object.assign(new DeckState(), deck, {
			board: newBoard,
			otherZone: newOtherZone,
			globalEffects: newGlobalEffects,
		} as DeckState);
		//console.debug('is card countered?', isCardCountered, secretWillTrigger, cardId);
		const deckAfterSpecialCaseUpdate: DeckState = isCardCountered
			? newPlayerDeck
			: modifyDeckForSpecialCards(cardId, newPlayerDeck, this.allCards);

		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: deckAfterSpecialCaseUpdate,
		});
	}

	event(): string {
		return GameEvent.CARD_PLAYED_BY_EFFECT;
	}
}
