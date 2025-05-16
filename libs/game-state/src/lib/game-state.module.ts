import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedCommonViewModule } from '@firestone/shared/common/view';
import { SharedFrameworkCommonModule } from '@firestone/shared/framework/common';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { StatsDataAccessModule } from '@firestone/stats/data-access';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { CounterWrapperComponent } from './counters/counter-wrapper.component';
import { CountersPositionerComponent } from './counters/counters-positioner.component';
import { GenericCountersV2Component } from './counters/generic-counter-v2.component';
import { GroupedCountersElementComponent } from './counters/grouped-counters-element.component';
import { GroupedCountersSideComponent } from './counters/grouped-counters-side.component';
import { GroupedCountersWrapperComponent } from './counters/grouped-counters-wrapper.component';
import { GroupedCountersComponent } from './counters/grouped-counters.component';
import { BootstrapGameStateService } from './services/_bootstrap-game-state.service';
import { DeckHandlerService } from './services/deck-handler.service';
import { GameConnectionService } from './services/game-connection.service';
import { GameEventsFacadeService } from './services/game-events-facade.service';
import { GameStateFacadeService } from './services/game-state-facade.service';
import { GameUniqueIdService } from './services/game-unique-id.service';

const components = [
	GenericCountersV2Component,
	CounterWrapperComponent,
	CountersPositionerComponent,
	GroupedCountersWrapperComponent,
	GroupedCountersComponent,
	GroupedCountersSideComponent,
	GroupedCountersElementComponent,
];

@NgModule({
	imports: [
		CommonModule,
		DragDropModule,

		InlineSVGModule.forRoot(),

		SharedFrameworkCoreModule,
		SharedFrameworkCommonModule,
		StatsDataAccessModule,
		SharedCommonViewModule,
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
