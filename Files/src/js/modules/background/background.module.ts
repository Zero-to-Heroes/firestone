import { NgModule, ErrorHandler }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpModule }    from '@angular/http';

import * as Raven from 'raven-js';

// import { SimpleNotificationsModule } from 'angular2-notifications';
import { LocalStorageService, LocalStorageModule } from 'angular-2-local-storage';

import { AppComponent }  from '../../components/app.component';

import { DebugService } from '../../services/debug.service';
import { Events }  from '../../services/events.service';
import { GameEvents }  from '../../services/game-events.service';
import { HsPublicEventsListener }  from '../../services/hs-public-events-listener.service';
import { LogListenerService }  from '../../services/log-listener.service';
import { LogRegisterService }  from '../../services/log-register.service';
import { LogStatusService }  from '../../services/log-status.service';
import { OwNotificationsService }  from '../../services/notifications.service';

import { MemoryInspectionService } from '../../services/plugins/memory-inspection.service';
import { SimpleIOService } from '../../services/plugins/simple-io.service';

import { AchievementsMonitor } from '../../services/achievement/achievements-monitor.service';
import { AchievementsRefereee } from '../../services/achievement/achievements-referee.service';
import { AchievementsRepository } from '../../services/achievement/achievements-repository.service';
import { AchievementsStorageService } from '../../services/achievement/achievements-storage.service';
import { IndexedDbService as AchievementsDb }  from '../../services/achievement/indexed-db.service';

import { AllCardsService }  from '../../services/all-cards.service';
import { CardHistoryStorageService }  from '../../services/collection/card-history-storage.service';
import { CollectionManager }  from '../../services/collection/collection-manager.service';
import { HearthHeadSyncService } from '../../services/collection/hearthhead-sync.service';
import { IndexedDbService }  from '../../services/collection/indexed-db.service';
import { LogParserService }  from '../../services/collection/log-parser.service';
import { PackMonitor }  from '../../services/collection/pack-monitor.service';

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
		AllCardsService,
		CardHistoryStorageService,
		CollectionManager,
		Events,
		DebugService,
		HearthHeadSyncService,
		HsPublicEventsListener,
		GameEvents,
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
		AchievementsMonitor,
		AchievementsRefereee,
		AchievementsRepository,
		AchievementsStorageService,
		AchievementsDb,
		{ provide: ErrorHandler, useClass: AnalyticsErrorHandler },
	],
})

export class AppModule { }
