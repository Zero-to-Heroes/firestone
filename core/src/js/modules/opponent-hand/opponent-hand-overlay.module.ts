import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { init, Integrations } from '@sentry/browser';
import { CaptureConsole, ExtraErrorData } from '@sentry/integrations';
import { LoggerModule, NgxLoggerLevel } from 'ngx-logger';
import { OpponentCardInfoIdComponent } from '../../components/matchoverlay/opponenthand/opponent-card-info-id.component';
import { OpponentCardInfoComponent } from '../../components/matchoverlay/opponenthand/opponent-card-info.component';
import { OpponentCardInfosComponent } from '../../components/matchoverlay/opponenthand/opponent-card-infos.component';
import { OpponentCardTurnNumberComponent } from '../../components/matchoverlay/opponenthand/opponent-card-turn-number.component';
import { OpponentHandOverlayComponent } from '../../components/matchoverlay/opponenthand/opponent-hand-overlay.component';
import { DebugService } from '../../services/debug.service';
import { Events } from '../../services/events.service';
import { GenericIndexedDbService } from '../../services/generic-indexed-db.service';
import { OverwolfService } from '../../services/overwolf.service';
import { PreferencesService } from '../../services/preferences.service';
import { SharedServicesModule } from '../shared-services/shared-services.module';
import { SharedModule } from '../shared/shared.module';

init({
	dsn: 'https://53b0813bb66246ae90c60442d05efefe@o92856.ingest.sentry.io/1338840',
	enabled: process.env.NODE_ENV === 'production',
	release: process.env.APP_VERSION,
	attachStacktrace: true,
	sampleRate: 0.1,
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
		BrowserAnimationsModule,
		SharedModule,
		FormsModule,
		SharedServicesModule.forRoot(),
		LoggerModule.forRoot({ level: NgxLoggerLevel.DEBUG }),
	],
	declarations: [
		OpponentHandOverlayComponent,
		OpponentCardInfosComponent,
		OpponentCardInfoComponent,
		OpponentCardInfoIdComponent,
		OpponentCardTurnNumberComponent,
	],
	bootstrap: [OpponentHandOverlayComponent],
	providers: [DebugService, Events, GenericIndexedDbService, PreferencesService, OverwolfService],
})
export class OpponentHandOverlayModule {}
