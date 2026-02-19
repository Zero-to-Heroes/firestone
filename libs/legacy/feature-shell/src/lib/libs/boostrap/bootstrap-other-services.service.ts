import { Injectable } from '@angular/core';
import {
	AchievementsNotificationService,
	AchievementsStorageService,
	FirestoneRemoteAchievementsLoaderService,
	RawAchievementsLoaderService,
} from '@firestone/achievements/common';
import { EndGameListenerService, QuestsService, RewardMonitorService } from '@firestone/app/common';
import { OwHotkeyHandlerService } from '@firestone/app/ow-native';
import { ArenaRefService } from '@firestone/arena/common';
import { DiscordPresenceManagerService } from '@firestone/discord';
import {
	BgsBestUserStatsService,
	DeckParserService,
	GameModeDataService,
	GameStateFacadeService,
	OverlayDisplayService,
	RealTimeStatsService,
	ReviewIdService,
} from '@firestone/game-state';
import { MercenariesNavigationService } from '@firestone/mercenaries/common';
import { InGameReplayService, ModsBootstrapService, ModsManagerService } from '@firestone/mods/common';
import { GameStatusService } from '@firestone/shared/common/service';
import { HotkeyFacadeService } from '@firestone/shared/framework/core';
import { GameStatsProviderService } from '@firestone/stats/services';
import { TwitchAuthService } from '@firestone/twitch/common';
import { HearthArenaAnalyticsService } from '../../js/services/analytics/heartharena-analytics.service';
import { BgsPerfectGamesService } from '../../js/services/battlegrounds/bgs-perfect-games.service';
import { CardsMonitorService } from '../../js/services/collection/cards-monitor.service';
import { CollectionManager } from '../../js/services/collection/collection-manager.service';
import { CollectionStorageService } from '../../js/services/collection/collection-storage.service';
import { ConstructedConfigService } from '../../js/services/decktracker/constructed-config.service';
import { DecksProviderService } from '../../js/services/decktracker/main/decks-provider.service';
import { DevService } from '../../js/services/dev.service';
import { GlobalStatsService } from '../../js/services/global-stats/global-stats.service';
import { HsClientConfigService } from '../../js/services/hs-client-config.service';
import { LogRegisterService } from '../../js/services/log-register.service';
import { LiveStreamsService } from '../../js/services/mainwindow/live-streams.service';
import { OutOfCardsService } from '../../js/services/mainwindow/out-of-cards.service';
import { TwitchPresenceService } from '../../js/services/mainwindow/twitch-presence.service';
import { ReplaysNotificationService } from '../../js/services/replays/replays-notification.service';
import { SystemTrayService } from '../../js/services/system-tray.service';
import { MailsService } from '../mails/services/mails.service';
import { PackMonitor } from '../packs/services/pack-monitor.service';
import { PackStatsService } from '../packs/services/pack-stats.service';

@Injectable()
export class BootstrapOtherServicesService {
	// All the constructors are there to start bootstrapping / registering everything
	constructor(
		// Init them first
		private readonly init_LogRegisterService: LogRegisterService,
		private readonly init_LogParserService: CardsMonitorService,
		private readonly twitchAuth: TwitchAuthService,
		private readonly init_TwitchPresenceService: TwitchPresenceService,
		private readonly init_OutOfCardsAuth: OutOfCardsService,
		private readonly collectionDb: CollectionStorageService,
		private readonly achievementsDb: AchievementsStorageService,
		private readonly achievementsLoader: RawAchievementsLoaderService,
		private readonly packMonitor: PackMonitor,
		private readonly init_AchievementsNotifications: AchievementsNotificationService,
		private readonly packStatsService: PackStatsService,
		private readonly achievementStatsService: FirestoneRemoteAchievementsLoaderService,
		private readonly collectionManager: CollectionManager,
		private readonly deckParserService: DeckParserService,
		private readonly init_ReviewIdService: ReviewIdService,
		private readonly init_decktrackerDisplayService: OverlayDisplayService,
		private readonly init_endGameListenerService: EndGameListenerService,
		private readonly init_ReplaysNotificationService: ReplaysNotificationService,
		private readonly init_BgsInitService: BgsPerfectGamesService,
		private readonly init_BgsBestUserStatsService: BgsBestUserStatsService,
		private readonly init_HsClientConfig: HsClientConfigService,
		private readonly init_RewardMonitorService: RewardMonitorService,
		private readonly init_BgsRealTimeStatsService: RealTimeStatsService,
		private readonly ini_DecksProviderService: DecksProviderService,
		private readonly init_gameStatus: GameStatusService,
		private readonly init_quests: QuestsService,
		private readonly init_LiveStreamsService: LiveStreamsService,
		private readonly init_GameModeDataService: GameModeDataService,
		private readonly init_GameStatsProviderService: GameStatsProviderService,
		private readonly init_MailsService: MailsService,
		private readonly dev: DevService,
		private readonly init_SystemTrayService: SystemTrayService,
		private readonly init_HearthArenaAnalyticsService: HearthArenaAnalyticsService,
		private readonly init_ConstructedConfigService: ConstructedConfigService,
		private readonly init_DiscordPresenceManagerService: DiscordPresenceManagerService,
		private readonly init_GameStateFacadeService: GameStateFacadeService,
		private readonly init_MercenariesNavigationService: MercenariesNavigationService,
		private readonly init_ArenaRefService: ArenaRefService,
		// TODO: might not be the best place
		private readonly modsBootstrap: ModsBootstrapService,
		private readonly modsManager: ModsManagerService,
		private readonly init_OwHotkeyHandlerService: OwHotkeyHandlerService,
		private readonly init_HotkeyFacadeService: HotkeyFacadeService,
		private readonly init_GlobalStatsService: GlobalStatsService,
		private readonly init_InGameReplayService: InGameReplayService,
	) {}

	public async bootstrapServices(): Promise<void> {
		this.modsBootstrap.init();
	}
}
