import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { HeroCard } from '../../../models/decktracker/hero-card';
import { GameEvent } from '../../../models/game-event';
import { EventParser } from './event-parser';

export class LocalPlayerParser implements EventParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && state.playerDeck && gameEvent.type === GameEvent.LOCAL_PLAYER;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const battleTag = gameEvent.localPlayer && gameEvent.localPlayer.Name;
		const playerName = battleTag && battleTag.indexOf('#') !== -1 ? battleTag.split('#')[0] : battleTag;
		const playerClass = this.allCards.getCard(gameEvent.localPlayer.CardID).playerClass;
		const newHero = Object.assign(new HeroCard(), currentState.playerDeck.hero, {
			playerName: playerName,
			playerClass: playerClass ? playerClass.toLowerCase() : null,
		} as HeroCard);
		const newPlayerDeck = Object.assign(new DeckState(), currentState.playerDeck, {
			hero: newHero,
		} as DeckState);
		return Object.assign(new GameState(), currentState, {
			playerDeck: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.LOCAL_PLAYER;
	}
}
