import { CardIds, CardType, GameTag } from '@firestone-hs/reference-data';
import { DeckCard, DeckState, GameState, toTagsObject } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../../models/game-event';
import {
	COUNTERSPELLS,
	battlecryGlobalEffectCards,
	deathrattleGlobalEffectCards,
	globalEffectCards,
} from '../../hs-utils';
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
		const creatorCardId = gameEvent.additionalData.creatorCardId;

		// Hack to avoid showing the the "choose one" options, which sometimes cause a "card-play-by-effect" event
		// to be triggered
		if (this.allCards.getCard(creatorCardId)?.mechanics?.includes(GameTag[GameTag.CHOOSE_ONE])) {
			return currentState;
		}
		const refCard = this.allCards.getCard(cardId);
		// Weapons trigger a WEAPON_EQUIPPED event
		if (refCard.type?.toUpperCase() === CardType[CardType.WEAPON]) {
			return currentState;
		}

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
		const isOnBoard =
			!isCardCountered &&
			// Because CASTS_WHEN_DRAWN cards create another card on the board
			!gameEvent.additionalData.castWhenDrawn &&
			refCard &&
			(refCard.type === 'Minion' || refCard.type === 'Location');
		// Some of these cards can come from hand, when the event is triggered by "casts when drawn" effects
		const cardFromHand = deck.hand.find((card) => card.entityId === entityId);
		// console.debug('card from hand', cardFromHand, deck.hand, cardId, entityId, gameEvent, currentState);
		let newHand = deck.hand;
		if (!!cardFromHand) {
			newHand = this.helper.removeSingleCardFromZone(deck.hand, cardFromHand.cardId, cardFromHand.entityId)?.[0];
		}
		const cardWithZone = DeckCard.create({
			entityId: entityId,
			cardId: cardId,
			cardName: refCard?.name,
			refManaCost: refCard?.cost,
			rarity: refCard?.rarity?.toLowerCase(),
			zone: isOnBoard ? 'PLAY' : null,
			temporaryCard: false,
			playTiming: isOnBoard ? GameState.playTiming++ : null,
			countered: isCardCountered,
			creatorCardId: creatorCardId,
			creatorEntityId: gameEvent.additionalData.creatorEntityId,
			putIntoPlay: true,
			tags: gameEvent.additionalData.tags ? toTagsObject(gameEvent.additionalData.tags) : {},
		} as DeckCard);
		//console.debug('card with zone', cardWithZone, refCard, cardId);
		// In the case of cards played by effect, the card is first revealed, then played. So we need to replace the
		// existing card to take the new info into account
		const newBoard: readonly DeckCard[] = isOnBoard
			? this.helper.empiricReplaceCardInZone(deck.board, cardWithZone, false)
			: deck.board;
		const newOtherZone: readonly DeckCard[] = isOnBoard
			? deck.otherZone
			: this.helper.empiricReplaceCardInOtherZone(deck.otherZone, cardWithZone, false, this.allCards);

		let newGlobalEffects: readonly DeckCard[] = deck.globalEffects;
		if (
			!isCardCountered &&
			globalEffectCards.includes(cardId as CardIds) &&
			// Battlecries don't trigger in this case
			!battlecryGlobalEffectCards.includes(cardId as CardIds) &&
			!deathrattleGlobalEffectCards.includes(cardId as CardIds)
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
			hand: newHand,
			board: newBoard,
			otherZone: newOtherZone,
			globalEffects: newGlobalEffects,
		} as DeckState);
		//console.debug('is card countered?', isCardCountered, secretWillTrigger, cardId);
		const [playerDeckAfterSpecialCaseUpdate, opponentDeckAfterSpecialCaseUpdate] = modifyDecksForSpecialCards(
			cardId,
			entityId,
			isCardCountered,
			newPlayerDeck,
			opponentDeck,
			this.allCards,
			this.helper,
			this.i18n,
		);

		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: playerDeckAfterSpecialCaseUpdate,
			[!isPlayer ? 'playerDeck' : 'opponentDeck']: opponentDeckAfterSpecialCaseUpdate,
		});
	}

	event(): string {
		return GameEvent.CARD_PLAYED_BY_EFFECT;
	}
}
