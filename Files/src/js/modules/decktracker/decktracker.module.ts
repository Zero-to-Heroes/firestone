import { NgModule }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpModule }    from '@angular/http';

import { DebugService } from '../../services/debug.service';
import { DeckTrackerOverlayComponent } from '../../components/decktracker/overlay/decktracker-overlay.component';
import { DeckTrackerTitleBarComponent } from '../../components/decktracker/overlay/decktracker-title-bar.component';
import { DeckTrackerDeckNameComponent } from '../../components/decktracker/overlay/decktracker-deck-name.component';
import { DeckTrackerDeckListComponent } from '../../components/decktracker/overlay/decktracker-deck-list.component';
import { DeckListByZoneComponent } from '../../components/decktracker/overlay/deck-list-by-zone.component';
import { DeckZoneComponent } from '../../components/decktracker/overlay/deck-zone.component'; 
import { DeckCardComponent } from '../../components/decktracker/overlay/deck-card.component';
import { SharedModule } from '../shared/shared.module';
import { PreferencesService } from '../../services/preferences.service';
import { GenericIndexedDbService } from '../../services/generic-indexed-db.service';
import { init } from '@sentry/browser';
import { Events } from '../../services/events.service';
import { GroupedDeckListComponent } from '../../components/decktracker/overlay/grouped-deck-list.component';
import { SelectModule } from 'ng-select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

init({
	dsn: "https://53b0813bb66246ae90c60442d05efefe@sentry.io/1338840",
	enabled: process.env.NODE_ENV === 'production',
	release: process.env.APP_VERSION
});

console.log('version is', process.env.APP_VERSION);

@NgModule({
	imports: [
		BrowserModule,
		HttpModule,
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
	bootstrap: [
		DeckTrackerOverlayComponent,
	],
	providers: [
		DebugService,
		Events,
		GenericIndexedDbService,
		PreferencesService,
	],
})

export class DeckTrackerModule { }
