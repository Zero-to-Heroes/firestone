import { NgModule, Injectable, ErrorHandler }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpModule }    from '@angular/http';

import { init, captureException } from "@sentry/browser";

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
import { AchievementsRepository } from '../../services/achievement/achievements-repository.service';
import { AchievementsStorageService } from '../../services/achievement/achievements-storage.service';
import { IndexedDbService as AchievementsDb }  from '../../services/achievement/indexed-db.service';

import { AllCardsService }  from '../../services/all-cards.service';
import { CardHistoryStorageService }  from '../../services/collection/card-history-storage.service';
import { CollectionManager }  from '../../services/collection/collection-manager.service';
import { IndexedDbService }  from '../../services/collection/indexed-db.service';
import { LogParserService }  from '../../services/collection/log-parser.service';
import { PackMonitor }  from '../../services/collection/pack-monitor.service';
import { PackHistoryService } from '../../services/collection/pack-history.service';
import { PackStatsService } from '../../services/collection/pack-stats.service';
import { AchievementStatsService } from '../../services/achievement/achievement-stats.service';
import { AchievementHistoryStorageService } from '../../services/achievement/achievement-history-storage.service';
import { AchievementNameService } from '../../services/achievement/achievement-name.service';
import { DevService } from '../../services/dev.service';
import { AchievementsVideoCaptureService } from '../../services/achievement/achievements-video-capture.service';
import { FeatureFlags } from '../../services/feature-flags.service';
import { AchievementConfService } from '../../services/achievement/achievement-conf.service';
import { OverwolfService } from '../../services/overwolf.service';
import { PreferencesService } from '../../services/preferences.service';
import { GenericIndexedDbService } from '../../services/generic-indexed-db.service';
import { DeckParserService } from '../../services/decktracker/deck-parser.service';
import { GameStateService } from '../../services/decktracker/game-state.service';
import { S3FileUploadService } from '../../services/s3-file-upload.service';
import { SettingsCommunicationService } from '../../services/settings/settings-communication.service';
import { GameEventsPluginService } from '../../services/plugins/game-events-plugin.service';
import { MainWindowStoreService } from '../../services/mainwindow/store/main-window-store.service';
import { CollaboratorsService } from '../../services/mainwindow/store/collaborators.service';
import { DynamicZoneHelperService } from '../../services/decktracker/dynamic-zone-helper.service';
import { TemporaryResolutionOverrideService } from '../../services/achievement/temporary-resolution-override-service';
import { AppBootstrapService } from '../../services/app-bootstrap.service';
import { TwitchAuthService } from '../../services/mainwindow/twitch-auth.service';
import { HttpClientModule } from '@angular/common/http';

init({
	dsn: "https://53b0813bb66246ae90c60442d05efefe@sentry.io/1338840",
	enabled: process.env.NODE_ENV === 'production',
	release: process.env.APP_VERSION
});

console.log('version is ' + process.env.APP_VERSION);

@Injectable()
export class SentryErrorHandler implements ErrorHandler {
  	constructor() {}
  	handleError(error) {
    	captureException(error.originalError || error);
    	throw error;
  	}
}

@NgModule({
	bootstrap: [AppComponent],
	imports: [
		BrowserModule,
        HttpModule,
        HttpClientModule,
		BrowserAnimationsModule
	],
	declarations: [
		AppComponent
	],
	providers: [
		{ provide: ErrorHandler, useClass: SentryErrorHandler },

        AppBootstrapService,
		MainWindowStoreService,
		CollaboratorsService,

		Events,
		DebugService,
		DevService,
		FeatureFlags,
		HsPublicEventsListener,
		GameEvents,
		GameEventsPluginService,
		IndexedDbService,
		GenericIndexedDbService,
		LogListenerService,
		LogParserService,
		LogRegisterService,
		LogStatusService,
		OverwolfService,
		OwNotificationsService,
		PreferencesService,
		SettingsCommunicationService,
		SimpleIOService,
		MemoryInspectionService,
        S3FileUploadService,
        TwitchAuthService,

		AllCardsService,
		CardHistoryStorageService,
		CollectionManager,
		PackMonitor,
		PackHistoryService,
		PackStatsService,

		AchievementConfService,
		AchievementHistoryStorageService,
		AchievementsMonitor,
		AchievementNameService,
		AchievementsRepository,
		AchievementStatsService,
		AchievementsStorageService,
		AchievementsVideoCaptureService,
		AchievementsDb,

		DeckParserService,
        GameStateService,
        DynamicZoneHelperService,

        TemporaryResolutionOverrideService,
	]
})
export class AppModule { }
