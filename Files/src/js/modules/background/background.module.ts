import { NgModule, ErrorHandler }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpModule }    from '@angular/http';

import * as Raven from 'raven-js';

// import { SimpleNotificationsModule } from 'angular2-notifications';
import { LocalStorageService, LocalStorageModule } from 'angular-2-local-storage';

import { AppComponent }  from '../../components/app.component';

import { LogListenerService }  from '../../services/log-listener.service';
import { LogParserService }  from '../../services/log-parser.service';
import { CollectionManager }  from '../../services/collection-manager.service';
import { Events }  from '../../services/events.service';
import { OwNotificationsService }  from '../../services/notifications.service';

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
        // SimpleNotificationsModule.forRoot(),
		LocalStorageModule.withConfig({
			prefix: 'replay-viewer',
			storageType: 'localStorage',
		}),
	],
	declarations: [
		AppComponent,
	],
	bootstrap: [
		AppComponent,
	],
	providers: [
		LocalStorageService,
		LogListenerService,
		LogParserService,
		CollectionManager,
		OwNotificationsService,
		Events,
		// { provide: ErrorHandler, useClass: RavenErrorHandler },
	],
})

export class AppModule { }
