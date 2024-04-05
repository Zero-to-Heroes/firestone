import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { BattlegroundsDataAccessModule } from '@firestone/battlegrounds/data-access';
import { ConstructedCommonModule } from '@firestone/constructed/common';
import { MemoryModule } from '@firestone/memory';
import { SharedCommonViewModule } from '@firestone/shared/common/view';
import { SharedFrameworkCommonModule } from '@firestone/shared/framework/common';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { StatsCommonModule } from '@firestone/stats/common';
import { VirtualScrollerModule } from 'ngx-virtual-scroller';
import { BgsLeaderboardsComponent } from './components/battlegrounds-leaderboards.component';
import { BgsQuestStatsInfoPremiumComponent } from './components/bgs-quest-stats-info-premium.component';
import { BgsInGameQuestsGuardianService } from './services/bgs-in-game-quests-guardian.service';
import { BgsInGameQuestsService } from './services/bgs-in-game-quests.service';
import { BgsMatchMemoryInfoService } from './services/bgs-match-memory-info.service';
import { BgsMatchPlayersMmrService } from './services/bgs-match-players-mmr.service';
import { BgsMetaHeroStatsService } from './services/bgs-meta-hero-stats.service';
import { BattlegroundsOfficialLeaderboardService } from './services/bgs-official-leaderboards.service';
import { BgsPlayerHeroStatsService } from './services/bgs-player-hero-stats.service';
import { BattlegroundsQuestsService } from './services/bgs-quests.service';
import { BgsStateFacadeService } from './services/bgs-state-facade.service';

const components = [BgsQuestStatsInfoPremiumComponent, BgsLeaderboardsComponent];

@NgModule({
	imports: [
		CommonModule,

		VirtualScrollerModule,

		SharedFrameworkCommonModule,
		SharedFrameworkCoreModule,
		SharedCommonViewModule,
		BattlegroundsDataAccessModule,
		ConstructedCommonModule,
		MemoryModule,
		StatsCommonModule,
	],
	providers: [
		BattlegroundsQuestsService,
		BgsInGameQuestsService,
		BgsInGameQuestsGuardianService,
		BgsMatchMemoryInfoService,
		BattlegroundsOfficialLeaderboardService,
		BgsMatchPlayersMmrService,
		BgsStateFacadeService,
		BgsPlayerHeroStatsService,
		BgsMetaHeroStatsService,
	],
	declarations: components,
	exports: components,
})
export class BattlegroundsCommonModule {}
