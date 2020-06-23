import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { init, Integrations } from '@sentry/browser';
import { CaptureConsole, ExtraErrorData } from '@sentry/integrations';
import { LoggerModule, NgxLoggerLevel } from 'ngx-logger';
import { LoadingComponent } from '../../components/loading/loading.component';
import { AdService } from '../../services/ad.service';
import { DebugService } from '../../services/debug.service';
import { GenericIndexedDbService } from '../../services/generic-indexed-db.service';
import { OverwolfService } from '../../services/overwolf.service';
import { PreferencesService } from '../../services/preferences.service';
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
		LoggerModule.forRoot({ level: NgxLoggerLevel.DEBUG }),
	],
	declarations: [LoadingComponent],
	bootstrap: [LoadingComponent],
	providers: [DebugService, AdService, OverwolfService, PreferencesService, GenericIndexedDbService],
})
export class LoadingModule {}
