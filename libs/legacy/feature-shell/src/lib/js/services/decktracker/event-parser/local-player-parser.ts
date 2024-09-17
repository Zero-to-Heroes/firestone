import { buildRegion } from '@firestone-hs/hs-replay-xml-parser';
import { CardClass } from '@firestone-hs/reference-data';
import { DeckHandlerService, GameState, HeroCard } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../../models/game-event';
import { DeckParserService } from '../deck-parser.service';
import { DeckstringOverrideEvent } from '../event/deckstring-override-event';
import { DeckstringOverrideParser } from './deckstring-override-parser';
import { EventParser } from './event-parser';

export class LocalPlayerParser implements EventParser {
	constructor(
		private readonly allCards: CardsFacadeService,
		private readonly deckParser: DeckParserService,
		private readonly handler: DeckHandlerService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state && !!state.playerDeck;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const battleTag = gameEvent.localPlayer && gameEvent.localPlayer.Name;
		const region = buildRegion(gameEvent.localPlayer.AccountHi);
		const playerName = battleTag && battleTag.indexOf('#') !== -1 ? battleTag.split('#')[0] : battleTag;
		const heroCard = this.allCards.getCard(gameEvent.localPlayer.CardID);
		const classes = heroCard.classes;
		const newHero = Object.assign(new HeroCard(), currentState.playerDeck.hero, {
			playerName: playerName,
			cardId: heroCard.id,
			classes: classes?.map((c) => CardClass[c]) ?? ([CardClass.NEUTRAL] as readonly CardClass[]),
		} as HeroCard);
		let newCurrentState = currentState;
		if (!currentState.playerDeck.deckstring) {
			const newString = await this.deckParser.getOpenDecklist(newHero.cardId, currentState.metadata);
			if (!!newString) {
				newCurrentState = await new DeckstringOverrideParser(this.handler).parse(
					currentState,
					new DeckstringOverrideEvent(currentState.playerDeck.name, newString, 'player'),
				);
			}
		}
		const newPlayerDeck = newCurrentState.playerDeck.update({
			hero: newHero,
		});
		return newCurrentState.update({
			playerDeck: newPlayerDeck,
			region: region,
		});
	}

	event(): string {
		return GameEvent.LOCAL_PLAYER;
	}
}
