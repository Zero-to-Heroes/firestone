import { NgModule, ErrorHandler }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpModule }    from '@angular/http';

import * as Raven from 'raven-js';
import { LocalStorageService, LocalStorageModule } from 'angular-2-local-storage';

import { SharedModule } from '../shared/shared.module';

import { WelcomePageComponent }  from '../../components/welcome-page.component';
import { HomeScreenInfoTextComponent }  from '../../components/home/home-screen-info-text.component';
import { AppChoiceComponent }  from '../../components/home/app-choice.component';
import { SocialMediaComponent }  from '../../components/social-media.component';

import { DebugService } from '../../services/debug.service';

import { AllCardsService }  from '../../services/all-cards.service';
import { Events } from '../../services/events.service';
import { PlayerNameService }  from '../../services/player-name.service';
import { RealTimeNotificationService }  from '../../services/real-time-notifications.service';
import { CollectionManager }  from '../../services/collection/collection-manager.service';
import { IndexedDbService }  from '../../services/collection/indexed-db.service';
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
		LocalStorageModule.withConfig({
			prefix: 'replay-viewer',
			storageType: 'localStorage',
		}),
		SharedModule,
	],
	declarations: [
		WelcomePageComponent,
		HomeScreenInfoTextComponent,
		AppChoiceComponent,
		SocialMediaComponent,
	],
	bootstrap: [
		WelcomePageComponent,
	],
	providers: [
		AllCardsService,
		CollectionManager,
		DebugService,
		Events,
		IndexedDbService,
		MemoryInspectionService,
		PlayerNameService,
		RealTimeNotificationService,
		{ provide: ErrorHandler, useClass: AnalyticsErrorHandler },
	],
})

export class WelcomeModule { }
