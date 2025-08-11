import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { GameStateModule } from '@firestone/game-state';
import { SharedCommonViewModule } from '@firestone/shared/common/view';
import { SharedFrameworkCommonModule } from '@firestone/shared/framework/common';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { StatsDataAccessModule } from '@firestone/stats/data-access';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { MarkdownModule } from 'ngx-markdown';
import { NewVersionNotificationComponent } from './components/new-version-notification.component';
import { CheckOffCardsListComponent } from './counters/check-off-cards-list.component';
import { CounterWrapperComponent } from './counters/counter-wrapper.component';
import { CountersPositionerComponent } from './counters/counters-positioner.component';
import { GenericCountersV2Component } from './counters/generic-counter-v2.component';
import { GroupedCountersElementComponent } from './counters/grouped-counters-element.component';
import { GroupedCountersSideComponent } from './counters/grouped-counters-side.component';
import { GroupedCountersWrapperComponent } from './counters/grouped-counters-wrapper.component';
import { GroupedCountersComponent } from './counters/grouped-counters.component';
import { PremiumDesktopComponent } from './premium/premium-desktop.component';
import { PremiumPackageComponent } from './premium/premium-package.component';

const components = [
	GenericCountersV2Component,
	CounterWrapperComponent,
	CountersPositionerComponent,
	GroupedCountersWrapperComponent,
	GroupedCountersComponent,
	GroupedCountersSideComponent,
	GroupedCountersElementComponent,
	CheckOffCardsListComponent,
	NewVersionNotificationComponent,
	PremiumDesktopComponent,
	PremiumPackageComponent,
];

@NgModule({
	imports: [
		CommonModule,
		DragDropModule,
		FormsModule,
		ReactiveFormsModule,

		InlineSVGModule,
		MarkdownModule.forRoot({ loader: HttpClient }),

		SharedFrameworkCoreModule,
		SharedFrameworkCommonModule,
		StatsDataAccessModule,
		SharedCommonViewModule,
		GameStateModule,
	],
	providers: [],
	declarations: components,
	exports: components,
})
export class AppViewModule {}
