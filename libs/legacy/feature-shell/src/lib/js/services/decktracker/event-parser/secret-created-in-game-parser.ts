import { BoardSecret, DeckCard, DeckState, GameState, getProcessedCard } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../../models/game-event';
import { LocalizationFacadeService } from '../../localization-facade.service';
import { SecretConfigService } from '../secret-config.service';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class SecretCreatedInGameParser implements EventParser {
	constructor(
		private readonly helper: DeckManipulationHelper,
		private readonly secretConfig: SecretConfigService,
		private readonly cards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		const creatorCardId = gameEvent.additionalData ? gameEvent.additionalData.creatorCardId : null;

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
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
		// console.debug('[secret-created] card to add', card);
		const previousOtherZone = deck.otherZone;
		const newOtherZone: readonly DeckCard[] = !existingCard
			? this.helper.addSingleCardToZone(previousOtherZone, card)
			: this.helper.replaceCardInZone(previousOtherZone, card);
		// console.debug('[secret-created] newOtherZone', newOtherZone);
		const secretsConfig = await this.secretConfig.getValidSecrets(
			currentState.metadata,
			secretClass,
			creatorCardId,
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
