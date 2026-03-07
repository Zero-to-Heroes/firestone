import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ConstructedCommonModule } from '@firestone/constructed/common';
import { GameStateModule } from '@firestone/game-state';
import { MainwindowCommonModule } from '@firestone/mainwindow/common';
import { SharedCommonServiceModule } from '@firestone/shared/common/service';
import { SharedFrameworkCommonModule } from '@firestone/shared/framework/common';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { StatsDataAccessModule } from '@firestone/stats/data-access';
import { StatsServicesModule } from '@firestone/stats/services';
import { DecksProviderService } from './services/decks-provider.service';

@NgModule({
	imports: [
		CommonModule,
		ConstructedCommonModule,
		GameStateModule,
		MainwindowCommonModule,
		SharedCommonServiceModule,
		SharedFrameworkCommonModule,
		SharedFrameworkCoreModule,
		StatsDataAccessModule,
		StatsServicesModule,
	],
	providers: [DecksProviderService],
})
export class DecktrackerCommonModule {}
