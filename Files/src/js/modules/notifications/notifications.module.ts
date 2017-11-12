import { NgModule, ErrorHandler }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpModule }    from '@angular/http';

import * as Raven from 'raven-js';

import { SimpleNotificationsModule } from 'angular2-notifications';

import { NotificationsComponent }  from '../../components/notifications.component';
import { DebugService } from '../../services/debug.service';

// console.log('configuring Raven'),
// Raven
//   	.config('https://c08a7bdf3f174ff2b45ad33bcf8c48f6@sentry.io/202626')
//   	.install();
// console.log('Raven configured');

//  export class RavenErrorHandler implements ErrorHandler {
//   	handleError(err: any) : void {
// 	  	console.log('error captured by Raven', err);
// 	    // Raven.captureException(err);
//   	}
// }

@NgModule({
	imports: [
		BrowserModule,
		HttpModule,
		// Animations need to be imported in to your project to use the library
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
		// { provide: ErrorHandler, useClass: RavenErrorHandler },
	],
})

export class NotificationsModule { }
