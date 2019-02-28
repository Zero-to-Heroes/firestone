import { NgModule }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpModule }    from '@angular/http';

import { DebugService } from '../../services/debug.service';
import { DeckTrackerComponent } from '../../components/decktracker/decktracker.component';
import { DeckTrackerTitleBarComponent } from '../../components/decktracker/decktracker-title-bar.component';
import { DeckTrackerDeckNameComponent } from '../../components/decktracker/decktracker-deck-name.component';
import { DeckTrackerDeckListComponent } from '../../components/decktracker/decktracker-deck-list.component';
import { DeckListByManaComponent } from '../../components/decktracker/deck-list-by-zone.component';

@NgModule({
	imports: [
		BrowserModule,
		HttpModule,
        BrowserAnimationsModule,
	],
	declarations: [
		DeckTrackerComponent,
		DeckTrackerDeckListComponent,
		DeckListByManaComponent,
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
