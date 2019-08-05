import { NgModule }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { HotkeyComponent }  from '../../components/hotkey.component';
import { VersionComponent }  from '../../components/version.component';
import { ControlHelpComponent } from '../../components/controls/control-help.component';
import { ControlMinimizeComponent } from '../../components/controls/control-minimize.component';
import { ControlCloseComponent } from '../../components/controls/control-close.component';
import { ControlSettingsComponent } from '../../components/controls/control-settings.component';
import { TooltipsComponent, Tooltip } from '../../components/tooltips.component';
import { ControlDiscordComponent } from '../../components/controls/control-discord.component';
import { ControlBugComponent } from '../../components/controls/control-bug.component';
import { HelpTooltipComponent } from '../../components/tooltip/help-tooltip.component';
import { HelpTooltipDirective } from '../../directives/help-tooltip.directive';

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
		ControlBugComponent,
		
		HotkeyComponent,
		VersionComponent,

		Tooltip,
		TooltipsComponent,
		HelpTooltipComponent,
		
		HelpTooltipDirective,
	],
	entryComponents: [Tooltip, HelpTooltipComponent],
	exports: [
		ControlHelpComponent,
		ControlMinimizeComponent,
		ControlCloseComponent,
		ControlSettingsComponent,
		ControlDiscordComponent,
		ControlBugComponent,

		HotkeyComponent,
		VersionComponent,

		Tooltip,
		TooltipsComponent,
		HelpTooltipComponent,
	],
})

export class SharedModule { }
