import { OverlayContainer, OverlayModule } from '@angular/cdk/overlay';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AdsComponent } from '../../components/ads.component';
import { CdkOverlayContainer } from '../../components/cdk-overlay-container.component';
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
import { WindowWrapperComponent } from '../../components/window-wrapper.component';
import { ActiveThemeDirective } from '../../directives/active-theme.directive';
import { CardTooltipDirective } from '../../directives/card-tooltip.directive';
import { HelpTooltipDirective } from '../../directives/help-tooltip.directive';
import { PulseDirective } from '../../directives/pulse.directive';

@NgModule({
	imports: [BrowserModule, OverlayModule],
	declarations: [
		WindowWrapperComponent,

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
		ActiveThemeDirective,
		PulseDirective,

		AdsComponent,
	],
	entryComponents: [Tooltip, HelpTooltipComponent, CardTooltipComponent],
	exports: [
		WindowWrapperComponent,

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
		ActiveThemeDirective,
		PulseDirective,

		AdsComponent,
	],
	providers: [{ provide: OverlayContainer, useClass: CdkOverlayContainer }],
})
export class SharedModule {}
