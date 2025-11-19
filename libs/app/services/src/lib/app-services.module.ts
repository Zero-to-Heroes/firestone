import { NgModule } from '@angular/core';
import { GameStateModule } from '@firestone/game-state';
import { ProfileCommonModule } from '@firestone/profile/common';
import { SharedCommonViewModule } from '@firestone/shared/common/view';
import { SharedFrameworkCommonModule } from '@firestone/shared/framework/common';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { GameNativeStateStoreService } from './services/game-native-state-store.service';
import { LocalizationLoaderWithCache } from './services/localization-loader.service';
import { HsLogsWatcherService } from './services/logs/hs-logs-watcher.service';

const components = [];
@NgModule({
	imports: [
		SharedFrameworkCoreModule,
		SharedFrameworkCommonModule,
		SharedCommonViewModule,
		GameStateModule,
		ProfileCommonModule,
	],
	declarations: components,
	exports: components,
	providers: [LocalizationLoaderWithCache, HsLogsWatcherService, GameNativeStateStoreService],
})
export class AppServicesModule {}
