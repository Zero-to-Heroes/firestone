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
import { DeckCardComponent } from '../../components/decktracker/overlay/deck-card.component';
import { DeckListByZoneComponent } from '../../components/decktracker/overlay/deck-list-by-zone.component';
import { DeckZoneComponent } from '../../components/decktracker/overlay/deck-zone.component';
import { DeckTrackerCardsRecapComponent } from '../../components/decktracker/overlay/decktracker-cards-recap.component';
import { DeckTrackerControlBarComponent } from '../../components/decktracker/overlay/decktracker-control-bar.component';
import { DeckTrackerDeckListComponent } from '../../components/decktracker/overlay/decktracker-deck-list.component';
import { DeckTrackerDeckNameComponent } from '../../components/decktracker/overlay/decktracker-deck-name.component';
import { DeckTrackerOverlayOpponentComponent } from '../../components/decktracker/overlay/decktracker-overlay-opponent.component';
import { DeckTrackerOverlayPlayerComponent } from '../../components/decktracker/overlay/decktracker-overlay-player.component';
import { DeckTrackerOverlayRootComponent } from '../../components/decktracker/overlay/decktracker-overlay-root.component';
import { DeckTrackerTitleBarComponent } from '../../components/decktracker/overlay/decktracker-title-bar';
import { DecktrackerWidgetIconComponent } from '../../components/decktracker/overlay/decktracker-widget-icon';
import { GroupedDeckListComponent } from '../../components/decktracker/overlay/grouped-deck-list.component';
import { SecretsHelperListComponent } from '../../components/secrets-helper/secrets-helper-list.component';
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
	],
	declarations: [
		DeckTrackerOverlayRootComponent,
		DeckTrackerOverlayPlayerComponent,
		DeckTrackerOverlayOpponentComponent,
		DeckTrackerDeckListComponent,
		DeckListByZoneComponent,
		GroupedDeckListComponent,
		DeckCardComponent,
		DeckZoneComponent,
		DeckTrackerDeckNameComponent,
		DeckTrackerControlBarComponent,
		DeckTrackerTitleBarComponent,
		DeckTrackerCardsRecapComponent,
		SecretsHelperListComponent,
		DecktrackerWidgetIconComponent,
	],
	exports: [
		DeckTrackerOverlayRootComponent,
		DeckTrackerOverlayPlayerComponent,
		DeckTrackerOverlayOpponentComponent,
		DeckTrackerDeckListComponent,
		DeckListByZoneComponent,
		GroupedDeckListComponent,
		DeckCardComponent,
		DeckZoneComponent,
		DeckTrackerDeckNameComponent,
		DeckTrackerControlBarComponent,
		DeckTrackerTitleBarComponent,
		DeckTrackerCardsRecapComponent,
		SecretsHelperListComponent,
	],
	providers: [
		{
			provide: PERFECT_SCROLLBAR_CONFIG,
			useValue: DEFAULT_PERFECT_SCROLLBAR_CONFIG,
		},
	],
})
export class SharedDeckTrackerModule {}
