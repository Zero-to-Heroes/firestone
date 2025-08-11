import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ArenaCommonModule } from '@firestone/arena/common';
import { GameStateModule } from '@firestone/game-state';
import { LotteryCommonModule } from '@firestone/lottery/common';
import { MemoryModule } from '@firestone/memory';
import { MercenariesCommonModule } from '@firestone/mercenaries/common';
import { ProfileCommonModule } from '@firestone/profile/common';
import { SharedCommonServiceModule } from '@firestone/shared/common/service';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { StatsServicesModule } from '@firestone/stats/services';

@NgModule({
	imports: [
		CommonModule,

		SharedFrameworkCoreModule,
		SharedCommonServiceModule,
		StatsServicesModule,
		GameStateModule,
		ProfileCommonModule,
		ArenaCommonModule,
		MemoryModule,
		MercenariesCommonModule,
		LotteryCommonModule,
	],
	providers: [],
})
export class AppCommonModule {}
