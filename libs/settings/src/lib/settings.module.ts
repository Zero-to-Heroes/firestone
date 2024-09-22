import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AchievementsCommonModule } from '@firestone/achievements/common';
import { CollectionCommonModule } from '@firestone/collection/common';
import { SharedCommonServiceModule } from '@firestone/shared/common/service';
import { SharedCommonViewModule } from '@firestone/shared/common/view';
import { SharedFrameworkCommonModule } from '@firestone/shared/framework/common';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { StatsDataAccessModule } from '@firestone/stats/data-access';
import { ColorPickerModule } from 'ngx-color-picker';
import { AppearanceCustomizationPageComponent } from './common/components/custom-pages/appearance-customization.component';
import { SettingsBroadcastComponent } from './common/components/custom-pages/settings-broadcast';
import { SettingsDiscordComponent } from './common/components/custom-pages/settings-discord.component';
import { SettingsGeneralBugReportComponent } from './common/components/custom-pages/settings-general-bug-report.component';
import { SettingsGeneralModsComponent } from './common/components/custom-pages/settings-general-mods.component';
import { SettingsGeneralThirdPartyComponent } from './common/components/custom-pages/settings-general-third-party.component';
import { SettingButtonComponent } from './common/components/setting-button.component';
import { SettingElementComponent } from './common/components/setting-element.component';
import { SettingsCurrentPageSectionReferenceComponent } from './common/components/settings-current-page-section-reference.component';
import { SettingsCurrentPageSectionComponent } from './common/components/settings-current-page-section.component';
import { SettingsCurrentPageComponent } from './common/components/settings-current-page.component';
import { SettingsNavigationNodeComponent } from './common/components/settings-navigation-node.component';
import { SettingsRootComponent } from './common/components/settings-root.component';
import { SettingsSearchComponent } from './common/components/settings-search.component';
import { BootstrapSettingsService } from './common/services/bootstrap-settings.service';
import { CustomAppearanceService } from './common/services/custom-appearance.service';
import { SettingsControllerService } from './common/services/settings-controller.service';
import { CustomColorPickerComponent } from './general/custom-color-picker.component';
import { SettingsGeneralAppearanceComponent } from './general/settings-general-appearance.component';

const components = [
	SettingsRootComponent,
	SettingsNavigationNodeComponent,
	SettingsCurrentPageComponent,
	SettingsCurrentPageSectionComponent,
	SettingsCurrentPageSectionReferenceComponent,
	SettingElementComponent,
	SettingButtonComponent,
	SettingsSearchComponent,

	SettingsGeneralAppearanceComponent,
	SettingsGeneralBugReportComponent,
	SettingsGeneralThirdPartyComponent,
	SettingsBroadcastComponent,
	SettingsDiscordComponent,
	SettingsGeneralModsComponent,

	AppearanceCustomizationPageComponent,
	CustomColorPickerComponent,
];

@NgModule({
	imports: [
		CommonModule,
		FormsModule,
		ReactiveFormsModule,

		ColorPickerModule,

		SharedFrameworkCommonModule,
		SharedFrameworkCoreModule,
		SharedCommonServiceModule,
		SharedCommonViewModule,
		StatsDataAccessModule,
		CollectionCommonModule,
		AchievementsCommonModule,
	],
	providers: [BootstrapSettingsService, CustomAppearanceService, SettingsControllerService],
	declarations: components,
	exports: components,
})
export class SettingsModule {}
