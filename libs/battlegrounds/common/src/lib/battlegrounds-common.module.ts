import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { BattlegroundsDataAccessModule } from '@firestone/battlegrounds/data-access';
import { ConstructedCommonModule } from '@firestone/constructed/common';
import { MemoryModule } from '@firestone/memory';
import { SharedCommonViewModule } from '@firestone/shared/common/view';
import { SharedFrameworkCommonModule } from '@firestone/shared/framework/common';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { VirtualScrollerModule } from 'ngx-virtual-scroller';
import { BgsLeaderboardsComponent } from './components/battlegrounds-leaderboards.component';
import { BgsQuestStatsInfoPremiumComponent } from './components/bgs-quest-stats-info-premium.component';
import { BgsGameStateFacadeService } from './services/bgs-game-state-facade.service';
import { BgsInGameQuestsGuardianService } from './services/bgs-in-game-quests-guardian.service';
import { BgsInGameQuestsService } from './services/bgs-in-game-quests.service';
import { BgsMatchMemoryInfoService } from './services/bgs-match-memory-info.service';
import { BgsMatchPlayersMmrService } from './services/bgs-match-players-mmr.service';
import { BattlegroundsOfficialLeaderboardService } from './services/bgs-official-leaderboards.service';
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
	],
	providers: [
		BattlegroundsQuestsService,
		BgsInGameQuestsService,
		BgsInGameQuestsGuardianService,
		BgsGameStateFacadeService,
		BgsMatchMemoryInfoService,
		BattlegroundsOfficialLeaderboardService,
		BgsMatchPlayersMmrService,
		BgsStateFacadeService,
	],
	declarations: components,
	exports: components,
})
export class BattlegroundsCommonModule {}
