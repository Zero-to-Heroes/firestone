import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { BattlegroundsDataAccessModule } from '@firestone/battlegrounds/data-access';
import { SharedFrameworkCommonModule } from '@firestone/shared/framework/common';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { BattlegroundsQuestsService } from './services/bgs-quests.service';

@NgModule({
	imports: [CommonModule, SharedFrameworkCommonModule, SharedFrameworkCoreModule, BattlegroundsDataAccessModule],
	providers: [BattlegroundsQuestsService],
})
export class BattlegroundsCommonModule {}
