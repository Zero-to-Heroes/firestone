import { OverlayContainer, OverlayModule } from '@angular/cdk/overlay';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ColiseumComponentsModule } from '@firestone-hs/coliseum-components';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { InlineSVGModule } from 'ng-inline-svg';
import { SelectModule } from 'ng-select';
import { ChartsModule } from 'ng2-charts';
import { AdsComponent } from '../../components/ads.component';
import { BgsBoardComponent } from '../../components/battlegrounds/bgs-board.component';
import { BgsCardTooltipComponent } from '../../components/battlegrounds/bgs-card-tooltip.component';
import { BgsHeroPortraitComponent } from '../../components/battlegrounds/bgs-hero-portrait.component';
import { BgsPlayerCapsuleComponent } from '../../components/battlegrounds/bgs-player-capsule.component';
import { GraphWithComparisonComponent } from '../../components/battlegrounds/graph-with-comparison.component';
import { BgsHeroMiniComponent } from '../../components/battlegrounds/hero-selection/bgs-hero-mini.component';
import { BgsHeroSelectionTooltipComponent } from '../../components/battlegrounds/hero-selection/bgs-hero-selection-tooltip.component';
import { BgsHeroStatsComponent } from '../../components/battlegrounds/hero-selection/bgs-hero-stats.component';
import { BgsHeroTierComponent } from '../../components/battlegrounds/hero-selection/bgs-hero-tier.component.ts';
import { BgsHeroTribesComponent } from '../../components/battlegrounds/hero-selection/bgs-hero-tribes.component';
import { BgsBattleStatusComponent } from '../../components/battlegrounds/in-game/bgs-battle-status.component';
import { BgsOpponentOverviewBigComponent } from '../../components/battlegrounds/in-game/bgs-opponent-overview-big.component';
import { BgsTriplesComponent } from '../../components/battlegrounds/in-game/bgs-triples.component';
import { MinionIconComponent } from '../../components/battlegrounds/minion-icon.component';
import { BgsChartHpComponent } from '../../components/battlegrounds/post-match/bgs-chart-hp.component';
import { BgsChartWarbandCompositionComponent } from '../../components/battlegrounds/post-match/bgs-chart-warband-composition.component';
import { BgsChartWarbandStatsComponent } from '../../components/battlegrounds/post-match/bgs-chart-warband-stats.component';
import { BgsPostMatchStatsRecapComponent } from '../../components/battlegrounds/post-match/bgs-post-match-stats-recap.component';
import { BgsPostMatchStatsComponent } from '../../components/battlegrounds/post-match/bgs-post-match-stats.component';
import { BgsWinrateChartComponent } from '../../components/battlegrounds/post-match/bgs-winrate-chart.component';
import { StatCellComponent } from '../../components/battlegrounds/post-match/stat-cell.component';
import { CdkOverlayContainer } from '../../components/cdk-overlay-container.component';
import { ControlBugComponent } from '../../components/controls/control-bug.component';
import { ControlCloseComponent } from '../../components/controls/control-close.component';
import { ControlDiscordComponent } from '../../components/controls/control-discord.component';
import { ControlHelpComponent } from '../../components/controls/control-help.component';
import { ControlMaximizeComponent } from '../../components/controls/control-maximize.component';
import { ControlMinimizeComponent } from '../../components/controls/control-minimize.component';
import { ControlSettingsComponent } from '../../components/controls/control-settings.component';
import { FilterDropdownComponent } from '../../components/filter-dropdown.component';
import { FilterComponent } from '../../components/filter.component';
import { FsFilterDropdownComponent } from '../../components/fs-filter-dropdown.component';
import { HotkeyComponent } from '../../components/hotkey.component';
import { InfiniteScrollComponent } from '../../components/infinite-scroll.component';
import { LoadingStateComponent } from '../../components/loading-state.component';
import { PreferenceToggleComponent } from '../../components/settings/preference-toggle.component';
import { RedditShareButtonComponent } from '../../components/sharing/reddit/reddit-share-button.component';
import { RedditShareInfoComponent } from '../../components/sharing/reddit/reddit-share-info.component';
import { RedditShareModalComponent } from '../../components/sharing/reddit/reddit-share-modal.component';
import { ShareInfoComponent } from '../../components/sharing/share-info.component';
import { ShareLoginComponent } from '../../components/sharing/share-login.component';
import { SocialShareButtonComponent } from '../../components/sharing/social-share-button.component';
import { SocialShareModalComponent } from '../../components/sharing/social-share-modal.component';
import { SocialSharesComponent } from '../../components/sharing/social-shares.component';
import { TwitterShareButtonComponent } from '../../components/sharing/twitter/twitter-share-button.component';
import { TwitterShareModalComponent } from '../../components/sharing/twitter/twitter-share-modal.component';
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
		NgxChartsModule,
		ChartsModule,
		BrowserAnimationsModule,
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

		SocialSharesComponent,
		SocialShareModalComponent,
		ShareLoginComponent,
		ShareInfoComponent,
		SocialShareButtonComponent,
		TwitterShareModalComponent,
		TwitterShareButtonComponent,
		RedditShareModalComponent,
		RedditShareButtonComponent,
		RedditShareInfoComponent,

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
		BgsPlayerCapsuleComponent,
		BgsPostMatchStatsComponent,
		BgsPostMatchStatsRecapComponent,
		BgsChartHpComponent,
		BgsChartWarbandStatsComponent,
		BgsWinrateChartComponent,
		BgsChartWarbandCompositionComponent,

		GraphWithComparisonComponent,

		FilterDropdownComponent,
		FsFilterDropdownComponent,

		StatCellComponent,
	],
	entryComponents: [
		HelpTooltipComponent,
		CardTooltipComponent,
		ConfirmationComponent,
		BgsHeroSelectionTooltipComponent,
		TwitterShareModalComponent,
		RedditShareModalComponent,
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

		SocialSharesComponent,
		SocialShareModalComponent,
		ShareLoginComponent,
		ShareInfoComponent,
		SocialShareButtonComponent,
		TwitterShareModalComponent,
		TwitterShareButtonComponent,
		RedditShareModalComponent,
		RedditShareButtonComponent,
		RedditShareInfoComponent,

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
		BgsPlayerCapsuleComponent,
		BgsPostMatchStatsComponent,
		BgsPostMatchStatsRecapComponent,
		BgsChartHpComponent,
		BgsChartWarbandStatsComponent,
		BgsWinrateChartComponent,
		BgsChartWarbandCompositionComponent,

		GraphWithComparisonComponent,

		FilterDropdownComponent,
		FsFilterDropdownComponent,

		StatCellComponent,
	],
	providers: [{ provide: OverlayContainer, useClass: CdkOverlayContainer }],
})
export class SharedModule {}
