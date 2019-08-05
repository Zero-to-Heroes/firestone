import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { DebugService } from '../../services/debug.service';
import { DeckTrackerOverlayComponent } from '../../components/decktracker/overlay/decktracker-overlay.component';
import { SharedModule } from '../shared/shared.module';
import { PreferencesService } from '../../services/preferences.service';
import { GenericIndexedDbService } from '../../services/generic-indexed-db.service';
import { init } from '@sentry/browser';
import { Events } from '../../services/events.service';
import { SelectModule } from 'ng-select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedDeckTrackerModule } from '../shared-decktracker/shared-dectracker.module';
import { OverwolfService } from '../../services/overwolf.service';
import { HttpClientModule } from '@angular/common/http';

init({
	dsn: 'https://53b0813bb66246ae90c60442d05efefe@sentry.io/1338840',
	enabled: process.env.NODE_ENV === 'production',
	release: process.env.APP_VERSION,
});

console.log('version is ' + process.env.APP_VERSION);

@NgModule({
	imports: [
		BrowserModule,
		HttpClientModule,
		BrowserAnimationsModule,
		SharedModule,
		SelectModule,
		FormsModule,
		ReactiveFormsModule,
		SharedDeckTrackerModule,
	],
	declarations: [
		// DeckTrackerOverlayComponent,
		// DeckTrackerDeckListComponent,
		// DeckListByZoneComponent,
		// GroupedDeckListComponent,
		// DeckCardComponent,
		// DeckZoneComponent,
		// DeckTrackerDeckNameComponent,
		// DeckTrackerTitleBarComponent,
	],
	bootstrap: [DeckTrackerOverlayComponent],
	providers: [DebugService, Events, GenericIndexedDbService, PreferencesService, OverwolfService],
})
export class DeckTrackerModule {}
