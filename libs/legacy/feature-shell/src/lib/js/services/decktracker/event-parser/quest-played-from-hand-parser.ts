import { CardIds, CardType, GameTag } from '@firestone-hs/reference-data';
import { DeckCard, DeckState, GameState, ShortCard, ShortCardWithTurn } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { COUNTERSPELLS } from '@services/hs-utils';
import { GameEvent } from '../../../models/game-event';
import { rememberCardsInHand } from './card-played-from-hand-parser';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class QuestPlayedFromHandParser implements EventParser {
	constructor(
		private readonly helper: DeckManipulationHelper,
		private readonly allCards: CardsFacadeService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
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
		const effectiveCost = gameEvent.additionalData.cost;

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
			guessedInfo: {
				...card.guessedInfo,
			},
			tags: {
				...card.tags,
				[GameTag.QUEST]: 1,
				[GameTag.CARDTYPE]: CardType.SPELL,
			},
		} as DeckCard);

		const newHand: readonly DeckCard[] = this.helper.removeSingleCardFromZone(deck.hand, cardId, entityId)[0];
		const handAfterCardsRemembered = rememberCardsInHand(
			cardId,
			isCardCountered,
			newHand,
			this.helper,
			this.allCards,
		);

		const newOtherZone: readonly DeckCard[] = this.helper.addSingleCardToOtherZone(
			deck.otherZone,
			isCardCountered && additionalInfo?.secretWillTrigger?.cardId === CardIds.OhMyYogg
				? // Since Yogg transforms the card
					cardWithZone.update({
						entityId: undefined,
					} as DeckCard)
				: cardWithZone,
			this.allCards,
		);
		const newPlayerDeck = deck
			.update({
				hand: handAfterCardsRemembered,
				otherZone: newOtherZone,
				cardsPlayedThisTurn: isCardCountered
					? deck.cardsPlayedThisTurn
					: ([...deck.cardsPlayedThisTurn, cardWithZone] as readonly DeckCard[]),
				cardsCounteredThisTurn: isCardCountered ? deck.cardsCounteredThisTurn + 1 : deck.cardsCounteredThisTurn,
			})
			.updateSpellsPlayedThisMatch(
				isCardCountered ? null : cardWithZone,
				this.allCards,
				gameEvent.additionalData.cost,
				null,
			);

		const newCardPlayedThisMatch: ShortCardWithTurn = {
			entityId: cardWithZone.entityId,
			cardId: cardWithZone.cardId,
			side: isPlayer ? 'player' : 'opponent',
			turn: +currentState.currentTurn,
			effectiveCost: effectiveCost,
		};

		const deckAfterSpecialCaseUpdate: DeckState = isCardCountered
			? newPlayerDeck
			: newPlayerDeck.update({
					cardsPlayedThisMatch: [
						...newPlayerDeck.cardsPlayedThisMatch,
						newCardPlayedThisMatch,
					] as readonly ShortCardWithTurn[],
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
