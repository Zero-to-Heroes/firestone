import { HttpClientModule } from '@angular/common/http';
import { ErrorHandler, Injectable, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { captureException, init, Integrations } from '@sentry/browser';
import { CaptureConsole, ExtraErrorData } from '@sentry/integrations';
import { LZStringModule, LZStringService } from 'ng-lz-string';
import { AppComponent } from '../../components/app.component';
import { AchievementsManager } from '../../services/achievement/achievements-manager.service';
import { AchievementsMonitor } from '../../services/achievement/achievements-monitor.service';
import { AchievementsNotificationService } from '../../services/achievement/achievements-notification.service';
import { RemoteAchievementsService } from '../../services/achievement/remote-achievements.service';
import { TemporaryResolutionOverrideService } from '../../services/achievement/temporary-resolution-override-service';
import { AdService } from '../../services/ad.service';
import { ApiRunner } from '../../services/api-runner';
import { AppBootstrapService } from '../../services/app-bootstrap.service';
import { BgsBattleSimulationService } from '../../services/battlegrounds/bgs-battle-simulation.service';
import { BgsBestUserStatsService } from '../../services/battlegrounds/bgs-best-user-stats.service';
import { BgsBuilderService } from '../../services/battlegrounds/bgs-builder.service';
import { BgsGlobalStatsService } from '../../services/battlegrounds/bgs-global-stats.service';
import { BgsInitService } from '../../services/battlegrounds/bgs-init.service';
import { BgsRunStatsService } from '../../services/battlegrounds/bgs-run-stats.service';
import { BattlegroundsStoreService } from '../../services/battlegrounds/store/battlegrounds-store.service';
import { RealTimeStatsService } from '../../services/battlegrounds/store/real-time-stats/real-time-stats.service';
import { CardNotificationsService } from '../../services/collection/card-notifications.service';
import { CardsMonitorService } from '../../services/collection/cards-monitor.service';
import { PackMonitor } from '../../services/collection/pack-monitor.service';
import { PackStatsService } from '../../services/collection/pack-stats.service';
import { AiDeckService } from '../../services/decktracker/ai-deck-service.service';
import { DeckCardService } from '../../services/decktracker/deck-card.service';
import { DeckParserService } from '../../services/decktracker/deck-parser.service';
import { DungeonLootParserService } from '../../services/decktracker/dungeon-loot-parser.service';
import { DynamicZoneHelperService } from '../../services/decktracker/dynamic-zone-helper.service';
import { DeckManipulationHelper } from '../../services/decktracker/event-parser/deck-manipulation-helper';
import { SecretsParserService } from '../../services/decktracker/event-parser/secrets/secrets-parser.service';
import { GameStateMetaInfoService } from '../../services/decktracker/game-state-meta-info.service';
import { GameStateService } from '../../services/decktracker/game-state.service';
import { DecksStateBuilderService } from '../../services/decktracker/main/decks-state-builder.service';
import { DecktrackerStateLoaderService } from '../../services/decktracker/main/decktracker-state-loader.service';
import { ReplaysStateBuilderService } from '../../services/decktracker/main/replays-state-builder.service';
import { OverlayDisplayService } from '../../services/decktracker/overlay-display.service';
import { SecretConfigService } from '../../services/decktracker/secret-config.service';
import { ZoneOrderingService } from '../../services/decktracker/zone-ordering.service';
import { DevService } from '../../services/dev.service';
import { DuelsStateBuilderService } from '../../services/duels/duels-state-builder.service';
import { GameEventsEmitterService } from '../../services/game-events-emitter.service';
import { GameEvents } from '../../services/game-events.service';
import { GlobalStatsNotifierService } from '../../services/global-stats/global-stats-notifier.service';
import { GlobalStatsService } from '../../services/global-stats/global-stats.service';
import { LogListenerService } from '../../services/log-listener.service';
import { LogRegisterService } from '../../services/log-register.service';
import { OutOfCardsService } from '../../services/mainwindow/out-of-cards.service';
import { CollaboratorsService } from '../../services/mainwindow/store/collaborators.service';
import { CollectionBootstrapService } from '../../services/mainwindow/store/collection-bootstrap.service';
import { AchievementStateHelper } from '../../services/mainwindow/store/helper/achievement-state-helper';
import { AchievementUpdateHelper } from '../../services/mainwindow/store/helper/achievement-update-helper';
import { MainWindowStoreService } from '../../services/mainwindow/store/main-window-store.service';
import { StoreBootstrapService } from '../../services/mainwindow/store/store-bootstrap.service';
import { TwitchAuthService } from '../../services/mainwindow/twitch-auth.service';
import { EndGameListenerService } from '../../services/manastorm-bridge/end-game-listener.service';
import { EndGameUploaderService } from '../../services/manastorm-bridge/end-game-uploader.service';
import { GameParserService } from '../../services/manastorm-bridge/game-parser.service';
import { ReplayUploadService } from '../../services/manastorm-bridge/replay-upload.service';
import { PatchesConfigService } from '../../services/patches-config.service';
import { PlayersInfoService } from '../../services/players-info.service';
import { GameEventsPluginService } from '../../services/plugins/game-events-plugin.service';
import { ReplaysNotificationService } from '../../services/replays/replays-notification.service';
import { RewardMonitorService } from '../../services/rewards/rewards-monitor';
import { SettingsCommunicationService } from '../../services/settings/settings-communication.service';
import { GameStatsLoaderService } from '../../services/stats/game/game-stats-loader.service';
import { GameStatsUpdaterService } from '../../services/stats/game/game-stats-updater.service';
import { UserService } from '../../services/user.service';
import { SharedServicesModule } from '../shared-services/shared-services.module';

console.log('version is ' + process.env.APP_VERSION);
console.log('environment is ' + process.env.NODE_ENV);
console.log('is local test? ' + process.env.LOCAL_TEST);

init({
	dsn: 'https://53b0813bb66246ae90c60442d05efefe@o92856.ingest.sentry.io/1338840',
	enabled: process.env.NODE_ENV === 'production',
	release: process.env.APP_VERSION,
	attachStacktrace: true,
	sampleRate: 0.1,
	integrations: [
		new Integrations.GlobalHandlers({
			onerror: true,
			onunhandledrejection: true,
		}),
		new ExtraErrorData(),
		new CaptureConsole({
			levels: ['error'],
		}),
	],
});

if (process.env.LOCAL_TEST) {
	console.error('LOCAL_TEST is true, this should never happen in prod');
}

@Injectable()
export class SentryErrorHandler implements ErrorHandler {
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
		AdService,
		MainWindowStoreService,
		StoreBootstrapService,
		CollaboratorsService,
		UserService,
		ApiRunner,

		DevService,
		GameEvents,
		GameEventsEmitterService,
		GameEventsPluginService,
		LogListenerService,
		CardsMonitorService,
		LogRegisterService,
		SettingsCommunicationService,
		TwitchAuthService,
		OutOfCardsService,
		PlayersInfoService,

		CollectionBootstrapService,
		PackMonitor,
		PackStatsService,
		CardNotificationsService,

		AchievementsMonitor,
		AchievementsNotificationService,
		RemoteAchievementsService,
		AchievementStateHelper,
		AchievementUpdateHelper,
		AchievementsManager,

		DecktrackerStateLoaderService,
		DecksStateBuilderService,
		ReplaysStateBuilderService,

		EndGameListenerService,
		EndGameUploaderService,
		GameParserService,
		ReplayUploadService,
		SecretsParserService,
		GameStateService,
		DeckManipulationHelper,

		BattlegroundsStoreService,
		BgsInitService,
		BgsBuilderService,
		BgsGlobalStatsService,
		BgsBattleSimulationService,
		BgsRunStatsService,
		BgsBestUserStatsService,
		RealTimeStatsService,

		AiDeckService,
		SecretConfigService,
		PatchesConfigService,

		GameStatsLoaderService,
		GameStatsUpdaterService,

		OverlayDisplayService,
		DeckCardService,
		DeckParserService,
		DungeonLootParserService,
		GameStateService,
		DynamicZoneHelperService,
		ZoneOrderingService,
		GameStateMetaInfoService,

		DuelsStateBuilderService,

		GlobalStatsService,
		GlobalStatsNotifierService,

		ReplaysNotificationService,
		RewardMonitorService,

		TemporaryResolutionOverrideService,
		LZStringService,
	],
})
export class AppModule {}
