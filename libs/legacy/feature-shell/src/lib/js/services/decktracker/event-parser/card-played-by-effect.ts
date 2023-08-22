import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { battlecryGlobalEffectCards, COUNTERSPELLS, globalEffectCards } from '../../hs-utils';
import { LocalizationFacadeService } from '../../localization-facade.service';
import { modifyDecksForSpecialCards } from './deck-contents-utils';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class CardPlayedByEffectParser implements EventParser {
	constructor(
		private readonly helper: DeckManipulationHelper,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
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

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const opponentDeck = !isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		const isCardCountered =
			((additionalInfo?.secretWillTrigger?.reactingToEntityId &&
				additionalInfo?.secretWillTrigger?.reactingToEntityId === entityId) ||
				(additionalInfo?.secretWillTrigger?.reactingToCardId &&
					additionalInfo?.secretWillTrigger?.reactingToCardId === cardId)) &&
			COUNTERSPELLS.includes(additionalInfo?.secretWillTrigger?.cardId as CardIds);

		// Only minions end up on the board
		const refCard = this.allCards.getCard(cardId);
		const isOnBoard = !isCardCountered && refCard && (refCard.type === 'Minion' || refCard.type === 'Location');
		const cardWithZone = DeckCard.create({
			entityId: entityId,
			cardId: cardId,
			cardName: this.i18n.getCardName(refCard?.id),
			manaCost: refCard?.cost,
			rarity: refCard?.rarity?.toLowerCase(),
			zone: isOnBoard ? 'PLAY' : null,
			temporaryCard: false,
			playTiming: isOnBoard ? GameState.playTiming++ : null,
			countered: isCardCountered,
			creatorCardId: gameEvent.additionalData.creatorCardId,
			putIntoPlay: true,
		} as DeckCard);
		//console.debug('card with zone', cardWithZone, refCard, cardId);
		// In the case of cards played by effect, the card is first revealed, then played. So we need to replace the
		// existing card to take the new info into account
		const newBoard: readonly DeckCard[] = isOnBoard
			? this.helper.empiricReplaceCardInZone(deck.board, cardWithZone, false)
			: deck.board;
		const newOtherZone: readonly DeckCard[] = isOnBoard
			? deck.otherZone
			: this.helper.empiricReplaceCardInZone(deck.otherZone, cardWithZone, false);

		let newGlobalEffects: readonly DeckCard[] = deck.globalEffects;
		if (
			!isCardCountered &&
			globalEffectCards.includes(cardId as CardIds) &&
			// Battlecries don't trigger in this case
			!battlecryGlobalEffectCards.includes(cardId as CardIds)
		) {
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
		const [playerDeckAfterSpecialCaseUpdate, opponentDeckAfterSpecialCaseUpdate] = isCardCountered
			? [newPlayerDeck, opponentDeck]
			: modifyDecksForSpecialCards(cardId, newPlayerDeck, opponentDeck, this.allCards, this.i18n);

		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: playerDeckAfterSpecialCaseUpdate,
			[!isPlayer ? 'playerDeck' : 'opponentDeck']: opponentDeckAfterSpecialCaseUpdate,
		});
	}

	event(): string {
		return GameEvent.CARD_PLAYED_BY_EFFECT;
	}
}
