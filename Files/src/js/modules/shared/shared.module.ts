import { NgModule }      from '@angular/core';

import { HotkeyComponent }  from '../../components/hotkey.component';
import { VersionComponent }  from '../../components/version.component';
import { ControlHelpComponent } from '../../components/controls/control-help.component';
import { ControlMinimizeComponent } from '../../components/controls/control-minimize.component';
import { ControlCloseComponent } from '../../components/controls/control-close.component';
import { ControlSettingsComponent } from '../../components/controls/control-settings.component';
import { TooltipsComponent, Tooltip } from '../../components/tooltips.component';
import { BrowserModule } from '@angular/platform-browser';
import { ControlDiscordComponent } from '../../components/controls/control-discord.component';

@NgModule({
	imports: [
		BrowserModule,
	],
	declarations: [
		ControlHelpComponent,
		ControlMinimizeComponent,
		ControlCloseComponent,
        ControlSettingsComponent,
        ControlDiscordComponent,
		
		HotkeyComponent,
		VersionComponent,

		Tooltip,
		TooltipsComponent,
	],
	entryComponents: [Tooltip],
	exports: [
		ControlHelpComponent,
		ControlMinimizeComponent,
		ControlCloseComponent,
		ControlSettingsComponent,
        ControlDiscordComponent,

		HotkeyComponent,
		VersionComponent,

		Tooltip,
		TooltipsComponent,
	],
})

export class SharedModule { }
