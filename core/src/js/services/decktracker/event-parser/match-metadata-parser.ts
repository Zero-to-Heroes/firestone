import { formatFormat, GameType } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@services/cards-facade.service';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { HeroCard } from '../../../models/decktracker/hero-card';
import { Metadata } from '../../../models/decktracker/metadata';
import { StatsRecap } from '../../../models/decktracker/stats-recap';
import { GameEvent } from '../../../models/game-event';
import { MainWindowState } from '../../../models/mainwindow/main-window-state';
import { GameStat } from '../../../models/mainwindow/stats/game-stat';
import { PreferencesService } from '../../preferences.service';
import { DeckParserService } from '../deck-parser.service';
import { EventParser } from './event-parser';

export class MatchMetadataParser implements EventParser {
	constructor(
		private deckParser: DeckParserService,
		private prefs: PreferencesService,
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
		if (
			[GameType.GT_BATTLEGROUNDS, GameType.GT_BATTLEGROUNDS_FRIENDLY].includes(
				gameEvent.additionalData.metaData.GameType,
			)
		) {
			console.debug('[match-metadata-parser] BG game, not getting current deck');
			return Object.assign(new GameState(), currentState, {
				metadata: metaData,
			} as GameState);
		}

		const store: MainWindowState = gameEvent.additionalData.state;
		// const stats: StatsState = gameEvent.additionalData?.stats;
		const convertedFormat = formatFormat(format);

		const noDeckMode = (await this.prefs.getPreferences()).decktrackerNoDeckMode;
		if (noDeckMode) {
			console.log('[match-metadata-parser] no deck mode is active, not loading current deck');
		}
		console.log('[match-metadata-parser] will get current deck');
		// We don't always have a deckstring here, eg when we read the deck from memory
		// We always read the decklist, whatever the prefs are, so that we trigger the side effects
		// (yes, that's probably bad design here, especially seeing the bugs I tend to have on this area)
		const readDeck = await this.deckParser.getCurrentDeck(metaData.gameType === GameType.GT_VS_AI, metaData);
		const currentDeck = noDeckMode ? undefined : readDeck;
		const deckstringToUse = currentState.playerDeck?.deckstring || currentDeck?.deckstring;
		console.log(
			'[match-metadata-parser] init game with deck',
			deckstringToUse,
			currentDeck && currentDeck.deckstring,
			currentDeck && currentDeck.name,
		);

		const deckStats: readonly GameStat[] =
			!deckstringToUse || !store?.decktracker?.decks
				? []
				: store.decktracker.decks
						?.find((deck) => deck.deckstring === deckstringToUse)
						?.replays?.filter((stat) => stat.gameMode === 'ranked')
						?.filter((stat) => stat.gameFormat === convertedFormat) || [];
		const statsRecap: StatsRecap = StatsRecap.from(deckStats, convertedFormat);
		console.log('[match-metadata-parser] match metadata', convertedFormat, format, deckstringToUse);
		let matchupStatsRecap = currentState.matchupStatsRecap;
		if (currentState?.opponentDeck?.hero?.playerClass) {
			const statsAgainstOpponent = currentState.deckStats.filter(
				(stat) => stat.opponentClass === currentState?.opponentDeck?.hero.playerClass,
			);
			matchupStatsRecap = StatsRecap.from(
				statsAgainstOpponent,
				convertedFormat,
				currentState?.opponentDeck?.hero.playerClass,
			);
			console.log('[match-metadata-parser] opponent present', matchupStatsRecap, currentState);
		}
		// console.log('[match-metadata-parser] built stats for deck', statsRecap, matchupStatsRecap);
		const deckList: readonly DeckCard[] = await this.deckParser.postProcessDeck(
			this.deckParser.buildDeck(currentDeck),
		);
		const hero: HeroCard = this.buildHero(currentDeck);

		// We always assume that, not knowing the decklist, the player and opponent decks have the same size
		const opponentDeck: readonly DeckCard[] = this.deckParser.buildEmptyDeckList(deckList.length);

		return Object.assign(new GameState(), currentState, {
			metadata: metaData,
			deckStats: deckStats,
			deckStatsRecap: statsRecap,
			archetypesConfig: store.stats.archetypesConfig,
			archetypesStats: store.stats.archetypesStats,
			matchupStatsRecap: matchupStatsRecap,
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
