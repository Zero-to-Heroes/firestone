import { CardIds, CardType, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { BoardSecret } from '../../../models/board-secret';
import { DeckCard } from '../../../models/deck-card';
import { DeckState } from '../../../models/deck-state';
import { GameState, ShortCardWithTurn } from '../../../models/game-state';
import { COUNTERSPELLS } from '../../hs-utils';
import { SecretConfigService } from '../../secrets/secret-config.service';
import { revealCard } from '../card-reveal';
import { GameEvent } from '../game-event';
import { EventParser } from './_event-parser';
import { rememberCardsInHand } from './card-played-from-hand-parser';
import { modifyDecksForSpecialCards } from './deck-contents-utils';
import { DeckManipulationHelper } from './deck-manipulation-helper';

export class SecretPlayedFromHandParser implements EventParser {
	constructor(
		private readonly helper: DeckManipulationHelper,
		private readonly secretConfig: SecretConfigService,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: ILocalizationService,
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

		const isCardCountered: boolean = !!(
			((additionalInfo?.secretWillTrigger?.reactingToEntityId &&
				additionalInfo?.secretWillTrigger?.reactingToEntityId === entityId) ||
				(additionalInfo?.secretWillTrigger?.reactingToCardId &&
					additionalInfo?.secretWillTrigger?.reactingToCardId === cardId)) &&
			COUNTERSPELLS.includes(additionalInfo?.secretWillTrigger?.cardId as CardIds)
		);

		const cardWithZone = card!.update({
			zone: !isCardCountered ? 'SECRET' : 'SETASIDE',
			countered: isCardCountered,
			guessedInfo: {
				...card!.guessedInfo,
			},
			tags: {
				...card!.tags,
				[GameTag.SECRET]: 1,
				[GameTag.CARDTYPE]: CardType.SPELL,
			},
		});

		const knownCardId = cardWithZone.cardId || cardId;
		const newHand: readonly DeckCard[] = this.helper.removeSingleCardFromZone(deck.hand, knownCardId, entityId)[0];
		const handAfterCardsRemembered = rememberCardsInHand(
			knownCardId,
			isCardCountered,
			deck.update({ hand: newHand }),
			this.helper,
			this.allCards,
		);

		const newOtherZone: readonly DeckCard[] = this.helper.addSingleCardToOtherZone(
			deck.otherZone,
			isCardCountered && additionalInfo?.secretWillTrigger?.cardId === CardIds.OhMyYogg
				? // Since Yogg transforms the card
					cardWithZone.update({
						entityId: undefined,
					})
				: cardWithZone,
			this.allCards,
		);

		const knownRef = knownCardId ? this.allCards.getCard(knownCardId) : null;
		// Oh My Yogg: SECRET_PLAYED can carry the cast spell's CardId. Only treat the id as definitive
		// when reference data resolves to a real Secret card (mechanics). getCard() returns {} on miss;
		// do not use {} as a known secret. Passing a non-secret spell into getValidSecrets narrows the
		// pool via card-info-filters (cost / spell school) — often to a single wrong card.
		const isResolvedSecretCard =
			!!knownCardId &&
			!!knownRef?.id &&
			!!knownRef.mechanics?.includes(GameTag[GameTag.SECRET]);
		const cardForSecretPool = isResolvedSecretCard ? card : null;

		// console.debug('getting valid secrets', card.cardName, card, creatorCardId, card.creatorCardId);
		const secretsConfig = await this.secretConfig.getValidSecrets(
			currentState.metadata,
			secretClass,
			currentState,
			cardForSecretPool,
			creatorCardId || card?.creatorCardId,
			card?.creatorEntityId,
		);
		const boardSecretCardId = isResolvedSecretCard ? knownCardId : '';
		const newPlayerDeck = deck
			.update({
				hand: handAfterCardsRemembered,
				otherZone: newOtherZone,
				secrets: isCardCountered
					? deck.secrets
					: ([
							...deck.secrets,
							BoardSecret.create(entityId, boardSecretCardId, secretsConfig),
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

		const deckAfterSpecialCaseUpdate: DeckState =
			// Don't double-count
			isCardCountered ||
			newPlayerDeck.cardsPlayedThisMatch.some((c) => c.entityId === newCardPlayedThisMatch.entityId)
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
		});
	}

	event(): string {
		return GameEvent.SECRET_PLAYED;
	}
}
