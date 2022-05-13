import { CardIds } from '@firestone-hs/reference-data';
import { DeckCard } from '@models/decktracker/deck-card';
import { DeckState } from '@models/decktracker/deck-state';
import { GameState } from '@models/decktracker/game-state';
import { GameEvent } from '@models/game-event';
import { DeckManipulationHelper } from '@services/decktracker/event-parser/deck-manipulation-helper';
import { EventParser } from '../event-parser';

export class SphereOfSapienceParser implements EventParser {
	// We need both because of how the parser handles incomplete BLOCK logs
	// They could come in whatever order
	private lastSpecialPowerEvent: GameEvent;
	private lastEntityChosenEvent: GameEvent;

	constructor(private readonly helper: DeckManipulationHelper) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		// Handling the special cases depend on a lot of different events
		return (
			state &&
			[GameEvent.SPECIAL_CARD_POWER_TRIGGERED, GameEvent.ENTITY_CHOSEN, GameEvent.CARD_DRAW_FROM_DECK].includes(
				gameEvent.type,
			)
		);
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

		if (gameEvent.type === GameEvent.CARD_DRAW_FROM_DECK) {
			this.lastSpecialPowerEvent = null;
			this.lastEntityChosenEvent = null;
			return currentState;
		}

		if (gameEvent.type === GameEvent.SPECIAL_CARD_POWER_TRIGGERED) {
			if (CardIds.SphereOfSapience === cardId) {
				this.lastSpecialPowerEvent = gameEvent;
				// If it's not the active player, we don't know what they did, so we just reset the top/bottom states
				if (!isPlayer) {
					return currentState.update({
						[isPlayer ? 'playerDeck' : 'opponentDeck']: deck.update({
							deck: deck.deck.map((card) =>
								card.update({
									positionFromBottom: undefined,
									positionFromTop: undefined,
								}),
							),
						}),
					});
				}
			}
		}
		if (gameEvent.type === GameEvent.ENTITY_CHOSEN) {
			this.lastEntityChosenEvent = gameEvent;
		}

		// We don't have enough info for processing yet
		if (!this.lastEntityChosenEvent || !this.lastSpecialPowerEvent) {
			return currentState;
		}

		// Right now we know we're processing Sphere of Sapience
		if (!isPlayer) {
			// Handled as soon as the SPECIAL_CARD_POWER_TRIGGERED event is received
			return currentState;
		}

		const newDeck = this.handleSphereOfSapience(deck);
		return currentState.update({
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newDeck,
		});
	}

	private handleSphereOfSapience(deck: DeckState): DeckState {
		// Card was put to the bottom
		if (this.lastEntityChosenEvent.cardId === CardIds.SphereOfSapience_ANewFateToken) {
			// Find out what the other card was
			const relatedCards: readonly { EntityId: number; CardId: string; OriginalEntityId: number }[] =
				this.lastSpecialPowerEvent.additionalData?.relatedCards ?? [];
			const otherCard = relatedCards.find(
				(relatedCard) => relatedCard.CardId !== this.lastEntityChosenEvent.cardId,
			);
			if (otherCard) {
				const originalEntityId = otherCard.OriginalEntityId === -1 ? null : otherCard.OriginalEntityId;
				const cardInDeck = this.helper.findCardInZone(deck.deck, otherCard.CardId, originalEntityId);
				const updatedCard = cardInDeck.update({
					positionFromBottom: DeckCard.deckIndexFromBottom++,
				});
				const newDeck = this.helper.empiricReplaceCardInZone(deck.deck, updatedCard, true);
				return deck.update({
					deck: newDeck,
				});
			}
		}
		return deck;
	}

	event(): string {
		return 'SphereOfSapienceParser';
	}
}
