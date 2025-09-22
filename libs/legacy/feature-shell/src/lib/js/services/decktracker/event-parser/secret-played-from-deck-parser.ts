import { CardType, GameTag } from '@firestone-hs/reference-data';
import { BoardSecret, DeckCard, DeckState, GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../../../../../../../app/common/src/lib/services/game-events/game-event';
import { SecretConfigService } from '../secret-config.service';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class SecretPlayedFromDeckParser implements EventParser {
	constructor(
		private readonly helper: DeckManipulationHelper,
		private readonly secretConfig: SecretConfigService,
		private readonly allCards: CardsFacadeService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const secretClass: string = gameEvent.additionalData.playerClass;
		const creatorCardId: string = gameEvent.additionalData.creatorCardId;

		const card = this.helper.findCardInZone(deck.deck, cardId, entityId);
		const previousDeck = deck.deck;
		const newDeck: readonly DeckCard[] = this.helper.removeSingleCardFromZone(
			previousDeck,
			cardId,
			entityId,
			deck.deckList.length === 0,
		)[0];
		const cardWithZone = card.update({
			zone: 'SECRET',
			creatorCardId: creatorCardId ?? card.creatorCardId,
			putIntoPlay: true,
			guessedInfo: {
				...card.guessedInfo,
			},
			tags: {
				...card.tags,
				[GameTag.SECRET]: 1,
				[GameTag.CARDTYPE]: CardType.SPELL,
			},
		});
		const newOtherZone: readonly DeckCard[] = this.helper.addSingleCardToOtherZone(
			deck.otherZone,
			cardWithZone,
			this.allCards,
		);
		const secretsConfig = await this.secretConfig.getValidSecrets(
			currentState.metadata,
			secretClass,
			currentState,
			creatorCardId,
			entityId,
		);
		const newPlayerDeck = Object.assign(new DeckState(), deck, {
			deck: newDeck,
			otherZone: newOtherZone,
			secrets: [...deck.secrets, BoardSecret.create(entityId, cardId, secretsConfig)] as readonly BoardSecret[],
		} as DeckState);
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.SECRET_PLAYED_FROM_DECK;
	}
}
