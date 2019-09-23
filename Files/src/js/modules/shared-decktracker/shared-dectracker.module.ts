import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { init } from '@sentry/browser';
import { SelectModule } from 'ng-select';
import { DeckCardComponent } from '../../components/decktracker/overlay/deck-card.component';
import { DeckListByZoneComponent } from '../../components/decktracker/overlay/deck-list-by-zone.component';
import { DeckZoneComponent } from '../../components/decktracker/overlay/deck-zone.component';
import { DeckTrackerDeckListComponent } from '../../components/decktracker/overlay/decktracker-deck-list.component';
import { DeckTrackerDeckNameComponent } from '../../components/decktracker/overlay/decktracker-deck-name.component';
import { DeckTrackerOverlayComponent } from '../../components/decktracker/overlay/decktracker-overlay.component';
import { DeckTrackerTitleBarComponent } from '../../components/decktracker/overlay/decktracker-title-bar.component';
import { GroupedDeckListComponent } from '../../components/decktracker/overlay/grouped-deck-list.component';
import { SharedModule } from '../shared/shared.module';

init({
	dsn: 'https://53b0813bb66246ae90c60442d05efefe@sentry.io/1338840',
	enabled: process.env.NODE_ENV === 'production',
	release: process.env.APP_VERSION,
});

console.log('version is', process.env.APP_VERSION);

@NgModule({
	imports: [
		BrowserModule,
		HttpClientModule,
		BrowserAnimationsModule,
		SharedModule,
		SelectModule,
		FormsModule,
		ReactiveFormsModule,
	],
	declarations: [
		DeckTrackerOverlayComponent,
		DeckTrackerDeckListComponent,
		DeckListByZoneComponent,
		GroupedDeckListComponent,
		DeckCardComponent,
		DeckZoneComponent,
		DeckTrackerDeckNameComponent,
		DeckTrackerTitleBarComponent,
	],
	exports: [
		DeckTrackerOverlayComponent,
		DeckTrackerDeckListComponent,
		DeckListByZoneComponent,
		GroupedDeckListComponent,
		DeckCardComponent,
		DeckZoneComponent,
		DeckTrackerDeckNameComponent,
		DeckTrackerTitleBarComponent,
	],
})
export class SharedDeckTrackerModule {}
