import { NgModule, ErrorHandler }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpModule }    from '@angular/http';

import * as Raven from 'raven-js';

// import { SimpleNotificationsModule } from 'angular2-notifications';
import { LocalStorageService, LocalStorageModule } from 'angular-2-local-storage';

import { AppComponent }  from '../../components/app.component';

import { CardHistoryStorageService }  from '../../services/card-history-storage.service';
import { IndexedDbService }  from '../../services/indexed-db.service';
import { LogListenerService }  from '../../services/log-listener.service';
import { LogParserService }  from '../../services/log-parser.service';
import { LogRegisterService }  from '../../services/log-register.service';
import { LogStatusService }  from '../../services/log-status.service';
import { CollectionManager }  from '../../services/collection-manager.service';
import { PackMonitor }  from '../../services/pack-monitor.service';
import { Events }  from '../../services/events.service';
import { OwNotificationsService }  from '../../services/notifications.service';
import { DebugService } from '../../services/debug.service';
import { HearthHeadSyncService } from '../../services/hearthhead-sync.service';
import { SimpleIOService } from '../../services/plugins/simple-io.service';
import { MemoryInspectionService } from '../../services/plugins/memory-inspection.service';

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
		CardHistoryStorageService,
		CollectionManager,
		Events,
		DebugService,
		HearthHeadSyncService,
		IndexedDbService,
		LogListenerService,
		LogParserService,
		LogRegisterService,
		LogStatusService,
		LocalStorageService,
		OwNotificationsService,
		PackMonitor,
		SimpleIOService,
		MemoryInspectionService,
		{ provide: ErrorHandler, useClass: AnalyticsErrorHandler },
	],
})

export class AppModule { }
