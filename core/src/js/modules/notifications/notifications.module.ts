import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { init, Integrations } from '@sentry/browser';
import { CaptureConsole, ExtraErrorData } from '@sentry/integrations';
import { SimpleNotificationsModule } from 'angular2-notifications';
import { NotificationsComponent } from '../../components/notifications.component';
import { DebugService } from '../../services/debug.service';
import { OverwolfService } from '../../services/overwolf.service';

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
	imports: [BrowserModule, HttpClientModule, BrowserAnimationsModule, SimpleNotificationsModule.forRoot()],
	declarations: [NotificationsComponent],
	bootstrap: [NotificationsComponent],
	providers: [DebugService, OverwolfService],
})
export class NotificationsModule {}
