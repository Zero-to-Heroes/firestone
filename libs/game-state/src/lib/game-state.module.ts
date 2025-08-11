import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { BattlegroundsCoreModule } from '@firestone/battlegrounds/core';
import { BattlegroundsDataAccessModule } from '@firestone/battlegrounds/data-access';
import { SharedFrameworkCommonModule } from '@firestone/shared/framework/common';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { StatsDataAccessModule } from '@firestone/stats/data-access';
import { GameEventsPluginService } from './logs/game-events-plugin.service';
import { BootstrapGameStateService } from './services/_bootstrap-game-state.service';
import { BgsBestUserStatsService } from './services/battlegrounds/bgs-best-user-stats.service';
import { DeckHandlerService } from './services/deck-handler.service';
import { AiDeckService } from './services/deck/ai-deck-service.service';
import { ConstructedArchetypeServiceOrchestrator } from './services/deck/constructed-archetype-orchestrator.service';
import { ConstructedArchetypeService } from './services/deck/constructed-archetype.service';
import { DeckParserFacadeService } from './services/deck/deck-parser-facade.service';
import { DeckParserService } from './services/deck/deck-parser.service';
import { GameConnectionService } from './services/game-connection.service';
import { GameEventsFacadeService } from './services/game-events-facade.service';
import { DeckManipulationHelper } from './services/game-events/event-parser/deck-manipulation-helper';
import { SecretsParserService } from './services/game-events/event-parser/secrets/secrets-parser.service';
import { GameEventsEmitterService } from './services/game-events/game-events-emitter.service';
import { GameEvents } from './services/game-events/game-events.service';
import { GameStateParsersService } from './services/game-events/state-parsers.service';
import { GameModeDataService } from './services/game-mode-data.service';
import { GameStateFacadeService } from './services/game-state-facade.service';
import { GameUniqueIdService } from './services/game-unique-id.service';
import { OverlayDisplayService } from './services/overlay-display.service';
import { RealTimeStatsParsersService } from './services/real-time-stats/real-time-stats-parsers.service';
import { RealTimeStatsService } from './services/real-time-stats/real-time-stats.service';
import { ReviewIdService } from './services/review-id.service';

const components = [];

@NgModule({
	imports: [
		CommonModule,
		SharedFrameworkCoreModule,
		SharedFrameworkCommonModule,
		StatsDataAccessModule,
		BattlegroundsCoreModule,
		BattlegroundsDataAccessModule,
	],
	providers: [
		BootstrapGameStateService,
		GameStateFacadeService,
		GameUniqueIdService,
		GameConnectionService,
		GameEventsFacadeService,
		DeckHandlerService,
		DeckParserService,
		DeckParserFacadeService,
		GameEventsEmitterService,
		OverlayDisplayService,
		BgsBestUserStatsService,
		RealTimeStatsParsersService,
		RealTimeStatsService,
		GameEventsPluginService,
		ConstructedArchetypeService,
		ConstructedArchetypeServiceOrchestrator,
		GameModeDataService,
		AiDeckService,
		DeckManipulationHelper,
		GameEvents,
		ReviewIdService,
		SecretsParserService,
		GameStateParsersService,
	],
	declarations: components,
	exports: components,
})
export class GameStateModule {}
