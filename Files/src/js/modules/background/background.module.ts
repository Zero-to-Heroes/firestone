import { HttpClientModule } from '@angular/common/http';
import { ErrorHandler, Injectable, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { captureException, init } from '@sentry/browser';
import { AppComponent } from '../../components/app.component';
import { AchievementStatsService } from '../../services/achievement/achievement-stats.service';
import { AchievementsMonitor } from '../../services/achievement/achievements-monitor.service';
import { AchievementsVideoCaptureService } from '../../services/achievement/achievements-video-capture.service';
import { TemporaryResolutionOverrideService } from '../../services/achievement/temporary-resolution-override-service';
import { AppBootstrapService } from '../../services/app-bootstrap.service';
import { LogParserService } from '../../services/collection/log-parser.service';
import { PackMonitor } from '../../services/collection/pack-monitor.service';
import { PackStatsService } from '../../services/collection/pack-stats.service';
import { DeckCardService } from '../../services/decktracker/deck-card.service';
import { DeckParserService } from '../../services/decktracker/deck-parser.service';
import { DynamicZoneHelperService } from '../../services/decktracker/dynamic-zone-helper.service';
import { GameStateService } from '../../services/decktracker/game-state.service';
import { ZoneOrderingService } from '../../services/decktracker/zone-ordering.service';
import { DevService } from '../../services/dev.service';
import { GameEvents } from '../../services/game-events.service';
import { LogListenerService } from '../../services/log-listener.service';
import { LogRegisterService } from '../../services/log-register.service';
import { CollaboratorsService } from '../../services/mainwindow/store/collaborators.service';
import { MainWindowStoreService } from '../../services/mainwindow/store/main-window-store.service';
import { TwitchAuthService } from '../../services/mainwindow/twitch-auth.service';
import { GameEventsPluginService } from '../../services/plugins/game-events-plugin.service';
import { SettingsCommunicationService } from '../../services/settings/settings-communication.service';
import { SharedServicesModule } from '../shared-services/shared-services.module';

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
	imports: [BrowserModule, HttpClientModule, BrowserAnimationsModule, SharedServicesModule.forRoot()],
	declarations: [AppComponent],
	providers: [
		{ provide: ErrorHandler, useClass: SentryErrorHandler },
		AppBootstrapService,
		MainWindowStoreService,
		CollaboratorsService,

		DevService,
		GameEvents,
		GameEventsPluginService,
		LogListenerService,
		LogParserService,
		LogRegisterService,
		SettingsCommunicationService,
		TwitchAuthService,

		PackMonitor,
		PackStatsService,

		AchievementsMonitor,
		AchievementStatsService,
		AchievementsVideoCaptureService,

		DeckCardService,
		DeckParserService,
		GameStateService,
		DynamicZoneHelperService,
		ZoneOrderingService,

		TemporaryResolutionOverrideService,
	],
})
export class AppModule {}
