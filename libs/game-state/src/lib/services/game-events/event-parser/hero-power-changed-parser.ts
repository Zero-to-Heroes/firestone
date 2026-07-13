import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard } from '../../../models/deck-card';
import { GameState } from '../../../models/game-state';
import { getProcessedCard } from '../../card-utils';
import { GameEvent } from '../game-event';
import { EventParser } from './_event-parser';

export class HeroPowerChangedParser implements EventParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const dbCard = getProcessedCard(cardId, entityId, deck, this.allCards);
		const card = DeckCard.create({
			cardId: cardId,
			entityId: entityId,
			cardName: dbCard.name,
			refManaCost: dbCard.cost,
			rarity: dbCard.rarity,
			zone: 'PLAY',
			temporaryCard: false,
			playTiming: GameState.playTiming++,
		} as DeckCard);

		const additionalHeroPowerIndex = gameEvent.additionalData?.additionalHeroPowerIndex ?? 0;
		const deckUpdate =
			additionalHeroPowerIndex > 0
				? {
						additionalHeroPowers: this.upsertAdditionalHeroPower(deck.additionalHeroPowers, card),
					}
				: {
						heroPower: card,
					};

		const newPlayerDeck = deck.update(deckUpdate);
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	private upsertAdditionalHeroPower(additionalHeroPowers: readonly DeckCard[], card: DeckCard): readonly DeckCard[] {
		const withoutEntity = additionalHeroPowers.filter((heroPower) => heroPower.entityId !== card.entityId);
		return [...withoutEntity, card];
	}

	event(): string {
		return GameEvent.HERO_POWER_CHANGED;
	}
}
