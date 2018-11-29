import { NgModule }      from '@angular/core';

import { HotkeyComponent }  from '../../components/hotkey.component';
import { VersionComponent }  from '../../components/version.component';
import { ControlHelpComponent } from '../../components/controls/control-help.component';
import { ControlMinimizeComponent } from '../../components/controls/control-minimize.component';
import { ControlCloseComponent } from '../../components/controls/control-close.component';

@NgModule({
	imports: [
	],
	declarations: [
		ControlHelpComponent,
		ControlMinimizeComponent,
		ControlCloseComponent,
		HotkeyComponent,
		VersionComponent,
	],
	exports: [
		ControlHelpComponent,
		ControlMinimizeComponent,
		ControlCloseComponent,
		HotkeyComponent,
		VersionComponent,
	],
})

export class SharedModule { }
