import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SelectModule } from 'ng-select';
import {
	PerfectScrollbarConfigInterface,
	PerfectScrollbarModule,
	PERFECT_SCROLLBAR_CONFIG,
} from 'ngx-perfect-scrollbar';
import { DeckTrackerCardsRecapComponent } from '../../components/decktracker/overlay/decktracker-cards-recap.component';
import { DeckTrackerControlBarComponent } from '../../components/decktracker/overlay/decktracker-control-bar.component';
import { DeckTrackerDeckNameComponent } from '../../components/decktracker/overlay/decktracker-deck-name.component';
import { DeckTrackerOverlayRootComponent } from '../../components/decktracker/overlay/decktracker-overlay-root.component';
import { DeckTrackerTitleBarComponent } from '../../components/decktracker/overlay/decktracker-title-bar';
import { DecktrackerWidgetIconComponent } from '../../components/decktracker/overlay/decktracker-widget-icon';
import { DeckTrackerWinrateRecapComponent } from '../../components/decktracker/overlay/decktracker-winrate-recap.component';
import { SecretsHelperListComponent } from '../../components/secrets-helper/secrets-helper-list.component';
import { SharedServicesModule } from '../shared-services/shared-services.module';
import { SharedModule } from '../shared/shared.module';

console.log('version is', process.env.APP_VERSION);

const DEFAULT_PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
	suppressScrollX: true,
	maxScrollbarLength: 100,
};

@NgModule({
	imports: [
		BrowserModule,
		HttpClientModule,
		BrowserAnimationsModule,
		SharedModule,
		SelectModule,
		FormsModule,
		ReactiveFormsModule,
		PerfectScrollbarModule,
		SharedServicesModule.forRoot(),
	],
	declarations: [
		DeckTrackerOverlayRootComponent,
		DeckTrackerDeckNameComponent,
		DeckTrackerControlBarComponent,
		DeckTrackerTitleBarComponent,
		DeckTrackerCardsRecapComponent,
		SecretsHelperListComponent,
		DecktrackerWidgetIconComponent,
		DeckTrackerWinrateRecapComponent,
	],
	exports: [
		DeckTrackerOverlayRootComponent,
		DeckTrackerDeckNameComponent,
		DeckTrackerControlBarComponent,
		DeckTrackerTitleBarComponent,
		DeckTrackerCardsRecapComponent,
		SecretsHelperListComponent,
		DeckTrackerWinrateRecapComponent,
	],
	providers: [
		{
			provide: PERFECT_SCROLLBAR_CONFIG,
			useValue: DEFAULT_PERFECT_SCROLLBAR_CONFIG,
		},
	],
})
export class SharedDeckTrackerModule {}
