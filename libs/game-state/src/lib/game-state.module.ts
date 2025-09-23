import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedFrameworkCommonModule } from '@firestone/shared/framework/common';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { StatsDataAccessModule } from '@firestone/stats/data-access';
import { BootstrapGameStateService } from './services/_bootstrap-game-state.service';
import { DeckHandlerService } from './services/deck-handler.service';
import { DeckParserFacadeService } from './services/deck/deck-parser-facade.service';
import { DeckParserService } from './services/deck/deck-parser.service';
import { GameConnectionService } from './services/game-connection.service';
import { GameEventsFacadeService } from './services/game-events-facade.service';
import { GameEventsEmitterService } from './services/game-events/game-events-emitter.service';
import { GameStateFacadeService } from './services/game-state-facade.service';
import { GameUniqueIdService } from './services/game-unique-id.service';

const components = [];

@NgModule({
	imports: [CommonModule, SharedFrameworkCoreModule, SharedFrameworkCommonModule, StatsDataAccessModule],
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
	],
	declarations: components,
	exports: components,
})
export class GameStateModule {}
