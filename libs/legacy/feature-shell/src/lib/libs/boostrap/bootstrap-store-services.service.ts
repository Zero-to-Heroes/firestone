import { Injectable } from '@angular/core';
import { ArenaCardStatsService, ArenaClassStatsService } from '@firestone/arena/common';
import { ConstructedPersonalDecksService } from '@firestone/constructed/common';
import { DuelsConfigService, DuelsPersonalDecksService } from '@firestone/duels/general';
import { PreferencesService } from '@firestone/shared/common/service';
import { AchievementsLiveProgressTrackingService } from '../../js/services/achievement/achievements-live-progress-tracking.service';
import { ArenaDraftManagerService } from '../../js/services/arena/arena-draft-manager.service';
import { BgsBoardHighlighterService } from '../../js/services/battlegrounds/bgs-board-highlighter.service';
import { BgsPerfectGamesService } from '../../js/services/battlegrounds/bgs-perfect-games.service';
import { BattlegroundsQuestsService } from '../../js/services/battlegrounds/bgs-quests.service';
import { BattlegroundsStoreService } from '../../js/services/battlegrounds/store/battlegrounds-store.service';
import { ConstructedMetaDecksStateService } from '../../js/services/decktracker/constructed-meta-decks-state-builder.service';
import { GameStateService } from '../../js/services/decktracker/game-state.service';
import { DecksProviderService } from '../../js/services/decktracker/main/decks-provider.service';
import { OverlayDisplayService } from '../../js/services/decktracker/overlay-display.service';
import { DuelsAdventureInfoService } from '../../js/services/duels/duels-adventure-info.service';
import { DuelsBucketsService } from '../../js/services/duels/duels-buckets.service';
import { DuelsDecksProviderService } from '../../js/services/duels/duels-decks-provider.service';
import { DuelsLeaderboardService } from '../../js/services/duels/duels-leaderboard.service';
import { DuelsMetaStatsService } from '../../js/services/duels/duels-meta-stats.service';
import { GameNativeStateStoreService } from '../../js/services/game/game-native-state-store.service';
import { LotteryWidgetControllerService } from '../../js/services/lottery/lottery-widget-controller.service';
import { LotteryService } from '../../js/services/lottery/lottery.service';
import { CollectionBootstrapService } from '../../js/services/mainwindow/store/collection-bootstrap.service';
import { MainWindowStoreService } from '../../js/services/mainwindow/store/main-window-store.service';
import { MercenariesSynergiesHighlightService } from '../../js/services/mercenaries/highlights/mercenaries-synergies-highlight.service';
import { MercenariesStoreService } from '../../js/services/mercenaries/mercenaries-store.service';
import { MercenariesOutOfCombatService } from '../../js/services/mercenaries/out-of-combat/mercenaries-out-of-combat.service';
import { ProfileUploaderService } from '../../js/services/profile/profile-uploader.service';
import { GameStatsProviderService } from '../../js/services/stats/game/game-stats-provider.service';
import { AppUiStoreService } from '../../js/services/ui-store/app-ui-store.service';
import { MailsService } from '../mails/services/mails.service';
import { ModsConfigService } from '../mods/services/mods-config.service';
import { TavernBrawlService } from '../tavern-brawl/services/tavern-brawl.service';

@Injectable()
export class BootstrapStoreServicesService {
	// All the constructors are there to start bootstrapping / registering everything
	constructor(
		private readonly store: AppUiStoreService,
		// TODO: this has a lot of dependencies, it should be refactored to limit the impact
		// and let the store be started up as soon as possible
		private readonly mainWindowStore: MainWindowStoreService,
		private readonly prefs: PreferencesService,
		private readonly gameState: GameStateService,
		private readonly gameNativeState: GameNativeStateStoreService,
		private readonly battlegroundsStore: BattlegroundsStoreService,
		private readonly mercenariesStore: MercenariesStoreService,
		private readonly mercenariesOutOfCombatStore: MercenariesOutOfCombatService,
		private readonly mercenariesSynergiesStore: MercenariesSynergiesHighlightService,
		private readonly mails: MailsService,
		private readonly tavernBrawl: TavernBrawlService,
		private readonly duelsDecksProviderService: DuelsDecksProviderService,
		private readonly decksProviderService: DecksProviderService,
		private readonly gameStatsProviderService: GameStatsProviderService,
		private readonly modsConfig: ModsConfigService,
		private readonly ini_LotterService: LotteryService,
		private readonly achievementsMonitor: AchievementsLiveProgressTrackingService,
		private readonly collectionBootstrapService: CollectionBootstrapService,
		private readonly init_BgsBoardHighlighterService: BgsBoardHighlighterService,
		private readonly ini_LotteryWidgetControllerService: LotteryWidgetControllerService,
		private readonly init_ProfileUploaderService: ProfileUploaderService,
		private readonly init_ConstructedMetaDecksStateService: ConstructedMetaDecksStateService,
		private readonly init_DuelsAdventureInfoService: DuelsAdventureInfoService,
		private readonly init_DuelsBucketsService: DuelsBucketsService,
		private readonly init_DuelsLeaderboardService: DuelsLeaderboardService,
		private readonly init_DuelsMetaStatsService: DuelsMetaStatsService,
		private readonly init_DuelsConfigService: DuelsConfigService,
		private readonly init_BattlegroundsQuestsService: BattlegroundsQuestsService,
		private readonly init_BgsPerfectGamesService: BgsPerfectGamesService,
		private readonly init_ArenaClassStatsService: ArenaClassStatsService,
		private readonly init_ArenaCardStatsService: ArenaCardStatsService,
		private readonly init_ArenaDraftManagerService: ArenaDraftManagerService,
		private readonly init_duelsPersonalDecksService: DuelsPersonalDecksService,
		private readonly init_constructedPersonalDeckService: ConstructedPersonalDecksService,
		// Other dependencies
		private readonly decktrackerDisplayEventBus: OverlayDisplayService,
	) {}

	public async bootstrapServices(): Promise<void> {
		await this.initStore();
	}

	private async initStore() {
		await this.store.start();
		await this.store.initComplete();
	}
}
