import { HttpClientModule } from '@angular/common/http';
import { ErrorHandler, Injectable, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { captureException, init } from '@sentry/browser';
import { LZStringModule, LZStringService } from 'ng-lz-string';
import { AppComponent } from '../../components/app.component';
import { AchievementRecordingService } from '../../services/achievement/achievement-recording.service';
import { AchievementsMonitor } from '../../services/achievement/achievements-monitor.service';
import { AchievementsNotificationService } from '../../services/achievement/achievements-notification.service';
import { AchievementsVideoCaptureService } from '../../services/achievement/achievements-video-capture.service';
import { RemoteAchievementsService } from '../../services/achievement/remote-achievements.service';
import { TemporaryResolutionOverrideService } from '../../services/achievement/temporary-resolution-override-service';
import { AppBootstrapService } from '../../services/app-bootstrap.service';
import { LogParserService } from '../../services/collection/log-parser.service';
import { PackMonitor } from '../../services/collection/pack-monitor.service';
import { PackStatsService } from '../../services/collection/pack-stats.service';
import { DeckCardService } from '../../services/decktracker/deck-card.service';
import { DeckParserService } from '../../services/decktracker/deck-parser.service';
import { DynamicZoneHelperService } from '../../services/decktracker/dynamic-zone-helper.service';
import { GameStateMetaInfoService } from '../../services/decktracker/game-state-meta-info.service';
import { GameStateService } from '../../services/decktracker/game-state.service';
import { DecksStateBuilderService } from '../../services/decktracker/main/decks-state-builder.service';
import { DecktrackerStateLoaderService } from '../../services/decktracker/main/decktracker-state-loader.service';
import { ReplaysStateBuilderService } from '../../services/decktracker/main/replays-state-builder.service';
import { OverlayDisplayService } from '../../services/decktracker/overlay-display.service';
import { ZoneOrderingService } from '../../services/decktracker/zone-ordering.service';
import { DevService } from '../../services/dev.service';
import { GameEventsEmitterService } from '../../services/game-events-emitter.service';
import { GameEvents } from '../../services/game-events.service';
import { LogListenerService } from '../../services/log-listener.service';
import { LogRegisterService } from '../../services/log-register.service';
import { CollaboratorsService } from '../../services/mainwindow/store/collaborators.service';
import { MainWindowStoreService } from '../../services/mainwindow/store/main-window-store.service';
import { TwitchAuthService } from '../../services/mainwindow/twitch-auth.service';
import { EndGameListenerService } from '../../services/manastorm-bridge/end-game-listener.service';
import { EndGameUploaderService } from '../../services/manastorm-bridge/end-game-uploader.service';
import { GameHelper } from '../../services/manastorm-bridge/game-helper.service';
import { GameParserService } from '../../services/manastorm-bridge/game-parser.service';
import { ReplayManager } from '../../services/manastorm-bridge/replay-manager.service';
import { ReplayUploadService } from '../../services/manastorm-bridge/replay-upload.service';
import { MatchSummaryService } from '../../services/match-summary/match-summary.service';
import { PlayersInfoService } from '../../services/players-info.service';
import { GameEventsPluginService } from '../../services/plugins/game-events-plugin.service';
import { SettingsCommunicationService } from '../../services/settings/settings-communication.service';
import { GameStatsLoaderService } from '../../services/stats/game/game-stats-loader.service';
import { GameStatsUpdaterService } from '../../services/stats/game/game-stats-updater.service';
import { UserService } from '../../services/user.service';
import { SharedServicesModule } from '../shared-services/shared-services.module';

init({
	dsn: 'https://53b0813bb66246ae90c60442d05efefe@sentry.io/1338840',
	enabled: process.env.NODE_ENV === 'production',
	release: process.env.APP_VERSION,
});

console.log('version is ' + process.env.APP_VERSION);
console.log('environment is ' + process.env.NODE_ENV);
console.log('is local test? ' + process.env.LOCAL_TEST);

if (process.env.LOCAL_TEST) {
	console.error('LOCAL_TEST is true, this should never happen in prod');
}

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
	imports: [BrowserModule, HttpClientModule, BrowserAnimationsModule, SharedServicesModule.forRoot(), LZStringModule],
	declarations: [AppComponent],
	providers: [
		{ provide: ErrorHandler, useClass: SentryErrorHandler },
		AppBootstrapService,
		MainWindowStoreService,
		CollaboratorsService,
		UserService,

		DevService,
		GameEvents,
		GameEventsEmitterService,
		GameEventsPluginService,
		LogListenerService,
		LogParserService,
		LogRegisterService,
		SettingsCommunicationService,
		TwitchAuthService,
		PlayersInfoService,

		PackMonitor,
		PackStatsService,

		AchievementsMonitor,
		AchievementsNotificationService,
		RemoteAchievementsService,
		AchievementsVideoCaptureService,
		AchievementRecordingService,

		DecktrackerStateLoaderService,
		DecksStateBuilderService,
		ReplaysStateBuilderService,

		EndGameListenerService,
		EndGameUploaderService,
		GameHelper,
		GameParserService,
		ReplayUploadService,
		ReplayManager,
		GameStateService,

		GameStatsLoaderService,
		GameStatsUpdaterService,

		OverlayDisplayService,
		DeckCardService,
		DeckParserService,
		GameStateService,
		DynamicZoneHelperService,
		ZoneOrderingService,
		GameStateMetaInfoService,

		MatchSummaryService,

		TemporaryResolutionOverrideService,
		LZStringService,
	],
})
export class AppModule {}
