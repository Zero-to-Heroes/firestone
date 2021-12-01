import { CardsFacadeService } from '@services/cards-facade.service';
import { BoardSecret } from '../../../models/decktracker/board-secret';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { SecretConfigService } from '../secret-config.service';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class SecretCreatedInGameParser implements EventParser {
	constructor(
		private readonly helper: DeckManipulationHelper,
		private readonly secretConfig: SecretConfigService,
		private readonly cards: CardsFacadeService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.SECRET_CREATED_IN_GAME;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		const creatorCardId = gameEvent.additionalData ? gameEvent.additionalData.creatorCardId : null;

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const secretClass: string = gameEvent.additionalData.playerClass;

		const dbCard = this.cards.getCard(cardId);
		const card = DeckCard.create({
			cardId: cardId,
			entityId: entityId,
			cardName: dbCard.name,
			manaCost: dbCard.cost,
			rarity: dbCard.rarity,
			creatorCardId: creatorCardId,
			zone: 'SECRET',
		} as DeckCard);
		const previousOtherZone = deck.otherZone;
		const newOtherZone: readonly DeckCard[] = this.helper.addSingleCardToZone(previousOtherZone, card);
		const newPlayerDeck = Object.assign(new DeckState(), deck, {
			otherZone: newOtherZone,
			secrets: [
				...deck.secrets,
				BoardSecret.create(
					entityId,
					cardId,
					this.secretConfig.getValidSecrets(currentState.metadata, secretClass, creatorCardId),
				),
			] as readonly BoardSecret[],
		} as DeckState);
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.SECRET_CREATED_IN_GAME;
	}
}
