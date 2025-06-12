import { Injectable } from '@angular/core';
import { AchievementsNavigationService } from '@firestone/achievements/common';
import { GameNativeStateStoreService } from '@firestone/app/common';
import {
	ArenDeckDetailsService,
	ArenaCardStatsService,
	ArenaClassStatsService,
	ArenaDiscoversGuardianService,
	ArenaDraftGuardianService,
	ArenaDraftManagerService,
	ArenaHighWinsRunsService,
	ArenaMulliganGuideGuardianService,
	ArenaMulliganGuideService,
	ArenaNavigationService,
	ArenaRunsService,
} from '@firestone/arena/common';
import {
	BattlegroundsAnomaliesService,
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
} from '@firestone/battlegrounds/common';
import { BgsSimulatorControllerService } from '@firestone/battlegrounds/simulator';
import { HearthpwnService, HsGuruService } from '@firestone/collection/common';
import { CommunityBootstrapService } from '@firestone/communities/common';
import {
	ConstructedDiscoverService,
	ConstructedDiscoversGuardianService,
	ConstructedMetaDecksStateService,
	ConstructedMulliganGuideGuardianService,
	ConstructedMulliganGuideService,
	ConstructedPersonalDecksService,
} from '@firestone/constructed/common';
import { BootstrapGameStateService } from '@firestone/game-state';
import { MainWindowNavigationService } from '@firestone/mainwindow/common';
import { BgsSceneService, CardMousedOverService } from '@firestone/memory';
import { ModsConfigService } from '@firestone/mods/common';
import { AccountService } from '@firestone/profile/common';
import { BootstrapSettingsService, SettingsControllerService } from '@firestone/settings';
import {
	AppNavigationService,
	ExpertContributorsService,
	OwLegacyPremiumService,
	PreferencesService,
	PremiumDeeplinkService,
	SubscriptionService,
	TebexService,
} from '@firestone/shared/common/service';
import { CardRulesService, OwUtilsService } from '@firestone/shared/framework/core';
import { AchievementsLiveProgressTrackingService } from '../../js/services/achievement/achievements-live-progress-tracking.service';
import { AdService } from '../../js/services/ad.service';
import { BgsPerfectGamesService } from '../../js/services/battlegrounds/bgs-perfect-games.service';
import { DeckParserFacadeService } from '../../js/services/decktracker/deck-parser-facade.service';
import { GameStateService } from '../../js/services/decktracker/game-state.service';
import { DecksProviderService } from '../../js/services/decktracker/main/decks-provider.service';
import { OverlayDisplayService } from '../../js/services/decktracker/overlay-display.service';
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
		private readonly init_OWUtilsService: OwUtilsService, // WindowManager
		private readonly init_SettingsControllerService: SettingsControllerService,
		private readonly init_AppNavigationService: AppNavigationService,
		private readonly init_SubscriptionService: SubscriptionService,
		private readonly init_PremiumDeeplinkService: PremiumDeeplinkService,
		private readonly init_TebexService: TebexService,
		private readonly init_OwLegacyPremiumService: OwLegacyPremiumService,
		private readonly init_AdsService: AdService,
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
		private readonly mercenariesStore: MercenariesStoreService,
		private readonly mercenariesOutOfCombatStore: MercenariesOutOfCombatService,
		private readonly mercenariesSynergiesStore: MercenariesSynergiesHighlightService,
		private readonly mails: MailsService,
		private readonly decksProviderService: DecksProviderService,
		private readonly gameStatsProviderService: GameStatsProviderService,
		private readonly modsConfig: ModsConfigService,
		private readonly ini_LotterService: LotteryService,
		private readonly achievementsMonitor: AchievementsLiveProgressTrackingService,
		private readonly collectionBootstrapService: CollectionBootstrapService,
		private readonly ini_LotteryWidgetControllerService: LotteryWidgetControllerService,
		private readonly init_ProfileUploaderService: ProfileUploaderService,
		private readonly init_ConstructedMetaDecksStateService: ConstructedMetaDecksStateService,
		private readonly init_BattlegroundsQuestsService: BattlegroundsQuestsService,
		private readonly init_BattlegroundsAnomaliesService: BattlegroundsAnomaliesService,
		private readonly init_BgsInGameQuestsService: BgsInGameQuestsService,
		private readonly init_BgsInGameQuestsGuardianService: BgsInGameQuestsGuardianService,
		private readonly init_BgsCommonBootstrapService: BgsCommonBootstrapService,
		private readonly init_BgsInGameHeroSelectionGuardianService: BgsInGameHeroSelectionGuardianService,
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
		private readonly init_constructedPersonalDeckService: ConstructedPersonalDecksService,
		private readonly init_ConstructedMulliganGuideService: ConstructedMulliganGuideService,
		private readonly init_ArenaMulliganGuideService: ArenaMulliganGuideService,
		private readonly init_ArenaMulliganGuideGuardianService: ArenaMulliganGuideGuardianService,
		private readonly init_ArenaDiscoversGuardianService: ArenaDiscoversGuardianService,
		private readonly init_ArenaDraftGuardianService: ArenaDraftGuardianService,
		private readonly init_ArenaNavigationService: ArenaNavigationService,
		private readonly init_ArenDeckDetailsService: ArenDeckDetailsService,
		private readonly init_ConstructedMulliganGuideGuardianService: ConstructedMulliganGuideGuardianService,
		private readonly init_ConstructedDiscoversGuardianService: ConstructedDiscoversGuardianService,
		private readonly init_ConstructedDiscoverService: ConstructedDiscoverService,
		private readonly init_CardMousedOverService: CardMousedOverService,
		private readonly init_CommunityBootstrapService: CommunityBootstrapService,
		private readonly init_AchievementsNavigationService: AchievementsNavigationService,
		private readonly init_BootstrapSettingsService: BootstrapSettingsService,
		private readonly init_BootstrapGameStateService: BootstrapGameStateService,
		private readonly init_HearthpwnService: HearthpwnService,
		private readonly init_HsGuruService: HsGuruService,
		private readonly init_CardRulesService: CardRulesService,
		private readonly init_ExpertContributorsService: ExpertContributorsService,
		private readonly init_TavernBrawlService: TavernBrawlService,
		private readonly init_DeckParserFacadeService: DeckParserFacadeService,
		private readonly init_AccountService: AccountService,
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
