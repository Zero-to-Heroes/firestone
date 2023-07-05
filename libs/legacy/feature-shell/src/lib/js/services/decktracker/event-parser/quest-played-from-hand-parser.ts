import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { COUNTERSPELLS } from '@services/hs-utils';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState, ShortCard } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { rememberCardsInHand } from './card-played-from-hand-parser';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class QuestPlayedFromHandParser implements EventParser {
	constructor(private readonly helper: DeckManipulationHelper, private readonly allCards: CardsFacadeService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.QUEST_PLAYED;
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
		const card = this.helper.findCardInZone(deck.hand, cardId, entityId);

		const isCardCountered =
			((additionalInfo?.secretWillTrigger?.reactingToEntityId &&
				additionalInfo?.secretWillTrigger?.reactingToEntityId === entityId) ||
				(additionalInfo?.secretWillTrigger?.reactingToCardId &&
					additionalInfo?.secretWillTrigger?.reactingToCardId === cardId)) &&
			COUNTERSPELLS.includes(additionalInfo?.secretWillTrigger?.cardId as CardIds);

		const cardWithZone = card.update({
			zone: 'SECRET',
			countered: isCardCountered,
		} as DeckCard);

		const newHand: readonly DeckCard[] = this.helper.removeSingleCardFromZone(deck.hand, cardId, entityId)[0];
		const handAfterCardsRemembered = isCardCountered
			? newHand
			: rememberCardsInHand(cardId, newHand, this.helper, this.allCards);

		const previousOtherZone = deck.otherZone;
		const newOtherZone: readonly DeckCard[] = this.helper.addSingleCardToZone(
			previousOtherZone,
			isCardCountered && additionalInfo?.secretWillTrigger?.cardId === CardIds.OhMyYogg
				? // Since Yogg transforms the card
				  cardWithZone.update({
						entityId: undefined,
				  } as DeckCard)
				: cardWithZone,
		);
		const newPlayerDeck = Object.assign(new DeckState(), deck, {
			hand: handAfterCardsRemembered,
			otherZone: newOtherZone,
			cardsPlayedThisTurn: isCardCountered
				? deck.cardsPlayedThisTurn
				: ([...deck.cardsPlayedThisTurn, cardWithZone] as readonly DeckCard[]),
			spellsPlayedThisMatch: isCardCountered
				? deck.spellsPlayedThisMatch
				: [...deck.spellsPlayedThisMatch, cardWithZone],
		} as DeckState);

		const newCardPlayedThisMatch: ShortCard = {
			entityId: cardWithZone.entityId,
			cardId: cardWithZone.cardId,
			side: isPlayer ? 'player' : 'opponent',
		};

		const deckAfterSpecialCaseUpdate: DeckState = isCardCountered
			? newPlayerDeck
			: newPlayerDeck.update({
					cardsPlayedThisMatch: [
						...newPlayerDeck.cardsPlayedThisMatch,
						newCardPlayedThisMatch,
					] as readonly ShortCard[],
			  });

		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: deckAfterSpecialCaseUpdate,
			cardsPlayedThisMatch: isCardCountered
				? currentState.cardsPlayedThisMatch
				: ([...currentState.cardsPlayedThisMatch, newCardPlayedThisMatch] as readonly ShortCard[]),
		});
	}

	event(): string {
		return GameEvent.QUEST_PLAYED;
	}
}
