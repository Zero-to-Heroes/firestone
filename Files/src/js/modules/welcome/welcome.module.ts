import { NgModule }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpModule }    from '@angular/http';

import { SharedModule } from '../shared/shared.module';

import { WelcomePageComponent }  from '../../components/welcome-page.component';
import { HomeScreenInfoTextComponent }  from '../../components/home/home-screen-info-text.component';
import { AppChoiceComponent }  from '../../components/home/app-choice.component';
import { SocialMediaComponent }  from '../../components/social-media.component';

import { DebugService } from '../../services/debug.service';

import { AllCardsService }  from '../../services/all-cards.service';
import { Events } from '../../services/events.service';
import { RealTimeNotificationService }  from '../../services/real-time-notifications.service';
import { CollectionManager }  from '../../services/collection/collection-manager.service';
import { IndexedDbService }  from '../../services/collection/indexed-db.service';
import { MemoryInspectionService } from '../../services/plugins/memory-inspection.service';
import { FeatureFlags } from '../../services/feature-flags.service';
import { init } from '@sentry/browser';

init({
	dsn: "https://53b0813bb66246ae90c60442d05efefe@sentry.io/1338840",
	enabled: process.env.NODE_ENV === 'production',
	release: process.env.APP_VERSION
});

console.log('version is ' + process.env.APP_VERSION);

@NgModule({
	imports: [
		BrowserModule,
		HttpModule,
        BrowserAnimationsModule,
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
		FeatureFlags,
		Events,
		IndexedDbService,
		MemoryInspectionService,
		RealTimeNotificationService,
	],
})

export class WelcomeModule { }
