import { GameType } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@services/cards-facade.service';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { HeroCard } from '../../../models/decktracker/hero-card';
import { Metadata } from '../../../models/decktracker/metadata';
import { GameEvent } from '../../../models/game-event';
import { PreferencesService } from '../../preferences.service';
import { DeckHandlerService } from '../deck-handler.service';
import { DeckInfo, DeckParserService } from '../deck-parser.service';
import { EventParser } from './event-parser';

export class MatchMetadataParser implements EventParser {
	constructor(
		private deckParser: DeckParserService,
		private prefs: PreferencesService,
		private handler: DeckHandlerService,
		private allCards: CardsFacadeService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.MATCH_METADATA;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const format = gameEvent.additionalData.metaData.FormatType as number;
		const metaData = {
			gameType: gameEvent.additionalData.metaData.GameType as number,
			formatType: format,
			scenarioId: gameEvent.additionalData.metaData.ScenarioID as number,
		} as Metadata;
		const stateWithMetaData = currentState.update({
			metadata: metaData,
		} as GameState);
		if (stateWithMetaData.isBattlegrounds()) {
			console.debug('[match-metadata-parser] BG game, not getting current deck');
			return stateWithMetaData;
		} else if (stateWithMetaData.isMercenaries()) {
			console.debug('[match-metadata-parser] Mercs game, not getting current deck');
			return stateWithMetaData;
		}

		const noDeckMode = (await this.prefs.getPreferences()).decktrackerNoDeckMode;
		if (noDeckMode) {
			console.log('[match-metadata-parser] no deck mode is active, not loading current deck');
		}
		console.log('[match-metadata-parser] will get current deck');
		// We don't always have a deckstring here, eg when we read the deck from memory
		// We always read the decklist, whatever the prefs are, so that we trigger the side effects
		// (yes, that's probably bad design here, especially seeing the bugs I tend to have on this area)
		const currentDeck = noDeckMode
			? undefined
			: await this.deckParser.retrieveCurrentDeck(metaData.gameType === GameType.GT_VS_AI, metaData);
		const deckstringToUse = stateWithMetaData.playerDeck?.deckstring || currentDeck?.deckstring;
		console.log(
			'[match-metadata-parser] init game with deck',
			deckstringToUse,
			currentDeck && currentDeck.deckstring,
			currentDeck && currentDeck.name,
		);

		console.log('[match-metadata-parser] match metadata', format, deckstringToUse);
		const deckList: readonly DeckCard[] = await this.handler.postProcessDeck(this.buildDeck(currentDeck));
		const hero: HeroCard = this.buildHero(currentDeck);

		// We always assume that, not knowing the decklist, the player and opponent decks have the same size
		const opponentDeck: readonly DeckCard[] = this.handler.buildEmptyDeckList(deckList.length);

		return stateWithMetaData.update({
			playerDeck: currentState.playerDeck.update({
				deckstring: deckstringToUse,
				name: currentDeck ? currentDeck.name : null,
				hero: hero,
				deckList: deckList,
				deck: deckList,
			} as DeckState),
			opponentDeck: currentState.opponentDeck.update({
				deck: opponentDeck,
			} as DeckState),
		} as GameState);
	}

	event(): string {
		return GameEvent.MATCH_METADATA;
	}

	private buildDeck(currentDeck: DeckInfo): readonly DeckCard[] {
		if (currentDeck && currentDeck.deckstring) {
			return this.handler.buildDeckList(currentDeck.deckstring);
		}
		if (!currentDeck || !currentDeck.deck) {
			return [];
		}
		return (
			currentDeck.deck.cards
				// [dbfid, count] pair
				.map((pair) => this.buildDeckCards(pair))
				.reduce((a, b) => a.concat(b), [])
				.sort((a: DeckCard, b: DeckCard) => a.manaCost - b.manaCost)
		);
	}

	private buildDeckCards(pair): DeckCard[] {
		return this.handler.buildDeckCards(pair);
	}

	private buildHero(currentDeck: any): HeroCard {
		if (!currentDeck || !currentDeck.deck || !currentDeck.deck.heroes || currentDeck.deck.heroes.length === 0) {
			return null;
		}
		return currentDeck.deck.heroes
			.map((hero) => this.allCards.getCardFromDbfId(+hero))
			.map((heroCard) => {
				if (!heroCard) {
					console.error(
						'could not map empty hero card',
						currentDeck.deck.heroes,
						currentDeck.deck,
						currentDeck,
					);
				}
				return heroCard;
			})
			.map((heroCard) =>
				Object.assign(new HeroCard(), {
					cardId: heroCard?.id,
					name: heroCard?.name,
				} as HeroCard),
			)[0];
	}
}
