import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AchievementsMonitor } from '../../js/services/achievement/achievements-monitor.service';
import { AchievementsNotificationService } from '../../js/services/achievement/achievements-notification.service';
import { AchievementsLoaderService } from '../../js/services/achievement/data/achievements-loader.service';
import { RemoteAchievementsService } from '../../js/services/achievement/remote-achievements.service';
import { AdService } from '../../js/services/ad.service';
import { BgsBestUserStatsService } from '../../js/services/battlegrounds/bgs-best-user-stats.service';
import { BgsInitService } from '../../js/services/battlegrounds/bgs-init.service';
import { BattlegroundsStoreService } from '../../js/services/battlegrounds/store/battlegrounds-store.service';
import { RealTimeStatsService } from '../../js/services/battlegrounds/store/real-time-stats/real-time-stats.service';
import { CardsInitService } from '../../js/services/cards-init.service';
import { CardsMonitorService } from '../../js/services/collection/cards-monitor.service';
import { CollectionManager } from '../../js/services/collection/collection-manager.service';
import { CollectionStorageService } from '../../js/services/collection/collection-storage.service';
import { DebugService } from '../../js/services/debug.service';
import { ArenaRunParserService } from '../../js/services/decktracker/arena-run-parser.service';
import { CardsHighlightService } from '../../js/services/decktracker/card-highlight/cards-highlight.service';
import { ConstructedMetaDecksStateBuilderService } from '../../js/services/decktracker/constructed-meta-decks-state-builder.service';
import { DeckParserService } from '../../js/services/decktracker/deck-parser.service';
import { GameStateService } from '../../js/services/decktracker/game-state.service';
import { DecksProviderService } from '../../js/services/decktracker/main/decks-provider.service';
import { OverlayDisplayService } from '../../js/services/decktracker/overlay-display.service';
import { DevService } from '../../js/services/dev.service';
import { DuelsDecksProviderService } from '../../js/services/duels/duels-decks-provider.service';
import { DuelsLootParserService } from '../../js/services/duels/duels-loot-parser.service';
import { DuelsRewardsService } from '../../js/services/duels/duels-rewards.service';
import { DuelsRunIdService } from '../../js/services/duels/duels-run-id.service';
import { GameModeDataService } from '../../js/services/game-mode-data.service';
import { GameStatusService } from '../../js/services/game-status.service';
import { GameNativeStateStoreService } from '../../js/services/game/game-native-state-store.service';
import { GlobalStatsNotifierService } from '../../js/services/global-stats/global-stats-notifier.service';
import { LocalizationService } from '../../js/services/localization.service';
import { LogRegisterService } from '../../js/services/log-register.service';
import { LiveStreamsService } from '../../js/services/mainwindow/live-streams.service';
import { OutOfCardsService } from '../../js/services/mainwindow/out-of-cards.service';
import { CollectionBootstrapService } from '../../js/services/mainwindow/store/collection-bootstrap.service';
import { TwitchAuthService } from '../../js/services/mainwindow/twitch-auth.service';
import { TwitchPresenceService } from '../../js/services/mainwindow/twitch-presence.service';
import { EndGameListenerService } from '../../js/services/manastorm-bridge/end-game-listener.service';
import { MercenariesSynergiesHighlightService } from '../../js/services/mercenaries/highlights/mercenaries-synergies-highlight.service';
import { MercenariesMemoryUpdateService } from '../../js/services/mercenaries/mercenaries-memory-updates.service';
import { MercenariesStoreService } from '../../js/services/mercenaries/mercenaries-store.service';
import { MercenariesOutOfCombatService } from '../../js/services/mercenaries/out-of-combat/mercenaries-out-of-combat.service';
import { OwNotificationsService } from '../../js/services/notifications.service';
import { OwUtilsService } from '../../js/services/plugins/ow-utils.service';
import { PreferencesService } from '../../js/services/preferences.service';
import { QuestsService } from '../../js/services/quests.service';
import { ReplaysNotificationService } from '../../js/services/replays/replays-notification.service';
import { ReviewIdService } from '../../js/services/review-id.service';
import { RewardMonitorService } from '../../js/services/rewards/rewards-monitor';
import { SettingsCommunicationService } from '../../js/services/settings/settings-communication.service';
import { GameStatsProviderService } from '../../js/services/stats/game/game-stats-provider.service';
import { SystemTrayService } from '../../js/services/system-tray.service';
import { AppUiStoreService } from '../../js/services/ui-store/app-ui-store.service';
import { MailsService } from '../mails/services/mails.service';
import { PackMonitor } from '../packs/services/pack-monitor.service';
import { PackStatsService } from '../packs/services/pack-stats.service';
import { TavernBrawlService } from '../tavern-brawl/services/tavern-brawl.service';
import { AchievementsStorageService as AchievementsDb } from '../../js/services/achievement/achievements-storage.service';
import { sleep } from '../../js/services/utils';

@Injectable()
export class BootstrapEssentialServicesService {
	// All the constructors are there to start bootstrapping / registering everything
	constructor(
		private readonly initCardsService: CardsInitService,
		private readonly debugService: DebugService,
		private readonly notifs: OwNotificationsService,
		private readonly settingsCommunicationService: SettingsCommunicationService,
		private readonly init_OWUtilsService: OwUtilsService,
	) {}

	public async bootstrapServices(): Promise<void> {
		// First initialize the cards DB, as some of the dependencies injected in
		// app-bootstrap won't be able to start without the cards DB in place
		// Init is started in the constructor, but we make sure that all cards are properly retrieved before moving forward
		console.debug('[bootstrap] init cards service');
		await this.initCardsService.init();
		console.debug('[bootstrap] init done');
	}
}
