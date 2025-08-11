import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { GameStateModule } from '@firestone/game-state';
import { SharedCommonServiceModule } from '@firestone/shared/common/service';
import { SharedFrameworkCommonModule } from '@firestone/shared/framework/common';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { LotteryWidgetControllerService } from './services/lottery-widget-controller.service';
import { LotteryService } from './services/lottery.service';

@NgModule({
	imports: [
		CommonModule,
		SharedFrameworkCoreModule,
		SharedFrameworkCommonModule,
		SharedCommonServiceModule,
		GameStateModule,
	],
	providers: [LotteryService, LotteryWidgetControllerService],
})
export class LotteryCommonModule {}

