import { AllCardsService } from '@firestone-hs/replay-parser';
import { NGXLogger, NGXLoggerMock } from 'ngx-logger';
import { GameState } from '../../core/src/js/models/decktracker/game-state';
import { PlayerInfo } from '../../core/src/js/models/player-info';
import { AiDeckService } from '../../core/src/js/services/decktracker/ai-deck-service.service';
import { DeckCardService } from '../../core/src/js/services/decktracker/deck-card.service';
import { DeckParserService } from '../../core/src/js/services/decktracker/deck-parser.service';
import { DynamicZoneHelperService } from '../../core/src/js/services/decktracker/dynamic-zone-helper.service';
import { DeckManipulationHelper } from '../../core/src/js/services/decktracker/event-parser/deck-manipulation-helper';
import { SecretsParserService } from '../../core/src/js/services/decktracker/event-parser/secrets/secrets-parser.service';
import { GameStateMetaInfoService } from '../../core/src/js/services/decktracker/game-state-meta-info.service';
import { GameStateService } from '../../core/src/js/services/decktracker/game-state.service';
import { SecretConfigService } from '../../core/src/js/services/decktracker/secret-config.service';
import { ZoneOrderingService } from '../../core/src/js/services/decktracker/zone-ordering.service';
import { Events } from '../../core/src/js/services/events.service';
import { GameEventsEmitterService } from '../../core/src/js/services/game-events-emitter.service';
import { GameEvents } from '../../core/src/js/services/game-events.service';
import { PlayersInfoService } from '../../core/src/js/services/players-info.service';
import { GameEventsPluginService } from '../../core/src/js/services/plugins/game-events-plugin.service';
import { MemoryInspectionService } from '../../core/src/js/services/plugins/memory-inspection.service';
import { PreferencesService } from '../../core/src/js/services/preferences.service.js';
import cardsJson from '../../core/test/cards.json';

export const gameStateBuilder = async (
	pluginEvents,
	collaborators?: {
		deckstring?: string;
		playerRank?: number;
	},
): Promise<GameState> => {
	const cards = buildCardsService();

	// Setup events
	const events = new Events();
	const mockPlugin: GameEventsPluginService = {
		get: () => {
			return new Promise<any>(resolve => {
				resolve();
			});
		},
	} as GameEventsPluginService;

	// Player rank
	const memoryService: MemoryInspectionService = {
		getPlayerInfo: () => {
			return new Promise<any>(resolve => {
				resolve(
					collaborators && collaborators.playerRank
						? {
								localPlayer: {
									standardRank: collaborators.playerRank,
								} as PlayerInfo,
								opponent: {} as PlayerInfo,
						  }
						: {
								localPlayer: {} as PlayerInfo,
								opponent: {} as PlayerInfo,
						  },
				);
			});
		},
	} as MemoryInspectionService;
	const emitter = new GameEventsEmitterService();
	const playersInfoService = new PlayersInfoService(events, memoryService);

	// Deck
	const deckService = new DeckParserService(emitter, null, cards);
	deckService.currentDeck.deckstring = collaborators ? collaborators.deckstring : undefined;
	deckService.decodeDeckString();
	deckService['reset'] = () => {};

	// Prefs
	const prefs: PreferencesService = {
		getPreferences: () => ({}),
	} as PreferencesService;

	const helper = new DeckManipulationHelper(cards);

	// The game state
	const gameStateService = new GameStateService(
		emitter,
		events,
		new DynamicZoneHelperService(helper),
		new GameStateMetaInfoService(),
		new ZoneOrderingService(),
		cards,
		prefs,
		null,
		new DeckCardService(cards),
		null,
		new NGXLoggerMock() as NGXLogger,
		deckService,
		helper,
		{
			getAiDeck: (...args) => null,
		} as AiDeckService,
		({
			getValidSecrets: (...args) => [],
		} as unknown) as SecretConfigService,
		new SecretsParserService(helper, cards),
	);

	const gameEventsService = new GameEvents(
		mockPlugin,
		null,
		null,
		events,
		playersInfoService,
		emitter,
		deckService,
		prefs,
	);

	// Now process all the events
	for (const event of pluginEvents) {
		await gameEventsService.dispatchGameEvent(event);
		// BAAAD - but good enough for now. Gives time for events to be processed
		await sleep(1);
		// console.debug('dispatched event', event.Type);
	}

	// And retrieve the final game state
	return gameStateService.state;
};

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

function buildCardsService() {
	const service = new AllCardsService(null, null);
	service['allCards'] = [...(cardsJson as any[])];
	return service;
}
