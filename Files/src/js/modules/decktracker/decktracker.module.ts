import { NgModule, ErrorHandler }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpModule }    from '@angular/http';

import { DebugService } from '../../services/debug.service';
import { DeckTrackerComponent } from '../../components/decktracker/decktracker.component';

@NgModule({
	imports: [
		BrowserModule,
		HttpModule,
        BrowserAnimationsModule,
	],
	declarations: [
		DeckTrackerComponent,
	],
	bootstrap: [
		DeckTrackerComponent,
	],
	providers: [
		DebugService,
	],
})

export class DeckTrackerModule { }
