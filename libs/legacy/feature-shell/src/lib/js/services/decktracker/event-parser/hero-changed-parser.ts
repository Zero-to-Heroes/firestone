import { CardClass } from '@firestone-hs/reference-data';
import { GameEvent, GameState, getProcessedCard } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { EventParser } from './_event-parser';

export class HeroChangedParser implements EventParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const dbCard = getProcessedCard(cardId, entityId, deck, this.allCards);
		const newHero = deck.hero?.update({
			cardId: cardId,
			initialClasses: !!deck.hero.initialClasses?.length
				? deck.hero.initialClasses
				: !!deck.hero.classes?.length
					? deck.hero.classes
					: [],
			classes: dbCard.classes?.map((c) => CardClass[c]),
		});

		const newPlayerDeck = deck.update({
			hero: newHero,
		});
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.HERO_CHANGED;
	}
}
