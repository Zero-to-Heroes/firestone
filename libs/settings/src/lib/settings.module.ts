import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedFrameworkCommonModule } from '@firestone/shared/framework/common';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { ColorPickerModule } from 'ngx-color-picker';
import { BootstrapSettingsService } from './common/services/bootstrap-settings.service';
import { CustomAppearanceService } from './common/services/custom-appearance.service';
import { SettingsGeneralAppearanceComponent } from './general/settings-general-appearance.component';

const components = [SettingsGeneralAppearanceComponent];

@NgModule({
	imports: [
		CommonModule,
		FormsModule,
		ReactiveFormsModule,

		ColorPickerModule,

		SharedFrameworkCommonModule,
		SharedFrameworkCoreModule,
	],
	providers: [BootstrapSettingsService, CustomAppearanceService],
	declarations: components,
	exports: components,
})
export class SettingsModule {}
