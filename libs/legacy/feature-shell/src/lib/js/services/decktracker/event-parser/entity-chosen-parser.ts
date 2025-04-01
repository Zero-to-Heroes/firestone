import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { DeckCard, GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../../models/game-event';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

const CARDS_THAT_PUT_ON_TOP = [
	CardIds.SightlessWatcher,
	CardIds.SightlessWatcherLegacy,
	CardIds.FindTheImposter_SpyOMaticToken,
	CardIds.DraconicHerald,
	CardIds.TimewayWanderer,
];

export class EntityChosenParser implements EventParser {
	constructor(private readonly helper: DeckManipulationHelper, private readonly allCards: CardsFacadeService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		const originCardId = gameEvent.additionalData?.context?.creatorCardId;
		const isDiscover = !!this.allCards.getCard(originCardId)?.mechanics?.includes(GameTag[GameTag.DISCOVER]);
		// console.debug('[entity-chosen] isDiscover', isDiscover, originCardId, gameEvent);

		let stateAfterDiscover = currentState;
		if (isDiscover) {
			const isPlayer = controllerId === localPlayer.PlayerId;
			const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
			stateAfterDiscover = stateAfterDiscover.update({
				[isPlayer ? 'playerDeck' : 'opponentDeck']: deck.update({
					discoversThisGame: deck.discoversThisGame + 1,
				}),
			});
			// console.debug('[entity-chosen] stateAfterDiscover', stateAfterDiscover);
		}

		const newState = this.handleEvent(stateAfterDiscover, gameEvent);
		return newState.update({
			playerDeck: newState.playerDeck.update({
				currentOptions: [],
			}),
			opponentDeck: newState.opponentDeck.update({
				currentOptions: [],
			}),
		});
	}

	private handleEvent(currentState: GameState, gameEvent: GameEvent): GameState {
		const originCreatorCardId = gameEvent.additionalData?.context?.creatorCardId;
		if (CARDS_THAT_PUT_ON_TOP.includes(originCreatorCardId)) {
			return this.handleCardOnTop(currentState, gameEvent);
		} else if (originCreatorCardId === CardIds.NellieTheGreatThresher) {
			// console.debug('handling nellie pirate crew');
			return this.handleNelliePirateCrew(currentState, gameEvent);
		} else if (
			originCreatorCardId === CardIds.SphereOfSapience &&
			gameEvent.cardId === CardIds.SphereOfSapience_ANewFateToken
		) {
			// console.debug('handling nellie pirate crew');
			return this.handleSphereOfSapience(currentState, gameEvent);
		}
		return currentState;
	}

	private handleSphereOfSapience(currentState: GameState, gameEvent: GameEvent): GameState {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		// console.debug('drawing from deck', cardId, gameEvent);
		const isPlayer = controllerId === localPlayer.PlayerId;
		if (!isPlayer) {
			return currentState;
		}

		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const otherOption = deck.currentOptions.find((o) => o.cardId !== CardIds.SphereOfSapience_ANewFateToken);
		const candidateCards = deck.deck.filter((c) => c.cardId === otherOption.cardId);
		console.debug('[sphere-of-sapience] candidateCards', candidateCards);
		const card = candidateCards.find((c) => c.positionFromTop != null) || candidateCards[0];
		console.debug('[sphere-of-sapience] card', card);
		const newDeck = deck.deck.filter((c) => c !== card);
		console.debug('[sphere-of-sapience] newDeck', newDeck);
		const newCard = card.update({
			positionFromTop: undefined,
			positionFromBottom: DeckCard.deckIndexFromBottom++,
		});
		console.debug('[sphere-of-sapience] newCard', newCard);
		const finalDeck = this.helper.addSingleCardToZone(newDeck, newCard);
		console.debug('[sphere-of-sapience] finalDeck', finalDeck);
		return currentState.update({
			playerDeck: deck.update({
				deck: finalDeck,
			}),
		});
	}

	private handleNelliePirateCrew(currentState: GameState, gameEvent: GameEvent): GameState {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		// console.debug('deck', deck, isPlayer);
		// TODO: probably won't work if there are two pirates ships on the board at the same time
		const pirateShipEntity = this.helper.findCardInZone(
			deck.board,
			CardIds.NellieTheGreatThresher_NelliesPirateShipToken,
			null,
		);
		// console.debug('pirateShipEntity', pirateShipEntity);
		const updatedShip = pirateShipEntity.update({
			relatedCardIds: [...pirateShipEntity.relatedCardIds, cardId],
		});
		// console.debug('updatedShip', updatedShip);
		const updatedBoard = this.helper.empiricReplaceCardInZone(deck.board, updatedShip, false);
		// console.debug('updatedBoard', updatedBoard);
		const newPlayerDeck = deck.update({
			board: updatedBoard,
		});
		// console.debug('newPlayerDeck', newPlayerDeck);
		return currentState.update({
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	private handleCardOnTop(currentState: GameState, gameEvent: GameEvent): GameState {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		const isPlayer =
			gameEvent.additionalData?.context?.creatorCardId === CardIds.FindTheImposter_SpyOMaticToken
				? controllerId !== localPlayer.PlayerId
				: controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		const cardInDeck = this.helper.findCardInZone(deck.deck, cardId, gameEvent.additionalData?.originalEntityId);
		if (!cardInDeck) {
			// console.debug(
			// 	'[entity-chosen] card not found in deck',
			// 	cardId,
			// 	gameEvent.additionalData?.originalEntityId,
			// 	deck.deck,
			// );
			return currentState;
		}

		const newCard = cardInDeck.update({
			positionFromTop: 0,
		});

		const newDeck: readonly DeckCard[] = this.helper.empiricReplaceCardInZone(
			deck.deck,
			newCard,
			deck.deckList.length === 0,
		);

		const newPlayerDeck = deck.update({
			deck: newDeck,
		});

		return currentState.update({
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.ENTITY_CHOSEN;
	}
}
