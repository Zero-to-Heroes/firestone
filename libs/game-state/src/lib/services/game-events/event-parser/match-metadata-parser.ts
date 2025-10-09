import { GameType, isMercenaries } from '@firestone-hs/reference-data';
import { BgsBoardHighlighterService, BgsInGameWindowNavigationService } from '@firestone/battlegrounds/common';
import { MemoryInspectionService } from '@firestone/memory';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import {
	BattlegroundsState,
	BgsBattlesPanel,
	BgsFaceOffWithSimulation,
	BgsGame,
	BgsHeroSelectionOverviewPanel,
	BgsNextOpponentOverviewPanel,
	BgsPanel,
	BgsPlayer,
	BgsPostMatchStatsPanel,
	DeckCard,
	DeckSideboard,
	DeckState,
	HeroCard,
} from '../../../models/_barrel';
import { GameState } from '../../../models/game-state';
import { Metadata } from '../../../models/metadata';
import { DeckHandlerService } from '../../deck-handler.service';
import { ConstructedArchetypeServiceOrchestrator } from '../../deck/constructed-archetype-orchestrator.service';
import { DeckInfo, DeckParserService } from '../../deck/deck-parser.service';
import { GameEvent } from '../game-event';
import { EventParser } from './_event-parser';

export class MatchMetadataParser implements EventParser {
	constructor(
		private readonly deckParser: DeckParserService,
		private readonly prefs: PreferencesService,
		private readonly handler: DeckHandlerService,
		private readonly allCards: CardsFacadeService,
		private readonly memory: MemoryInspectionService,
		private readonly constructedArchetypes: ConstructedArchetypeServiceOrchestrator,
		private readonly nav: BgsInGameWindowNavigationService,
		private readonly highlighter: BgsBoardHighlighterService,
		private readonly i18n: ILocalizationService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		// Because Mercs is too weird, we don't want to have to take into account all the edge cases
		// in the standard game state.
		// Also, everything should be handled inside the MercenariesState anyway
		if (isMercenaries(gameEvent.additionalData.metaData.GameType)) {
			return currentState;
		}

		// All the meta data should already be in the existing state
		if (currentState.reconnectOngoing) {
			return currentState;
		}

		const format = gameEvent.additionalData.metaData.FormatType as number;
		const metaData = {
			gameType: gameEvent.additionalData.metaData.GameType as number,
			formatType: format,
			scenarioId: gameEvent.additionalData.metaData.ScenarioID as number,
		} as Metadata;
		const stateWithMetaData = currentState.update({
			metadata: metaData,
		} as GameState);

		const prefs = await this.prefs.getPreferences();

		if (stateWithMetaData.isBattlegrounds()) {
			console.debug('[match-metadata-parser] bgs game start', gameEvent, stateWithMetaData);
			this.nav.currentPanelId$$.next('bgs-hero-selection-overview');
			this.nav.forcedStatus$$.next(prefs.bgsShowHeroSelectionScreen ? 'open' : null);
			this.highlighter.resetHighlights();

			const newState = stateWithMetaData.update({
				bgState: stateWithMetaData.bgState.update({
					heroSelectionDone: false,
					postMatchStats: undefined,
					currentGame: new BgsGame(),
					panels: buildEmptyPanels(currentState.bgState, prefs, this.i18n),
				}),
			});

			return newState;
		} else if (stateWithMetaData.isMercenaries()) {
			return stateWithMetaData;
		}

		const noDeckMode = prefs.decktrackerNoDeckMode;
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
		const board = await this.memory.getCurrentBoard();
		const sideboards: readonly DeckSideboard[] = this.handler.buildSideboards(currentDeck?.deckstring!)!;
		const deckList: readonly DeckCard[] = await this.handler.postProcessDeck(
			this.buildDeck(currentDeck!, sideboards),
			board!,
		);
		const hero: HeroCard = this.buildHero(currentDeck);

		this.constructedArchetypes.triggerArchetypeCategorization(currentDeck?.deckstring!);

		// We always assume that, not knowing the decklist, the player and opponent decks have the same size
		const opponentDeck: readonly DeckCard[] = this.handler.buildEmptyDeckList(deckList.length);

		return stateWithMetaData.update({
			playerDeck: currentState.playerDeck.update({
				deckstring: deckstringToUse,
				name: currentDeck ? currentDeck.name : null,
				hero: hero,
				deckList: deckList,
				sideboards: sideboards,
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

	private buildDeck(currentDeck: DeckInfo, sideboards: readonly DeckSideboard[]): readonly DeckCard[] {
		if (currentDeck && currentDeck.deckstring) {
			return this.handler.buildDeckList(currentDeck.deckstring);
		}
		if (!currentDeck || !currentDeck.deck) {
			return [];
		}
		return (
			currentDeck.deck.cards
				// [dbfid, count] pair
				.map((pair) => this.buildDeckCards(pair, sideboards))
				.reduce((a, b) => a.concat(b), [])
				.sort((a: DeckCard, b: DeckCard) => a.refManaCost - b.refManaCost)
		);
	}

	private buildDeckCards(pair, sideboards: readonly DeckSideboard[]): DeckCard[] {
		return this.handler.buildDeckCards(pair, sideboards);
	}

	private buildHero(currentDeck: any): HeroCard {
		if (!currentDeck || !currentDeck.deck || !currentDeck.deck.heroes || currentDeck.deck.heroes.length === 0) {
			return HeroCard.create({});
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

const buildEmptyPanels = (
	currentState: BattlegroundsState,
	prefs: Preferences,
	i18n: ILocalizationService,
): readonly BgsPanel[] => {
	return [
		buildBgsHeroSelectionOverview(i18n),
		buildBgsNextOpponentOverviewPanel(i18n),
		buildPostMatchStatsPanel(currentState, prefs, i18n),
		buildBgsBattlesPanel(i18n),
	];
};

const buildBgsHeroSelectionOverview = (i18n: ILocalizationService): BgsHeroSelectionOverviewPanel => {
	return BgsHeroSelectionOverviewPanel.create({
		name: i18n.translateString('battlegrounds.menu.hero-selection'),
		heroOptions: [],
	});
};

const buildBgsNextOpponentOverviewPanel = (i18n: ILocalizationService): BgsNextOpponentOverviewPanel => {
	return BgsNextOpponentOverviewPanel.create({
		name: i18n.translateString('battlegrounds.menu.opponent'),
		opponentOverview: undefined,
	} as BgsNextOpponentOverviewPanel);
};

const buildBgsBattlesPanel = (i18n: ILocalizationService): BgsBattlesPanel => {
	return BgsBattlesPanel.create({
		name: i18n.translateString('battlegrounds.menu.simulator'),
		faceOffs: [] as readonly BgsFaceOffWithSimulation[],
	} as BgsBattlesPanel);
};

const buildPostMatchStatsPanel = (
	currentState: BattlegroundsState,
	prefs: Preferences,
	i18n: ILocalizationService,
): BgsPostMatchStatsPanel => {
	const player: BgsPlayer = currentState.currentGame?.getMainPlayer()!;
	return BgsPostMatchStatsPanel.create({
		name: i18n.translateString('battlegrounds.menu.live-stats'),
		stats: undefined,
		newBestUserStats: undefined,
		// globalStats: currentState.globalStats,
		player: player,
		tabs: ['hp-by-turn', 'winrate-per-turn', 'warband-total-stats-by-turn', 'warband-composition-by-turn'],
		// isComputing: false,
	});
};
