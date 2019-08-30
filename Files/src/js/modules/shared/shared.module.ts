import { OverlayModule } from '@angular/cdk/overlay';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ControlBugComponent } from '../../components/controls/control-bug.component';
import { ControlCloseComponent } from '../../components/controls/control-close.component';
import { ControlDiscordComponent } from '../../components/controls/control-discord.component';
import { ControlHelpComponent } from '../../components/controls/control-help.component';
import { ControlMaximizeComponent } from '../../components/controls/control-maximize.component';
import { ControlMinimizeComponent } from '../../components/controls/control-minimize.component';
import { ControlSettingsComponent } from '../../components/controls/control-settings.component';
import { HotkeyComponent } from '../../components/hotkey.component';
import { CardTooltipComponent } from '../../components/tooltip/card-tooltip.component';
import { HelpTooltipComponent } from '../../components/tooltip/help-tooltip.component';
import { Tooltip, TooltipsComponent } from '../../components/tooltips.component';
import { VersionComponent } from '../../components/version.component';
import { CardTooltipDirective } from '../../directives/card-tooltip.directive';
import { HelpTooltipDirective } from '../../directives/help-tooltip.directive';

@NgModule({
	imports: [BrowserModule, OverlayModule],
	declarations: [
		ControlHelpComponent,
		ControlMinimizeComponent,
		ControlMaximizeComponent,
		ControlCloseComponent,
		ControlSettingsComponent,
		ControlDiscordComponent,
		ControlBugComponent,

		HotkeyComponent,
		VersionComponent,

		Tooltip,
		TooltipsComponent,
		CardTooltipComponent,
		HelpTooltipComponent,

		CardTooltipDirective,
		HelpTooltipDirective,
	],
	entryComponents: [Tooltip, HelpTooltipComponent, CardTooltipComponent],
	exports: [
		ControlHelpComponent,
		ControlMinimizeComponent,
		ControlMaximizeComponent,
		ControlCloseComponent,
		ControlSettingsComponent,
		ControlDiscordComponent,
		ControlBugComponent,

		HotkeyComponent,
		VersionComponent,

		Tooltip,
		TooltipsComponent,
		CardTooltipComponent,
		HelpTooltipComponent,

		CardTooltipDirective,
		HelpTooltipDirective,
	],
})
export class SharedModule {}
