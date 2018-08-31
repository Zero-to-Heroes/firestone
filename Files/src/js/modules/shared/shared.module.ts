import { NgModule }      from '@angular/core';

import { HotkeyComponent }  from '../../components/hotkey.component';
import { VersionComponent }  from '../../components/version.component';

@NgModule({
	imports: [
	],
	declarations: [
		HotkeyComponent,
		VersionComponent,
	],
	exports: [
		HotkeyComponent,
		VersionComponent,
	],
})

export class SharedModule { }
