import { Injectable } from '@angular/core';
import { AchievementsNavigationService } from '@firestone/achievements/common';
import {
	ArenDeckDetailsService,
	ArenaCardStatsService,
	ArenaClassStatsService,
	ArenaHighWinsRunsService,
	ArenaMulliganGuideGuardianService,
	ArenaMulliganGuideService,
	ArenaNavigationService,
	ArenaRunsService,
} from '@firestone/arena/common';
import {
	BattlegroundsNavigationService,
	BattlegroundsOfficialLeaderboardService,
	BattlegroundsQuestsService,
	BgsCommonBootstrapService,
	BgsInGameHeroSelectionGuardianService,
	BgsInGameQuestsGuardianService,
	BgsInGameQuestsService,
	BgsMatchPlayersMmrService,
	BgsMetaHeroStatsDuoService,
	BgsMetaHeroStatsService,
	BgsPlayerHeroStatsService,
	BgsStateFacadeService,
} from '@firestone/battlegrounds/common';
import { BgsSimulatorControllerService } from '@firestone/battlegrounds/simulator';
import { HearthpwnService } from '@firestone/collection/common';
import { CommunityBootstrapService } from '@firestone/communities/common';
import {
	ConstructedMetaDecksStateService,
	ConstructedMulliganGuideGuardianService,
	ConstructedMulliganGuideService,
	ConstructedPersonalDecksService,
} from '@firestone/constructed/common';
import { DuelsConfigService, DuelsPersonalDecksService } from '@firestone/duels/general';
import { BootstrapGameStateService } from '@firestone/game-state';
import { MainWindowNavigationService } from '@firestone/mainwindow/common';
import { BgsSceneService, CardMousedOverService } from '@firestone/memory';
import { ModsConfigService } from '@firestone/mods/common';
import { BootstrapSettingsService } from '@firestone/settings';
import { ExpertContributorsService, PreferencesService } from '@firestone/shared/common/service';
import { CardRulesService } from '@firestone/shared/framework/core';
import { AchievementsLiveProgressTrackingService } from '../../js/services/achievement/achievements-live-progress-tracking.service';
import { ArenaDraftManagerService } from '../../js/services/arena/arena-draft-manager.service';
import { BgsPerfectGamesService } from '../../js/services/battlegrounds/bgs-perfect-games.service';
import { BattlegroundsStoreService } from '../../js/services/battlegrounds/store/battlegrounds-store.service';
import { DeckParserFacadeService } from '../../js/services/decktracker/deck-parser-facade.service';
import { GameStateService } from '../../js/services/decktracker/game-state.service';
import { DecksProviderService } from '../../js/services/decktracker/main/decks-provider.service';
import { OverlayDisplayService } from '../../js/services/decktracker/overlay-display.service';
import { DuelsAdventureInfoService } from '../../js/services/duels/duels-adventure-info.service';
import { DuelsBucketsService } from '../../js/services/duels/duels-buckets.service';
import { DuelsDecksProviderService } from '../../js/services/duels/duels-decks-provider.service';
import { DuelsHeroStatsService } from '../../js/services/duels/duels-hero-stats.service';
import { DuelsLeaderboardService } from '../../js/services/duels/duels-leaderboard.service';
import { DuelsMetaStatsService } from '../../js/services/duels/duels-meta-stats.service';
import { GameNativeStateStoreService } from '../../js/services/game/game-native-state-store.service';
import { LotteryWidgetControllerService } from '../../js/services/lottery/lottery-widget-controller.service';
import { LotteryService } from '../../js/services/lottery/lottery.service';
import { CollectionBootstrapService } from '../../js/services/mainwindow/store/collection-bootstrap.service';
import { MainWindowStateFacadeService } from '../../js/services/mainwindow/store/main-window-state-facade.service';
import { MainWindowStoreService } from '../../js/services/mainwindow/store/main-window-store.service';
import { MercenariesSynergiesHighlightService } from '../../js/services/mercenaries/highlights/mercenaries-synergies-highlight.service';
import { MercenariesStoreService } from '../../js/services/mercenaries/mercenaries-store.service';
import { MercenariesOutOfCombatService } from '../../js/services/mercenaries/out-of-combat/mercenaries-out-of-combat.service';
import { ProfileUploaderService } from '../../js/services/profile/profile-uploader.service';
import { GameStatsProviderService } from '../../js/services/stats/game/game-stats-provider.service';
import { AppUiStoreService } from '../../js/services/ui-store/app-ui-store.service';
import { MailsService } from '../mails/services/mails.service';
import { TavernBrawlService } from '../tavern-brawl/services/tavern-brawl.service';

