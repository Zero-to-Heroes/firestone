import { OverlayContainer, OverlayModule } from '@angular/cdk/overlay';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { ColiseumComponentsModule } from '@firestone-hs/coliseum-components';
import { InlineSVGModule } from 'ng-inline-svg';
import { SelectModule } from 'ng-select';
import { AdsComponent } from '../../components/ads.component';
import { BgsBoardComponent } from '../../components/battlegrounds/bgs-board.component';
import { BgsCardTooltipComponent } from '../../components/battlegrounds/bgs-card-tooltip.component';
import { BgsHeroPortraitComponent } from '../../components/battlegrounds/bgs-hero-portrait.component';
import { BgsHeroMiniComponent } from '../../components/battlegrounds/hero-selection/bgs-hero-mini.component';
import { BgsHeroSelectionTooltipComponent } from '../../components/battlegrounds/hero-selection/bgs-hero-selection-tooltip.component';
import { BgsHeroStatsComponent } from '../../components/battlegrounds/hero-selection/bgs-hero-stats.component';
import { BgsHeroTierComponent } from '../../components/battlegrounds/hero-selection/bgs-hero-tier.component.ts';
import { BgsHeroTribesComponent } from '../../components/battlegrounds/hero-selection/bgs-hero-tribes.component';
import { BgsBattleStatusComponent } from '../../components/battlegrounds/in-game/bgs-battle-status.component';
import { BgsOpponentOverviewBigComponent } from '../../components/battlegrounds/in-game/bgs-opponent-overview-big.component';
import { BgsTriplesComponent } from '../../components/battlegrounds/in-game/bgs-triples.component';
import { MinionIconComponent } from '../../components/battlegrounds/minion-icon.component';
import { StatCellComponent } from '../../components/battlegrounds/post-match/stat-cell.component';
import { CdkOverlayContainer } from '../../components/cdk-overlay-container.component';
import { ControlBugComponent } from '../../components/controls/control-bug.component';
import { ControlCloseComponent } from '../../components/controls/control-close.component';
import { ControlDiscordComponent } from '../../components/controls/control-discord.component';
import { ControlHelpComponent } from '../../components/controls/control-help.component';
import { ControlMaximizeComponent } from '../../components/controls/control-maximize.component';
import { ControlMinimizeComponent } from '../../components/controls/control-minimize.component';
import { ControlSettingsComponent } from '../../components/controls/control-settings.component';
import { FilterComponent } from '../../components/filter.component';
import { HotkeyComponent } from '../../components/hotkey.component';
import { InfiniteScrollComponent } from '../../components/infinite-scroll.component';
import { LoadingStateComponent } from '../../components/loading-state.component';
import { PreferenceToggleComponent } from '../../components/settings/preference-toggle.component';
import { BuffInfoComponent } from '../../components/tooltip/buff-info.component';
import { CardTooltipComponent } from '../../components/tooltip/card-tooltip.component';
import { ConfirmationComponent } from '../../components/tooltip/confirmation.component';
import { HelpTooltipComponent } from '../../components/tooltip/help-tooltip.component';
import { VersionComponent } from '../../components/version.component';
import { WindowWrapperComponent } from '../../components/window-wrapper.component';
import { WithLoadingComponent } from '../../components/with-loading.component';
import { ActiveThemeDirective } from '../../directives/active-theme.directive';
import { AskConfirmationDirective } from '../../directives/ask-confirmation.directive';
import { CachedComponentTooltipDirective } from '../../directives/cached-component-tooltip.directive';
import { CardTooltipDirective } from '../../directives/card-tooltip.directive';
import { ComponentTooltipDirective } from '../../directives/component-tooltip.directive';
import { GrowOnClickDirective } from '../../directives/grow-on-click.directive';
import { HelpTooltipDirective } from '../../directives/help-tooltip.directive';
import { PulseDirective } from '../../directives/pulse.directive';
import { ScrollableDirective } from '../../directives/scrollable.directive';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';

@NgModule({
	imports: [
		BrowserModule,
		OverlayModule,
		SelectModule,
		FormsModule,
		ReactiveFormsModule,
		ColiseumComponentsModule,
		InlineSVGModule.forRoot(),
	],
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

		CardTooltipComponent,
		BuffInfoComponent,
		HelpTooltipComponent,
		ConfirmationComponent,

		CardTooltipDirective,
		ComponentTooltipDirective,
		CachedComponentTooltipDirective,
		HelpTooltipDirective,
		ActiveThemeDirective,
		PulseDirective,
		AskConfirmationDirective,
		GrowOnClickDirective,
		ScrollableDirective,

		LoadingStateComponent,
		WithLoadingComponent,

		PreferenceToggleComponent,

		InfiniteScrollComponent,
		FilterComponent,
		SafeHtmlPipe,

		AdsComponent,

		BgsOpponentOverviewBigComponent,
		BgsBoardComponent,
		BgsCardTooltipComponent,
		BgsHeroPortraitComponent,
		BgsBattleStatusComponent,
		BgsTriplesComponent,
		BgsHeroTribesComponent,
		MinionIconComponent,
		BgsHeroTierComponent,
		BgsHeroMiniComponent,
		BgsHeroSelectionTooltipComponent,
		BgsHeroStatsComponent,

		StatCellComponent,
	],
	entryComponents: [
		HelpTooltipComponent,
		CardTooltipComponent,
		ConfirmationComponent,
		BgsHeroSelectionTooltipComponent,
	],
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

		CardTooltipComponent,
		HelpTooltipComponent,
		ConfirmationComponent,

		ComponentTooltipDirective,
		CachedComponentTooltipDirective,
		CardTooltipDirective,
		HelpTooltipDirective,
		ActiveThemeDirective,
		PulseDirective,
		AskConfirmationDirective,
		GrowOnClickDirective,
		ScrollableDirective,

		LoadingStateComponent,
		WithLoadingComponent,

		PreferenceToggleComponent,

		InfiniteScrollComponent,
		FilterComponent,
		SafeHtmlPipe,

		AdsComponent,

		BgsOpponentOverviewBigComponent,
		BgsBoardComponent,
		BgsCardTooltipComponent,
		BgsHeroPortraitComponent,
		BgsBattleStatusComponent,
		BgsTriplesComponent,
		BgsHeroTribesComponent,
		MinionIconComponent,
		BgsHeroTierComponent,
		BgsHeroMiniComponent,
		BgsHeroSelectionTooltipComponent,
		BgsHeroStatsComponent,

		StatCellComponent,
	],
	providers: [{ provide: OverlayContainer, useClass: CdkOverlayContainer }],
})
export class SharedModule {}
