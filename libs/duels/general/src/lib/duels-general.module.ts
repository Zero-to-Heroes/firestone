import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedFrameworkCommonModule } from '@firestone/shared/framework/common';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { StatsDataAccessModule } from '@firestone/stats/data-access';
import { DuelsConfigService } from './services/duels-config.service';
import { DuelsNavigationService } from './services/duels-navigation.service';
import { DuelsPersonalDecksService } from './services/duels-personal-decks.service';

@NgModule({
	imports: [CommonModule, SharedFrameworkCoreModule, SharedFrameworkCommonModule, StatsDataAccessModule],
	providers: [DuelsConfigService, DuelsPersonalDecksService, DuelsNavigationService],
})
export class DuelsGeneralModule {}