@Injectable()
export class BootstrapStoreServicesService {
	// All the constructors are there to start bootstrapping / registering everything
	constructor(
		private readonly store: AppUiStoreService,
		// TODO: this has a lot of dependencies, it should be refactored to limit the impact
		// and let the store be started up as soon as possible
		private readonly init_BgsSceneService: BgsSceneService,
		private readonly mainWindowStore: MainWindowStoreService,
		private readonly init_MainWindowNavigationService: MainWindowNavigationService,
		private readonly init_MainWindowStateFacadeService: MainWindowStateFacadeService,
		private readonly prefs: PreferencesService,
		private readonly gameState: GameStateService,
		private readonly gameNativeState: GameNativeStateStoreService,
		private readonly battlegroundsStore: BattlegroundsStoreService,
		private readonly mercenariesStore: MercenariesStoreService,
		private readonly mercenariesOutOfCombatStore: MercenariesOutOfCombatService,
		private readonly mercenariesSynergiesStore: MercenariesSynergiesHighlightService,
		private readonly mails: MailsService,
		private readonly duelsDecksProviderService: DuelsDecksProviderService,
		private readonly decksProviderService: DecksProviderService,
		private readonly gameStatsProviderService: GameStatsProviderService,
		private readonly modsConfig: ModsConfigService,
		private readonly ini_LotterService: LotteryService,
		private readonly achievementsMonitor: AchievementsLiveProgressTrackingService,
		private readonly collectionBootstrapService: CollectionBootstrapService,
		private readonly ini_LotteryWidgetControllerService: LotteryWidgetControllerService,
		private readonly init_ProfileUploaderService: ProfileUploaderService,
		private readonly init_ConstructedMetaDecksStateService: ConstructedMetaDecksStateService,
		private readonly init_DuelsAdventureInfoService: DuelsAdventureInfoService,
		private readonly init_DuelsBucketsService: DuelsBucketsService,
		private readonly init_DuelsLeaderboardService: DuelsLeaderboardService,
		private readonly init_DuelsMetaStatsService: DuelsMetaStatsService,
		private readonly init_DuelsHeroStatsService: DuelsHeroStatsService,
		private readonly init_DuelsConfigService: DuelsConfigService,
		private readonly init_BattlegroundsQuestsService: BattlegroundsQuestsService,
		private readonly init_BgsInGameQuestsService: BgsInGameQuestsService,
		private readonly init_BgsInGameQuestsGuardianService: BgsInGameQuestsGuardianService,
		private readonly init_BgsCommonBootstrapService: BgsCommonBootstrapService,
		private readonly init_BgsInGameHeroSelectionGuardianService: BgsInGameHeroSelectionGuardianService,
		private readonly init_BgsStateFacadeService: BgsStateFacadeService,
		private readonly init_BgsPerfectGamesService: BgsPerfectGamesService,
		private readonly init_BgsMatchPlayersMmrService: BgsMatchPlayersMmrService,
		private readonly init_BgsPlayerHeroStatsService: BgsPlayerHeroStatsService,
		private readonly init_BgsMetaHeroStatsService: BgsMetaHeroStatsService,
		private readonly init_BgsMetaHeroStatsDuoService: BgsMetaHeroStatsDuoService,
		private readonly init_BattlegroundsOfficialLeaderboardService: BattlegroundsOfficialLeaderboardService,
		private readonly init_BattlegroundsNavigationService: BattlegroundsNavigationService,
		private readonly init_BgsSimulatorControllerService: BgsSimulatorControllerService,
		private readonly init_ArenaClassStatsService: ArenaClassStatsService,
		private readonly init_ArenaCardStatsService: ArenaCardStatsService,
		private readonly init_ArenaDraftManagerService: ArenaDraftManagerService,
		private readonly init_ArenaHighWinsRunsService: ArenaHighWinsRunsService,
		private readonly init_ArenaRunsService: ArenaRunsService,
		private readonly init_duelsPersonalDecksService: DuelsPersonalDecksService,
		private readonly init_constructedPersonalDeckService: ConstructedPersonalDecksService,
		private readonly init_ConstructedMulliganGuideService: ConstructedMulliganGuideService,
		private readonly init_ArenaMulliganGuideService: ArenaMulliganGuideService,
		private readonly init_ArenaMulliganGuideGuardianService: ArenaMulliganGuideGuardianService,
		private readonly init_ArenaNavigationService: ArenaNavigationService,
		private readonly init_ArenDeckDetailsService: ArenDeckDetailsService,
		private readonly init_ConstructedMulliganGuideGuardianService: ConstructedMulliganGuideGuardianService,
		private readonly init_CardMousedOverService: CardMousedOverService,
		private readonly init_CommunityBootstrapService: CommunityBootstrapService,
		private readonly init_AchievementsNavigationService: AchievementsNavigationService,
		private readonly init_BootstrapSettingsService: BootstrapSettingsService,
		private readonly init_BootstrapGameStateService: BootstrapGameStateService,
		private readonly init_HearthpwnService: HearthpwnService,
		private readonly init_CardRulesService: CardRulesService,
		private readonly init_ExpertContributorsService: ExpertContributorsService,
		private readonly init_TavernBrawlService: TavernBrawlService,
		private readonly init_DeckParserFacadeService: DeckParserFacadeService,
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
