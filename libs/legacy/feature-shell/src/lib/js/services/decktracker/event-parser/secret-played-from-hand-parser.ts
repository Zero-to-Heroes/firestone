import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { BoardSecret } from '../../../models/decktracker/board-secret';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState, ShortCard } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { COUNTERSPELLS } from '../../hs-utils';
import { SecretConfigService } from '../secret-config.service';
import { rememberCardsInHand } from './card-played-from-hand-parser';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class SecretPlayedFromHandParser implements EventParser {
	constructor(
		private readonly helper: DeckManipulationHelper,
		private readonly secretConfig: SecretConfigService,
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

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const card = this.helper.findCardInZone(deck.hand, cardId, entityId);
		const secretClass: string = gameEvent.additionalData.playerClass;
		const creatorCardId = gameEvent.additionalData ? gameEvent.additionalData.creatorCardId : null;

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

		const newPlayerDeck = deck
			.update({
				hand: handAfterCardsRemembered,
				otherZone: newOtherZone,
				secrets: isCardCountered
					? deck.secrets
					: ([
							...deck.secrets,
							BoardSecret.create(
								entityId,
								cardId,
								this.secretConfig.getValidSecrets(
									currentState.metadata,
									secretClass,
									creatorCardId || card.creatorCardId,
								),
							),
					  ] as readonly BoardSecret[]),
				cardsPlayedThisTurn:
					isCardCountered || gameEvent.type === GameEvent.SECRET_PUT_IN_PLAY
						? deck.cardsPlayedThisTurn
						: ([...deck.cardsPlayedThisTurn, cardWithZone] as readonly DeckCard[]),
			})
			.updateSpellsPlayedThisMatch(
				isCardCountered || gameEvent.type === GameEvent.SECRET_PUT_IN_PLAY ? null : cardWithZone,
				this.allCards,
			);

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

		return currentState.update({
			[isPlayer ? 'playerDeck' : 'opponentDeck']: deckAfterSpecialCaseUpdate,
			cardsPlayedThisMatch: isCardCountered
				? currentState.cardsPlayedThisMatch
				: ([...currentState.cardsPlayedThisMatch, newCardPlayedThisMatch] as readonly ShortCard[]),
		});
	}

	event(): string {
		return GameEvent.SECRET_PLAYED;
	}
}
