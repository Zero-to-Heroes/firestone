import { CardIds, CardType, GameTag } from '@firestone-hs/reference-data';
import { BoardSecret, DeckCard, DeckState, GameState, ShortCard, ShortCardWithTurn } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../../models/game-event';
import { COUNTERSPELLS } from '../../hs-utils';
import { LocalizationFacadeService } from '../../localization-facade.service';
import { SecretConfigService } from '../secret-config.service';
import { rememberCardsInHand } from './card-played-from-hand-parser';
import { modifyDecksForSpecialCards } from './deck-contents-utils';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';
import { revealCard } from '../game-state/card-reveal';

export class SecretPlayedFromHandParser implements EventParser {
	constructor(
		private readonly helper: DeckManipulationHelper,
		private readonly secretConfig: SecretConfigService,
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
		const effectiveCost = gameEvent.additionalData.cost;

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const card = this.helper.findCardInZone(deck.hand, cardId, entityId);
		// console.debug('[secret-played-from-hand] card', entityId, cardId, card, deck.hand);
		const secretClass: string = gameEvent.additionalData.playerClass;
		const creatorCardId = gameEvent.additionalData ? gameEvent.additionalData.creatorCardId : null;

		const isCardCountered =
			((additionalInfo?.secretWillTrigger?.reactingToEntityId &&
				additionalInfo?.secretWillTrigger?.reactingToEntityId === entityId) ||
				(additionalInfo?.secretWillTrigger?.reactingToCardId &&
					additionalInfo?.secretWillTrigger?.reactingToCardId === cardId)) &&
			COUNTERSPELLS.includes(additionalInfo?.secretWillTrigger?.cardId as CardIds);

		const cardWithZone = card.update({
			zone: !isCardCountered ? 'SECRET' : 'SETASIDE',
			countered: isCardCountered,
			guessedInfo: {
				...card.guessedInfo,
			},
			tags: {
				...card.tags,
				[GameTag.SECRET]: 1,
				[GameTag.CARDTYPE]: CardType.SPELL,
			},
		});

		const knownCardId = cardWithZone.cardId || cardId;
		const newHand: readonly DeckCard[] = this.helper.removeSingleCardFromZone(deck.hand, knownCardId, entityId)[0];
		const handAfterCardsRemembered = rememberCardsInHand(
			knownCardId,
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

		// console.debug('getting valid secrets', card.cardName, card, creatorCardId, card.creatorCardId);
		const secretsConfig = await this.secretConfig.getValidSecrets(
			currentState.metadata,
			secretClass,
			currentState,
			card,
			creatorCardId || card.creatorCardId,
			card.creatorEntityId,
		);
		const newPlayerDeck = deck
			.update({
				hand: handAfterCardsRemembered,
				otherZone: newOtherZone,
				secrets: isCardCountered
					? deck.secrets
					: ([
							...deck.secrets,
							BoardSecret.create(entityId, knownCardId, secretsConfig),
						] as readonly BoardSecret[]),
				cardsPlayedThisTurn:
					isCardCountered || gameEvent.type === GameEvent.SECRET_PUT_IN_PLAY
						? deck.cardsPlayedThisTurn
						: ([...deck.cardsPlayedThisTurn, cardWithZone] as readonly DeckCard[]),
				cardsCounteredThisTurn: isCardCountered ? deck.cardsCounteredThisTurn + 1 : deck.cardsCounteredThisTurn,
			})
			.updateSpellsPlayedThisMatch(
				isCardCountered || gameEvent.type === GameEvent.SECRET_PUT_IN_PLAY ? null : cardWithZone,
				this.allCards,
				gameEvent.additionalData.cost,
				null,
			);

		const newCardPlayedThisMatch: ShortCardWithTurn = {
			entityId: cardWithZone.entityId,
			cardId: knownCardId,
			side: isPlayer ? 'player' : 'opponent',
			turn: +currentState.currentTurn,
			timestamp: new Date().getTime(),
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

		const [playerDeckAfterSpecialCaseUpdate, opponentDeckAfterSpecialCaseUpdate] = modifyDecksForSpecialCards(
			knownCardId,
			cardWithZone.entityId,
			isCardCountered,
			deckAfterSpecialCaseUpdate,
			!isPlayer ? currentState.playerDeck : currentState.opponentDeck,
			this.allCards,
			this.helper,
			this.i18n,
		);

		const playerDeckAfterReveal = isPlayer ? playerDeckAfterSpecialCaseUpdate : opponentDeckAfterSpecialCaseUpdate;
		const opponentDeckAfterReveal = isPlayer
			? opponentDeckAfterSpecialCaseUpdate
			: revealCard(playerDeckAfterSpecialCaseUpdate, cardWithZone, this.allCards);

		return currentState.update({
			playerDeck: playerDeckAfterReveal,
			opponentDeck: opponentDeckAfterReveal,
			cardsPlayedThisMatch: isCardCountered
				? currentState.cardsPlayedThisMatch
				: ([...currentState.cardsPlayedThisMatch, newCardPlayedThisMatch] as readonly ShortCard[]),
		});
	}

	event(): string {
		return GameEvent.SECRET_PLAYED;
	}
}
