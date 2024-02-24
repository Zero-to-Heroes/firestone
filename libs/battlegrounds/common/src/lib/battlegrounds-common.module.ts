import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { BattlegroundsDataAccessModule } from '@firestone/battlegrounds/data-access';
import { ConstructedCommonModule } from '@firestone/constructed/common';
import { MemoryModule } from '@firestone/memory';
import { SharedCommonViewModule } from '@firestone/shared/common/view';
import { SharedFrameworkCommonModule } from '@firestone/shared/framework/common';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { BgsQuestStatsInfoPremiumComponent } from './components/bgs-quest-stats-info-premium.component';
import { BgsGameStateFacadeService } from './services/bgs-game-state-facade.service';
import { BgsInGameQuestsGuardianService } from './services/bgs-in-game-quests-guardian.service';
import { BgsInGameQuestsService } from './services/bgs-in-game-quests.service';
import { BgsMatchMemoryInfoService } from './services/bgs-match-memory-info.service';
import { BattlegroundsQuestsService } from './services/bgs-quests.service';

const components = [BgsQuestStatsInfoPremiumComponent];

@NgModule({
	imports: [
		CommonModule,

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
	],
	declarations: components,
	exports: components,
})
export class BattlegroundsCommonModule {}
