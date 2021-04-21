import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { init, Integrations } from '@sentry/browser';
import { CaptureConsole, ExtraErrorData } from '@sentry/integrations';
import { SimpleNotificationsModule } from 'angular2-notifications';
import { NotificationsComponent } from '../../components/notifications.component';
import { DebugService } from '../../services/debug.service';
import { GenericIndexedDbService } from '../../services/generic-indexed-db.service';
import { OverwolfService } from '../../services/overwolf.service';
import { PreferencesService } from '../../services/preferences.service';
import { SharedServicesModule } from '../shared-services/shared-services.module';

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
	imports: [BrowserModule, HttpClientModule, BrowserAnimationsModule, SimpleNotificationsModule.forRoot(), 
		SharedServicesModule.forRoot(),],
	declarations: [NotificationsComponent],
	bootstrap: [NotificationsComponent],
	providers: [DebugService, OverwolfService, PreferencesService, GenericIndexedDbService],
})
export class NotificationsModule {}
