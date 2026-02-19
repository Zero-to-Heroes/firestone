import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ArenaCommonModule } from '@firestone/arena/common';
import { GameStateModule } from '@firestone/game-state';
import { LotteryCommonModule } from '@firestone/lottery/common';
import { MemoryModule } from '@firestone/memory';
import { MercenariesCommonModule } from '@firestone/mercenaries/common';
import { ModsCommonModule } from '@firestone/mods/common';
import { ProfileCommonModule } from '@firestone/profile/common';
import { SharedCommonServiceModule } from '@firestone/shared/common/service';
import { SharedFrameworkCommonModule } from '@firestone/shared/framework/common';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { StatsServicesModule } from '@firestone/stats/services';
import { GameNativeStateStoreService } from './services/game-native-state-store.service';
import { LocalizationLoaderWithCache } from './services/localization-loader.service';
import { HsLogsWatcherService } from './services/logs/hs-logs-watcher.service';

@NgModule({
	imports: [
		CommonModule,

		SharedFrameworkCoreModule,
		SharedFrameworkCommonModule,
		SharedCommonServiceModule,
		StatsServicesModule,
		GameStateModule,
		ProfileCommonModule,
		ArenaCommonModule,
		MemoryModule,
		MercenariesCommonModule,
		LotteryCommonModule,
		ModsCommonModule,
	],
	providers: [LocalizationLoaderWithCache, HsLogsWatcherService, GameNativeStateStoreService],
})
export class AppCommonModule {}
