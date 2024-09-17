import { Injectable } from '@angular/core';
import { DiscordPresenceManagerService } from '@firestone/discord';
import { GameStatusService } from '@firestone/shared/common/service';
import { TwitchAuthService } from '@firestone/twitch/common';
import { AchievementsNotificationService } from '../../js/services/achievement/achievements-notification.service';
import { AchievementsStorageService as AchievementsDb } from '../../js/services/achievement/achievements-storage.service';
import { FirestoneRemoteAchievementsLoaderService } from '../../js/services/achievement/data/firestone-remote-achievements-loader.service';
import { RawAchievementsLoaderService } from '../../js/services/achievement/data/raw-achievements-loader.service';
import { HearthArenaAnalyticsService } from '../../js/services/analytics/heartharena-analytics.service';
import { BgsBestUserStatsService } from '../../js/services/battlegrounds/bgs-best-user-stats.service';
import { BgsPerfectGamesService } from '../../js/services/battlegrounds/bgs-perfect-games.service';
import { RealTimeStatsService } from '../../js/services/battlegrounds/store/real-time-stats/real-time-stats.service';
import { CardsMonitorService } from '../../js/services/collection/cards-monitor.service';
import { CollectionManager } from '../../js/services/collection/collection-manager.service';
import { CollectionStorageService } from '../../js/services/collection/collection-storage.service';
import { CardsHighlightService } from '../../js/services/decktracker/card-highlight/cards-highlight.service';
import { ConstructedConfigService } from '../../js/services/decktracker/constructed-config.service';
import { DeckParserService } from '../../js/services/decktracker/deck-parser.service';
import { DecksProviderService } from '../../js/services/decktracker/main/decks-provider.service';
import { OverlayDisplayService } from '../../js/services/decktracker/overlay-display.service';
import { DevService } from '../../js/services/dev.service';
import { DuelsDecksProviderService } from '../../js/services/duels/duels-decks-provider.service';
import { DuelsLootParserService } from '../../js/services/duels/duels-loot-parser.service';
import { DuelsRewardsService } from '../../js/services/duels/duels-rewards.service';
import { DuelsRunIdService } from '../../js/services/duels/duels-run-id.service';
import { GameModeDataService } from '../../js/services/game-mode-data.service';
import { GlobalStatsNotifierService } from '../../js/services/global-stats/global-stats-notifier.service';
import { HsClientConfigService } from '../../js/services/hs-client-config.service';
import { LogRegisterService } from '../../js/services/log-register.service';
import { LiveStreamsService } from '../../js/services/mainwindow/live-streams.service';
import { OutOfCardsService } from '../../js/services/mainwindow/out-of-cards.service';
import { TwitchPresenceService } from '../../js/services/mainwindow/twitch-presence.service';
import { EndGameListenerService } from '../../js/services/manastorm-bridge/end-game-listener.service';
import { QuestsService } from '../../js/services/quests.service';
import { ReplaysNotificationService } from '../../js/services/replays/replays-notification.service';
import { ReviewIdService } from '../../js/services/review-id.service';
import { RewardMonitorService } from '../../js/services/rewards/rewards-monitor';
import { GameStatsProviderService } from '../../js/services/stats/game/game-stats-provider.service';
import { SystemTrayService } from '../../js/services/system-tray.service';
import { MailsService } from '../mails/services/mails.service';
import { ModsBootstrapService } from '../mods/services/mods-bootstrap.service';
import { ModsManagerService } from '../mods/services/mods-manager.service';
import { PackMonitor } from '../packs/services/pack-monitor.service';
import { PackStatsService } from '../packs/services/pack-stats.service';
import { TavernBrawlService } from '../tavern-brawl/services/tavern-brawl.service';

@Injectable()
export class BootstrapOtherServicesService {
	// All the constructors are there to start bootstrapping / registering everything
	constructor(
		private readonly twitchAuth: TwitchAuthService,
		private readonly init_TwitchPresenceService: TwitchPresenceService,
		private readonly init_OutOfCardsAuth: OutOfCardsService,
		private readonly collectionDb: CollectionStorageService,
		private readonly achievementsDb: AchievementsDb,
		private readonly achievementsLoader: RawAchievementsLoaderService,
		private readonly packMonitor: PackMonitor,
		private readonly init_AchievementsNotifications: AchievementsNotificationService,
		private readonly packStatsService: PackStatsService,
		private readonly achievementStatsService: FirestoneRemoteAchievementsLoaderService,
		private readonly collectionManager: CollectionManager,
		private readonly deckParserService: DeckParserService,
		private readonly init_dungeonLootParserService: DuelsLootParserService,
		private readonly init_DuelsRewardsService: DuelsRewardsService,
		private readonly init_DuelsRunIdService: DuelsRunIdService,
		private readonly init_ReviewIdService: ReviewIdService,
		private readonly init_decktrackerDisplayService: OverlayDisplayService,
		private readonly init_endGameListenerService: EndGameListenerService,
		private readonly init_GlobalStatsNotifierService: GlobalStatsNotifierService,
		private readonly init_ReplaysNotificationService: ReplaysNotificationService,
		private readonly init_BgsInitService: BgsPerfectGamesService,
		private readonly init_BgsBestUserStatsService: BgsBestUserStatsService,
		private readonly init_HsClientConfig: HsClientConfigService,
		private readonly init_LogRegisterService: LogRegisterService,
		private readonly init_RewardMonitorService: RewardMonitorService,
		private readonly init_BgsRealTimeStatsService: RealTimeStatsService,
		private readonly init_LogParserService: CardsMonitorService,
		private readonly init_CardsHighlightService: CardsHighlightService,
		private readonly ini_DecksProviderService: DecksProviderService,
		private readonly init_gameStatus: GameStatusService,
		private readonly init_quests: QuestsService,
		private readonly init_LiveStreamsService: LiveStreamsService,
		private readonly init_GameModeDataService: GameModeDataService,
		private readonly init_GameStatsProviderService: GameStatsProviderService,
		private readonly init_DuelsDecksProviderService: DuelsDecksProviderService,
		private readonly init_MailsService: MailsService,
		private readonly init_TavernBrawlService: TavernBrawlService,
		private readonly dev: DevService,
		private readonly init_SystemTrayService: SystemTrayService,
		private readonly init_HearthArenaAnalyticsService: HearthArenaAnalyticsService,
		private readonly init_ConstructedConfigService: ConstructedConfigService,
		private readonly init_DiscordPresenceManagerService: DiscordPresenceManagerService,
		// TODO: might not be the best place
		private readonly modsBootstrap: ModsBootstrapService,
		private readonly modsManager: ModsManagerService,
	) {}

	public async bootstrapServices(): Promise<void> {
		this.modsBootstrap.init();
		this.modsManager.init();
	}
}
