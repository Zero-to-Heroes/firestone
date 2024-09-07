import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedCommonServiceModule } from '@firestone/shared/common/service';
import { SharedFrameworkCommonModule } from '@firestone/shared/framework/common';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { ColorPickerModule } from 'ngx-color-picker';
import { SettingsNavigationNodeComponent } from './common/components/settings-navigation-node.component';
import { SettingsRootComponent } from './common/components/settings-root.component';
import { BootstrapSettingsService } from './common/services/bootstrap-settings.service';
import { CustomAppearanceService } from './common/services/custom-appearance.service';
import { SettingsControllerService } from './common/services/settings-controller.service';
import { CustomColorPickerComponent } from './general/custom-color-picker.component';
import { SettingsGeneralAppearanceComponent } from './general/settings-general-appearance.component';

const components = [
	SettingsRootComponent,
	SettingsNavigationNodeComponent,
	SettingsGeneralAppearanceComponent,
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
	],
	providers: [BootstrapSettingsService, CustomAppearanceService, SettingsControllerService],
	declarations: components,
	exports: components,
})
export class SettingsModule {}
