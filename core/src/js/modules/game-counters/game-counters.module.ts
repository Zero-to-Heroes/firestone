import { OverlayModule } from '@angular/cdk/overlay';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { init, Integrations } from '@sentry/browser';
import { CaptureConsole, ExtraErrorData } from '@sentry/integrations';
import { InlineSVGModule } from 'ng-inline-svg';
import { SelectModule } from 'ng-select';
import { LoggerModule, NgxLoggerLevel } from 'ngx-logger';
import { AttackCountersComponent } from '../../components/game-counters/attack-counter.component';
import { GalakrondCountersComponent } from '../../components/game-counters/galakrond-counter.component';
import { GameCountersComponent } from '../../components/game-counters/game-counters.component';
import { JadeCounterComponent } from '../../components/game-counters/jade-counter.component';
import { PogoHopperCountersComponent } from '../../components/game-counters/pogo-counter.component';
import { DebugService } from '../../services/debug.service';
import { Events } from '../../services/events.service';
import { GenericIndexedDbService } from '../../services/generic-indexed-db.service';
import { OverwolfService } from '../../services/overwolf.service';
import { PreferencesService } from '../../services/preferences.service';
import { SharedDeckTrackerModule } from '../shared-decktracker/shared-dectracker.module';
import { SharedModule } from '../shared/shared.module';

init({
	dsn: 'https://53b0813bb66246ae90c60442d05efefe@o92856.ingest.sentry.io/1338840',
	enabled: process.env.NODE_ENV === 'production',
	release: process.env.APP_VERSION,
	attachStacktrace: true,
	integrations: [
		new Integrations.GlobalHandlers({
			onerror: true,
			onunhandledrejection: true,
		}),
		new ExtraErrorData(),
		new CaptureConsole({
			levels: ['error'],
		}),
	],
});

console.log('version is ' + process.env.APP_VERSION);

@NgModule({
	imports: [
		BrowserModule,
		HttpClientModule,
		BrowserAnimationsModule,
		SharedModule,
		SelectModule,
		OverlayModule,
		FormsModule,
		ReactiveFormsModule,
		SharedDeckTrackerModule,
		LoggerModule.forRoot({ level: NgxLoggerLevel.DEBUG }),
		InlineSVGModule.forRoot(),
	],
	declarations: [
		GameCountersComponent,
		GalakrondCountersComponent,
		PogoHopperCountersComponent,
		JadeCounterComponent,
		AttackCountersComponent,
	],
	bootstrap: [GameCountersComponent],
	providers: [DebugService, Events, GenericIndexedDbService, PreferencesService, OverwolfService],
})
export class GameCountersModule {}
