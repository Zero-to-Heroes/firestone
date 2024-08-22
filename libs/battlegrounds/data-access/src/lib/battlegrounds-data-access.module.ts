import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedCommonViewModule } from '@firestone/shared/common/view';
import { StatsDataAccessModule } from '@firestone/stats/data-access';
import { BgsMetaHeroStatsAccessService } from './meta-heroes/bgs-meta-hero-stats-access.service';

@NgModule({
	imports: [CommonModule, StatsDataAccessModule, SharedCommonViewModule],
	providers: [BgsMetaHeroStatsAccessService],
})
export class BattlegroundsDataAccessModule {}
