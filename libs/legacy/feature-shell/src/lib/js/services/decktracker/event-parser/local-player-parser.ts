import { CardClass } from '@firestone-hs/reference-data';
import { DeckState, GameState, HeroCard } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../../models/game-event';
import { EventParser } from './event-parser';

export class LocalPlayerParser implements EventParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state && !!state.playerDeck;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const battleTag = gameEvent.localPlayer && gameEvent.localPlayer.Name;
		const playerName = battleTag && battleTag.indexOf('#') !== -1 ? battleTag.split('#')[0] : battleTag;
		const classes = this.allCards.getCard(gameEvent.localPlayer.CardID).classes;
		const newHero = Object.assign(new HeroCard(), currentState.playerDeck.hero, {
			playerName: playerName,
			classes: classes?.map((c) => CardClass[c]) ?? ([CardClass.NEUTRAL] as readonly CardClass[]),
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
