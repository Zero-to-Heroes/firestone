import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { AppCommonModule } from '@firestone/app/common';
import { ConstructedCommonModule } from '@firestone/constructed/common';
import { GameStateModule } from '@firestone/game-state';
import { MemoryModule } from '@firestone/memory';
import { ProfileCommonModule } from '@firestone/profile/common';
import { SharedCommonServiceModule } from '@firestone/shared/common/service';
import { SharedFrameworkCommonModule } from '@firestone/shared/framework/common';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { StatsCommonModule } from '@firestone/stats/common';
import { VirtualScrollerModule } from '@sebastientromp/ngx-virtual-scroller';
import { InlineSVGModule } from 'ng-inline-svg-2';

import { ArenaCardStatsService } from './services/arena-card-stats.service';
import { ArenaClassStatsService } from './services/arena-class-stats.service';
import { ArenDeckDetailsService } from './services/arena-deck-details.service';
import { ArenaDeckStatsService } from './services/arena-deck-stats.service';
import { ArenaDiscoversGuardianService } from './services/arena-discovers-guardian.service';
import { ArenaDraftGuardianService } from './services/arena-draft-guardian.service';
import { ArenaHighWinsRunsService } from './services/arena-high-wins-runs.service';
import { ArenaInfoService } from './services/arena-info.service';
import { ArenaMulliganGuideGuardianService } from './services/arena-mulligan-guide-guardian.service';
import { ArenaMulliganGuideService } from './services/arena-mulligan-guide.service';
import { ArenaNavigationService } from './services/arena-navigation.service';
import { ArenaRewardsService } from './services/arena-rewards.service';
import { ArenaRunsService } from './services/arena-runs.service';

@NgModule({
	imports: [
		CommonModule,

		InlineSVGModule,
		VirtualScrollerModule,

		SharedFrameworkCoreModule,
		StatsCommonModule,
		ConstructedCommonModule,
		SharedFrameworkCommonModule,
		SharedCommonServiceModule,
		MemoryModule,
		GameStateModule,
		ProfileCommonModule,
		AppCommonModule,
	],
	providers: [
		ArenaClassStatsService,
		ArenaCardStatsService,
		ArenaNavigationService,
		ArenDeckDetailsService,
		ArenaHighWinsRunsService,
		ArenaMulliganGuideService,
		ArenaMulliganGuideGuardianService,
		ArenaDiscoversGuardianService,
		ArenaDraftGuardianService,
		ArenaDeckStatsService,
		ArenaRunsService,
		ArenaInfoService,
		ArenaRewardsService,
	],
})
export class ArenaCommonModule {}
