import { NgModule, ErrorHandler }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpModule }    from '@angular/http';

import { SimpleNotificationsModule } from 'angular2-notifications';

import { NotificationsComponent }  from '../../components/notifications.component';
import { DebugService } from '../../services/debug.service';

declare var ga: any;
export class AnalyticsErrorHandler implements ErrorHandler {
  	handleError(err: any) : void {
	  	console.error('error captured and sent to GA', err);
		ga('send', 'event', 'error', 'other', JSON.stringify(err));
  	}
}

@NgModule({
	imports: [
		BrowserModule,
		HttpModule,
        BrowserAnimationsModule,
        SimpleNotificationsModule.forRoot(),
	],
	declarations: [
		NotificationsComponent,
	],
	bootstrap: [
		NotificationsComponent,
	],
	providers: [
		DebugService,
		{ provide: ErrorHandler, useClass: AnalyticsErrorHandler },
	],
})

export class NotificationsModule { }
