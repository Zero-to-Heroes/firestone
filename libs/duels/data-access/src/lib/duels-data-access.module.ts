import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { StatsDataAccessModule } from '@firestone/stats/data-access';
import { DuelsMetaHeroStatsAccessService } from './duels-meta-hero-stats-access.service';

@NgModule({
	imports: [CommonModule, StatsDataAccessModule],
	providers: [DuelsMetaHeroStatsAccessService],
})
export class DuelsDataAccessModule {}
