import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { BattlegroundsDataAccessModule } from '@firestone/battlegrounds/data-access';
import { ConstructedCommonModule } from '@firestone/constructed/common';
import { MemoryModule } from '@firestone/memory';
import { SharedFrameworkCommonModule } from '@firestone/shared/framework/common';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { BgsInGameQuestsGuardianService } from './services/bgs-in-game-quests-guardian.service';
import { BgsInGameQuestsService } from './services/bgs-in-game-quests.service';
import { BattlegroundsQuestsService } from './services/bgs-quests.service';

@NgModule({
	imports: [
		CommonModule,

		SharedFrameworkCommonModule,
		SharedFrameworkCoreModule,
		BattlegroundsDataAccessModule,
		ConstructedCommonModule,
		MemoryModule,
	],
	providers: [BattlegroundsQuestsService, BgsInGameQuestsService, BgsInGameQuestsGuardianService],
})
export class BattlegroundsCommonModule {}
