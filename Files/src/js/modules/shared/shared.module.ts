import { NgModule }      from '@angular/core';

import { HotkeyComponent }  from '../../components/hotkey.component';
import { VersionComponent }  from '../../components/version.component';
import { ControlHelpComponent } from '../../components/controls/control-help.component';
import { ControlMinimizeComponent } from '../../components/controls/control-minimize.component';
import { ControlCloseComponent } from '../../components/controls/control-close.component';
import { ControlSettingsComponent } from '../../components/controls/control-settings.component';

@NgModule({
	imports: [
	],
	declarations: [
		ControlHelpComponent,
		ControlMinimizeComponent,
		ControlCloseComponent,
		ControlSettingsComponent,
		
		HotkeyComponent,
		VersionComponent,
	],
	exports: [
		ControlHelpComponent,
		ControlMinimizeComponent,
		ControlCloseComponent,
		ControlSettingsComponent,

		HotkeyComponent,
		VersionComponent,
	],
})

export class SharedModule { }
