import { NgModule, ErrorHandler }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpModule }    from '@angular/http';
import { FormsModule, ReactiveFormsModule }   from '@angular/forms';

import { LocalStorageService, LocalStorageModule } from 'angular-2-local-storage';

import * as Raven from 'raven-js';
import { NgxPopperModule } from 'ngx-popper';

import { CollectionComponent }  from '../../components/collection.component';
import { CollectionMenuComponent }  from '../../components/collection/collection-menu.component';
import { SetComponent }  from '../../components/collection/set.component';
import { SetsContainer }  from '../../components/collection/sets-container.component';
import { CardsComponent }  from '../../components/collection/cards.component';
import { RarityComponent }  from '../../components/collection/rarity.component';
import { CardComponent }  from '../../components/collection/card.component';
import { HearthheadComponent }  from '../../components/hearthhead.component';
import { LoginComponent }  from '../../components/login.component';
import { MainWindowComponent }  from '../../components/main-window.component';
import { MenuSelectionComponent }  from '../../components/menu-selection.component';
import { RealTimeNotificationsComponent }  from '../../components/real-time-notifications.component';
import { SetsComponent }  from '../../components/collection/sets.component';
import { SocialMediaComponent }  from '../../components/social-media.component';
import { TooltipsComponent, Tooltip }  from '../../components/tooltips.component';
import { VersionComponent }  from '../../components/version.component';

import { AllCardsService }  from '../../services/all-cards.service';
import { CollectionManager }  from '../../services/collection-manager.service';
import { DebugService } from '../../services/debug.service';
import { Events } from '../../services/events.service';
import { HearthHeadSyncService }  from '../../services/hearthhead-sync.service';
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
		FormsModule,
		ReactiveFormsModule,
        NgxPopperModule,
		LocalStorageModule.withConfig({
			prefix: 'replay-viewer',
			storageType: 'localStorage',
		}),
	],
	declarations: [
		CardComponent,
		CardsComponent,
		CollectionComponent,
		CollectionMenuComponent,
		HearthheadComponent,
		LoginComponent,
		MainWindowComponent,
		MenuSelectionComponent,
		RarityComponent,
		RealTimeNotificationsComponent,
		SetComponent,
		SetsComponent,
		SetsContainer,
		SocialMediaComponent,
		Tooltip,
		TooltipsComponent,
		VersionComponent,
	],
	bootstrap: [
		MainWindowComponent,
	],
	entryComponents: [Tooltip],
	providers: [
		AllCardsService,
		CollectionManager,
		DebugService,
		Events,
		HearthHeadSyncService,
		LocalStorageService,
		OwNotificationsService,
		{ provide: ErrorHandler, useClass: AnalyticsErrorHandler },
	],
})


export class CollectionModule { }
