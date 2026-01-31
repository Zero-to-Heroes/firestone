import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ArenaCommonModule } from '@firestone/arena/common';
import { CollectionCommonModule } from '@firestone/collection/common';
import { ProfileCommonModule } from '@firestone/profile/common';
import { SharedCommonServiceModule } from '@firestone/shared/common/service';
import { SharedFrameworkCommonModule } from '@firestone/shared/framework/common';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { StatsDataAccessModule } from '@firestone/stats/data-access';
import { BootstrapSettingsService } from './services/bootstrap-settings.service';
import { CustomAppearanceService } from './services/custom-appearance.service';
import { SettingsControllerService } from './services/settings-controller.service';

const components = [];

@NgModule({
	imports: [
		CommonModule,
		SharedFrameworkCommonModule,
		SharedFrameworkCoreModule,
		SharedCommonServiceModule,
		ArenaCommonModule,
		CollectionCommonModule,
		ProfileCommonModule,
		StatsDataAccessModule,
	],
	providers: [BootstrapSettingsService, CustomAppearanceService, SettingsControllerService],
	declarations: components,
	exports: components,
})
export class SettingsServicesModule {}
