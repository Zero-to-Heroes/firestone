import { NgModule, ErrorHandler }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpModule }    from '@angular/http';
import { FormsModule, ReactiveFormsModule }   from '@angular/forms';

import { LocalStorageService, LocalStorageModule } from 'angular-2-local-storage';
import { SelectModule } from 'ng-select';

import * as Raven from 'raven-js';
import { NgxPopperModule } from 'ngx-popper';

import { HearthheadComponent }  from '../../components/hearthhead.component';
import { LoginComponent }  from '../../components/login.component';
import { MainWindowComponent }  from '../../components/main-window.component';
import { MenuSelectionComponent }  from '../../components/menu-selection.component';
import { PlayerNameComponent }  from '../../components/player-name.component';
import { RealTimeNotificationsComponent }  from '../../components/real-time-notifications.component';
import { SocialMediaComponent }  from '../../components/social-media.component';
import { TooltipsComponent, Tooltip }  from '../../components/tooltips.component';
import { VersionComponent }  from '../../components/version.component';

import { CollectionComponent }  from '../../components/collection.component';
import { CollectionMenuComponent }  from '../../components/collection/collection-menu.component';
import { CardsComponent }  from '../../components/collection/cards.component';
import { CardHistoryComponent }  from '../../components/collection/card-history.component';
import { CardHistoryItemComponent }  from '../../components/collection/card-history-item.component';
import { FullCardComponent }  from '../../components/collection/full-card.component';
import { SetComponent }  from '../../components/collection/set.component';
import { SetsContainer }  from '../../components/collection/sets-container.component';
import { RarityComponent }  from '../../components/collection/rarity.component';
import { CardComponent }  from '../../components/collection/card.component';
import { CardSearchComponent }  from '../../components/collection/card-search.component';
import { CardSearchAutocompleteItemComponent } from '../../components/collection/card-search-autocomplete-item.component';
import { SetsComponent }  from '../../components/collection/sets.component';

import { AllCardsService }  from '../../services/all-cards.service';
import { DebugService } from '../../services/debug.service';
import { Events } from '../../services/events.service';
import { OwNotificationsService }  from '../../services/notifications.service';
import { MemoryInspectionService } from '../../services/plugins/memory-inspection.service';
import { PlayerNameService }  from '../../services/player-name.service';

import { CardHistoryStorageService }  from '../../services/collection/card-history-storage.service';
import { CollectionManager }  from '../../services/collection/collection-manager.service';
import { HearthHeadSyncService }  from '../../services/collection/hearthhead-sync.service';
import { IndexedDbService }  from '../../services/collection/indexed-db.service';

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
        SelectModule,
		LocalStorageModule.withConfig({
			prefix: 'replay-viewer',
			storageType: 'localStorage',
		}),
	],
	declarations: [
		CardComponent,
		CardHistoryComponent,
		CardHistoryItemComponent,
		CardsComponent,
		CardSearchComponent,
		CardSearchAutocompleteItemComponent,
		CollectionComponent,
		CollectionMenuComponent,
		FullCardComponent,
		HearthheadComponent,
		LoginComponent,
		MainWindowComponent,
		MenuSelectionComponent,
		PlayerNameComponent,
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
		CardHistoryStorageService,
		CollectionManager,
		DebugService,
		Events,
		HearthHeadSyncService,
		IndexedDbService,
		LocalStorageService,
		OwNotificationsService,
		MemoryInspectionService,
		PlayerNameService,
		{ provide: ErrorHandler, useClass: AnalyticsErrorHandler },
	],
})


export class CollectionModule { }
