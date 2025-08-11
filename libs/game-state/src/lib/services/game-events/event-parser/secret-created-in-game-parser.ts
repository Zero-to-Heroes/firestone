import { CardsFacadeService } from '@firestone/shared/framework/core';
import { BoardSecret } from '../../../models/board-secret';
import { DeckCard } from '../../../models/deck-card';
import { DeckState } from '../../../models/deck-state';
import { GameState } from '../../../models/game-state';
import { addGuessInfoToCard, getProcessedCard } from '../../card-utils';
import { SecretConfigService } from '../../secrets/secret-config.service';
import { GameEvent } from '../game-event';
import { EventParser } from './_event-parser';
import { DeckManipulationHelper } from './deck-manipulation-helper';

export class SecretCreatedInGameParser implements EventParser {
	constructor(
		private readonly helper: DeckManipulationHelper,
		private readonly secretConfig: SecretConfigService,
		private readonly cards: CardsFacadeService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		const creatorCardId = gameEvent.additionalData ? gameEvent.additionalData.creatorCardId : null;

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const opponentDeck = isPlayer ? currentState.opponentDeck : currentState.playerDeck;
		const secretClass: string = gameEvent.additionalData.playerClass;

		const dbCard = getProcessedCard(cardId, entityId, deck, this.cards);
		const existingCard = deck.otherZone.find((c) => Math.abs(c.entityId) === entityId);
		// console.debug(
		// 	'[secret-created] existingCard',
		// 	existingCard,
		// 	entityId,
		// 	deck.otherZone.map((c) => c.entityId),
		// );
		const card = (
			existingCard ??
			DeckCard.create({
				cardId: cardId,
				entityId: entityId,
				cardName: dbCard.name,
				refManaCost: dbCard.cost,
				rarity: dbCard.rarity,
			} as DeckCard)
		).update({
			zone: 'SECRET',
			putIntoPlay: true,
			creatorCardId: creatorCardId,
			creatorEntityId: gameEvent.additionalData.creatorEntityId,
			temporaryCard: false,
		});

		const cardWithGuessedInfo = addGuessInfoToCard(
			card,
			creatorCardId,
			gameEvent.additionalData.creatorEntityId,
			deck,
			opponentDeck,
			currentState,
			this.cards,
		);
		// console.debug('[secret-created] card to add', card);
		const previousOtherZone = deck.otherZone;
		const newOtherZone: readonly DeckCard[] = !existingCard
			? this.helper.addSingleCardToOtherZone(deck.otherZone, cardWithGuessedInfo, this.cards)
			: this.helper.replaceCardInZone(previousOtherZone, cardWithGuessedInfo);
		// console.debug('[secret-created] newOtherZone', newOtherZone);
		const secretsConfig = await this.secretConfig.getValidSecrets(
			currentState.metadata,
			secretClass,
			currentState,
			cardWithGuessedInfo,
			creatorCardId,
			entityId,
		);
		const newPlayerDeck = Object.assign(new DeckState(), deck, {
			otherZone: newOtherZone,
			secrets: [...deck.secrets, BoardSecret.create(entityId, cardId, secretsConfig)] as readonly BoardSecret[],
		} as DeckState);
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.SECRET_CREATED_IN_GAME;
	}
}
