import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { AchievementsCommonModule } from '@firestone/achievements/common';
import { BattlegroundsServicesModule } from '@firestone/battlegrounds/services';
import { GameStateModule } from '@firestone/game-state';
import { SharedFrameworkCommonModule } from '@firestone/shared/framework/common';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { StatsDataAccessModule } from '@firestone/stats/data-access';
import { MainWindowNavigationService } from './services/main-window-navigation.service';

@NgModule({
	imports: [
		CommonModule,
		GameStateModule,
		SharedFrameworkCoreModule,
		SharedFrameworkCommonModule,
		BattlegroundsServicesModule,
		StatsDataAccessModule,
		AchievementsCommonModule,
	],
	providers: [MainWindowNavigationService],
})
export class MainwindowCommonModule {}
