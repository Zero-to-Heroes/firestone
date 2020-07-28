import { GameFormat, GameType } from '@firestone-hs/reference-data';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { HeroCard } from '../../../models/decktracker/hero-card';
import { Metadata } from '../../../models/decktracker/metadata';
import { StatsRecap } from '../../../models/decktracker/stats-recap';
import { GameEvent } from '../../../models/game-event';
import { GameStat } from '../../../models/mainwindow/stats/game-stat';
import { StatGameFormatType } from '../../../models/mainwindow/stats/stat-game-format.type';
import { StatsState } from '../../../models/mainwindow/stats/stats-state';
import { PreferencesService } from '../../preferences.service';
import { DeckParserService } from '../deck-parser.service';
import { EventParser } from './event-parser';

export class MatchMetadataParser implements EventParser {
	constructor(
		private deckParser: DeckParserService,
		private prefs: PreferencesService,
		private allCards: AllCardsService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.MATCH_METADATA;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const stats: StatsState = gameEvent.additionalData?.stats;
		const format = gameEvent.additionalData.metaData.FormatType as number;
		const convertedFormat = MatchMetadataParser.convertFormat(format);

		const noDeckMode = (await this.prefs.getPreferences()).decktrackerNoDeckMode;
		if (noDeckMode) {
			console.log('[game-start-parser] no deck mode is active, not loading current deck');
		}
		console.log('[game-start-parser] will get current deck');
		// We don't always have a deckstring here, eg when we read the deck from memory
		const currentDeck = noDeckMode
			? undefined
			: await this.deckParser.getCurrentDeck(
					gameEvent.additionalData.metaData.GameType === GameType.GT_VS_AI,
					gameEvent.additionalData.metaData.ScenarioID,
			  );
		console.log(
			'[game-start-parser] init game with deck',
			currentDeck && currentDeck.deckstring,
			currentDeck && currentDeck.name,
			currentDeck,
		);

		const deckStats: readonly GameStat[] =
			!currentDeck.deckstring || !currentState.playerDeck?.deckstring || !stats?.gameStats
				? []
				: stats.gameStats.stats
						.filter(stat => stat.gameMode === 'ranked')
						.filter(
							stat =>
								stat.playerDecklist === currentState.playerDeck?.deckstring ||
								stat.playerDecklist === currentDeck.deckstring,
						)
						.filter(stat => stat.gameFormat === convertedFormat) || [];
		const statsRecap: StatsRecap = StatsRecap.from(deckStats, convertedFormat);
		console.log(
			'match metadata',
			deckStats,
			convertedFormat,
			format,
			currentState.playerDeck?.deckstring,
			currentDeck.deckstring,
			stats?.gameStats,
		);
		let matchupStatsRecap = currentState.matchupStatsRecap;
		if (currentState?.opponentDeck?.hero?.playerClass) {
			const statsAgainstOpponent = currentState.deckStats.filter(
				stat => stat.opponentClass === currentState?.opponentDeck?.hero.playerClass,
			);
			matchupStatsRecap = StatsRecap.from(
				statsAgainstOpponent,
				convertedFormat,
				currentState?.opponentDeck?.hero.playerClass,
			);
			console.log('opponent present', matchupStatsRecap, currentState);
		}
		const deckList: readonly DeckCard[] = await this.deckParser.postProcessDeck(
			this.deckParser.buildDeck(currentDeck),
		);
		// We always assume that, not knowing the decklist, the player and opponent decks have the same size
		const opponentDeck: readonly DeckCard[] = this.deckParser.buildEmptyDeckList(deckList.length);
		const hero: HeroCard = this.buildHero(currentDeck);

		return Object.assign(new GameState(), currentState, {
			metadata: {
				gameType: gameEvent.additionalData.metaData.GameType as number,
				formatType: format,
				scenarioId: gameEvent.additionalData.metaData.ScenarioID as number,
			} as Metadata,
			deckStats: deckStats,
			deckStatsRecap: statsRecap,
			matchupStatsRecap: matchupStatsRecap,
			playerDeck: currentState.playerDeck.update({
				deckstring: currentDeck ? currentDeck.deckstring : null,
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

	public static convertFormat(format: number): StatGameFormatType {
		if (format === GameFormat.FT_WILD) {
			return 'wild';
		} else if (format === GameFormat.FT_STANDARD) {
			return 'standard';
		} else {
			return 'unknown';
		}
	}

	private buildHero(currentDeck: any): HeroCard {
		if (!currentDeck || !currentDeck.deck || !currentDeck.deck.heroes || currentDeck.deck.heroes.length === 0) {
			return null;
		}
		return currentDeck.deck.heroes
			.map(hero => this.allCards.getCardFromDbfId(hero))
			.map(heroCard => {
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
			.map(heroCard =>
				Object.assign(new HeroCard(), {
					cardId: heroCard.id,
					name: heroCard.name,
				} as HeroCard),
			)[0];
	}
}
