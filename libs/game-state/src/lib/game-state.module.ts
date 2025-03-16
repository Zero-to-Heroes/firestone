import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedCommonViewModule } from '@firestone/shared/common/view';
import { SharedFrameworkCommonModule } from '@firestone/shared/framework/common';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { StatsDataAccessModule } from '@firestone/stats/data-access';
import { CounterWrapperComponent } from './counters/counter-wrapper.component';
import { CountersPositionerComponent } from './counters/counters-positioner.component';
import { GenericCountersV2Component } from './counters/generic-counter-v2.component';
import { BootstrapGameStateService } from './services/_bootstrap-game-state.service';
import { DeckHandlerService } from './services/deck-handler.service';
import { GameEventsFacadeService } from './services/game-events-facade.service';
import { GameStateFacadeService } from './services/game-state-facade.service';
import { GameStateUpdatesService } from './services/game-state-updates.service';
import { GameUniqueIdService } from './services/game-unique-id.service';

const components = [GenericCountersV2Component, CounterWrapperComponent, CountersPositionerComponent];

@NgModule({
	imports: [
		CommonModule,
		DragDropModule,

		SharedFrameworkCoreModule,
		SharedFrameworkCommonModule,
		StatsDataAccessModule,
		SharedCommonViewModule,
	],
	providers: [
		BootstrapGameStateService,
		GameStateUpdatesService,
		GameStateFacadeService,
		GameUniqueIdService,
		GameEventsFacadeService,
		DeckHandlerService,
	],
	declarations: components,
	exports: components,
})
export class GameStateModule {}
