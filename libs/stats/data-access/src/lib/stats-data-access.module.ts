import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedCommonServiceModule } from '@firestone/shared/common/service';
import { SharedFrameworkCommonModule } from '@firestone/shared/framework/common';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { GameStatsLoaderService } from './services/game-stats-loader.service';

@NgModule({
	imports: [CommonModule, SharedCommonServiceModule, SharedFrameworkCommonModule, SharedFrameworkCoreModule],
	providers: [GameStatsLoaderService],
})
export class StatsDataAccessModule {}
