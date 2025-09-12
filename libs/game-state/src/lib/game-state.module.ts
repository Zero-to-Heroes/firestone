import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedFrameworkCommonModule } from '@firestone/shared/framework/common';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { StatsDataAccessModule } from '@firestone/stats/data-access';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { BootstrapGameStateService } from './services/_bootstrap-game-state.service';
import { DeckHandlerService } from './services/deck-handler.service';
import { GameConnectionService } from './services/game-connection.service';
import { GameEventsFacadeService } from './services/game-events-facade.service';
import { GameStateFacadeService } from './services/game-state-facade.service';
import { GameUniqueIdService } from './services/game-unique-id.service';

const components = [];

@NgModule({
	imports: [
		CommonModule,
		DragDropModule,

		InlineSVGModule,

		SharedFrameworkCoreModule,
		SharedFrameworkCommonModule,
		StatsDataAccessModule,
	],
	providers: [
		BootstrapGameStateService,
		GameStateFacadeService,
		GameUniqueIdService,
		GameConnectionService,
		GameEventsFacadeService,
		DeckHandlerService,
	],
	declarations: components,
	exports: components,
})
export class GameStateModule {}
