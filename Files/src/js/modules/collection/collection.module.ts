import { NgModule, ErrorHandler }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpModule }    from '@angular/http';

import * as Raven from 'raven-js';
import { NgxPopperModule } from 'ngx-popper';

import { CollectionComponent }  from '../../components/collection.component';
import { SetComponent }  from '../../components/collection/set.component';
import { SetsContainer }  from '../../components/collection/sets-container.component';
import { CardDisplayComponent }  from '../../components/collection/card-display.component';
import { RarityComponent }  from '../../components/collection/rarity.component';
import { CardComponent }  from '../../components/collection/card.component';
import { CollectionStatsComponent }  from '../../components/collection-stats.component';
import { SocialMediaComponent }  from '../../components/social-media.component';
import { VersionComponent }  from '../../components/version.component';
import { TooltipsComponent, Tooltip }  from '../../components/tooltips.component';

import { CollectionManager }  from '../../services/collection-manager.service';
import { AllCardsService }  from '../../services/all-cards.service';
import { Events } from '../../services/events.service';
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
        NgxPopperModule,
	],
	declarations: [
		CollectionComponent,
		SetComponent,
		SetsContainer,
		CardDisplayComponent,
		RarityComponent,
		CardComponent,
		CollectionStatsComponent,
		SocialMediaComponent,
		VersionComponent,
		Tooltip,
		TooltipsComponent,
	],
	bootstrap: [
		CollectionComponent,
	],
	entryComponents: [Tooltip],
	providers: [
		CollectionManager,
		AllCardsService,
		Events,
		DebugService,
		{ provide: ErrorHandler, useClass: AnalyticsErrorHandler },
	],
})


export class CollectionModule { }
