import { NgModule }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { SharedModule } from '../shared/shared.module';
import { init } from '@sentry/browser';
import { Events } from '../../services/events.service';
import { SelectModule } from 'ng-select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedDeckTrackerModule } from '../shared-decktracker/shared-dectracker.module';
import { DeckTrackerOverlayStandaloneComponent } from '../../components/decktracker/overlay/decktracker-overlay-standalone.component';
import { HttpClientModule } from '@angular/common/http';

init({
	dsn: "https://53b0813bb66246ae90c60442d05efefe@sentry.io/1338840",
	enabled: process.env.NODE_ENV === 'production',
	release: process.env.APP_VERSION
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
        SharedDeckTrackerModule,
	],
	declarations: [
        DeckTrackerOverlayStandaloneComponent,
	],
	bootstrap: [
		DeckTrackerOverlayStandaloneComponent,
	],
	providers: [
        Events,
	],
})

export class DeckTrackerTwitchModule { }
