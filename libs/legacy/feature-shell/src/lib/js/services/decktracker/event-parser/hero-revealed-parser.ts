import { CardClass } from '@firestone-hs/reference-data';
import { GameState, HeroCard } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../../models/game-event';
import { EventParser } from './event-parser';

export class HeroRevealedParser implements EventParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		const health = gameEvent.additionalData.health;

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		const existingHero = deck.hero ?? HeroCard.create({});
		const dbCard = this.allCards.getCard(cardId);
		const newHero = existingHero.update({
			cardId: cardId,
			entityId: entityId,
			maxHealth: health,
			initialClasses: existingHero.initialClasses ?? existingHero.classes ?? [],
			classes: dbCard.classes?.length > 1 ? existingHero.classes : dbCard.classes?.map((c) => CardClass[c]),
		});
		const newPlayerDeck = deck.update({
			hero: newHero,
		});
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.HERO_REVEALED;
	}
}
