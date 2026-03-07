import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { StatsDataAccessModule } from '@firestone/stats/data-access';
import { BgsMetaHeroStatsAccessService } from './meta-heroes/bgs-meta-hero-stats-access.service';
import { BgsPerfectGamesService } from './services/bgs-perfect-games.service';

@NgModule({
	imports: [CommonModule, SharedFrameworkCoreModule, StatsDataAccessModule],
	providers: [BgsMetaHeroStatsAccessService, BgsPerfectGamesService],
})
export class BattlegroundsDataAccessModule {}
