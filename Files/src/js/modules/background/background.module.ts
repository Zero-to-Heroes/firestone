import { HttpClientModule } from '@angular/common/http';
import { ErrorHandler, Injectable, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { captureException, init } from '@sentry/browser';
import { AppComponent } from '../../components/app.component';
import { AchievementConfService } from '../../services/achievement/achievement-conf.service';
import { AchievementHistoryStorageService } from '../../services/achievement/achievement-history-storage.service';
import { AchievementStatsService } from '../../services/achievement/achievement-stats.service';
import { AchievementsMonitor } from '../../services/achievement/achievements-monitor.service';
import { AchievementsRepository } from '../../services/achievement/achievements-repository.service';
import { AchievementsStorageService } from '../../services/achievement/achievements-storage.service';
import { AchievementsVideoCaptureService } from '../../services/achievement/achievements-video-capture.service';
import { ChallengeBuilderService } from '../../services/achievement/achievements/challenges/challenge-builder.service';
import { AchievementsLoaderService } from '../../services/achievement/data/achievements-loader.service';
import { IndexedDbService as AchievementsDb } from '../../services/achievement/indexed-db.service';
import { TemporaryResolutionOverrideService } from '../../services/achievement/temporary-resolution-override-service';
import { AllCardsService } from '../../services/all-cards.service';
import { AppBootstrapService } from '../../services/app-bootstrap.service';
import { CardHistoryStorageService } from '../../services/collection/card-history-storage.service';
import { CollectionManager } from '../../services/collection/collection-manager.service';
import { IndexedDbService } from '../../services/collection/indexed-db.service';
import { LogParserService } from '../../services/collection/log-parser.service';
import { PackHistoryService } from '../../services/collection/pack-history.service';
import { PackMonitor } from '../../services/collection/pack-monitor.service';
import { PackStatsService } from '../../services/collection/pack-stats.service';
import { DebugService } from '../../services/debug.service';
import { DeckCardService } from '../../services/decktracker/deck-card.service';
import { DeckParserService } from '../../services/decktracker/deck-parser.service';
import { DynamicZoneHelperService } from '../../services/decktracker/dynamic-zone-helper.service';
import { GameStateService } from '../../services/decktracker/game-state.service';
import { ZoneOrderingService } from '../../services/decktracker/zone-ordering.service';
import { DevService } from '../../services/dev.service';
import { Events } from '../../services/events.service';
import { FeatureFlags } from '../../services/feature-flags.service';
import { GameEvents } from '../../services/game-events.service';
import { GenericIndexedDbService } from '../../services/generic-indexed-db.service';
import { HsPublicEventsListener } from '../../services/hs-public-events-listener.service';
import { LogListenerService } from '../../services/log-listener.service';
import { LogRegisterService } from '../../services/log-register.service';
import { LogsUploaderService } from '../../services/logs-uploader.service';
import { CollaboratorsService } from '../../services/mainwindow/store/collaborators.service';
import { MainWindowStoreService } from '../../services/mainwindow/store/main-window-store.service';
import { TwitchAuthService } from '../../services/mainwindow/twitch-auth.service';
import { OwNotificationsService } from '../../services/notifications.service';
import { OverwolfService } from '../../services/overwolf.service';
import { GameEventsPluginService } from '../../services/plugins/game-events-plugin.service';
import { MemoryInspectionService } from '../../services/plugins/memory-inspection.service';
import { SimpleIOService } from '../../services/plugins/simple-io.service';
import { PreferencesService } from '../../services/preferences.service';
import { S3FileUploadService } from '../../services/s3-file-upload.service';
import { SettingsCommunicationService } from '../../services/settings/settings-communication.service';

init({
	dsn: 'https://53b0813bb66246ae90c60442d05efefe@sentry.io/1338840',
	enabled: process.env.NODE_ENV === 'production',
	release: process.env.APP_VERSION,
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
	imports: [BrowserModule, HttpClientModule, BrowserAnimationsModule],
	declarations: [AppComponent],
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
		AchievementsRepository,
		AchievementsLoaderService,
		AchievementStatsService,
		AchievementsStorageService,
		AchievementsVideoCaptureService,
		AchievementsDb,
		ChallengeBuilderService,

		DeckCardService,
		DeckParserService,
		GameStateService,
		DynamicZoneHelperService,
		ZoneOrderingService,

		TemporaryResolutionOverrideService,

		LogsUploaderService,
	],
})
export class AppModule {}
