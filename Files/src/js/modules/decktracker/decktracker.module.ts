import { NgModule }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpModule }    from '@angular/http';

import { DebugService } from '../../services/debug.service';
import { DeckTrackerComponent } from '../../components/decktracker/decktracker.component';
import { DeckTrackerTitleBarComponent } from '../../components/decktracker/decktracker-title-bar.component';
import { DeckTrackerDeckNameComponent } from '../../components/decktracker/decktracker-deck-name.component';
import { DeckTrackerDeckListComponent } from '../../components/decktracker/decktracker-deck-list.component';
import { DeckListByZoneComponent } from '../../components/decktracker/deck-list-by-zone.component';
import { DeckZoneComponent } from '../../components/decktracker/deck-zone.component';
import { DeckCardComponent } from '../../components/decktracker/deck-card.component';
import { SharedModule } from '../shared/shared.module';

@NgModule({
	imports: [
		BrowserModule,
		HttpModule,
        BrowserAnimationsModule,
		SharedModule,
	],
	declarations: [
		DeckTrackerComponent,
		DeckTrackerDeckListComponent,
		DeckListByZoneComponent,
		DeckCardComponent,
		DeckZoneComponent,
		DeckTrackerDeckNameComponent,
		DeckTrackerTitleBarComponent,
	],
	bootstrap: [
		DeckTrackerComponent,
	],
	providers: [
		DebugService,
	],
})

export class DeckTrackerModule { }
