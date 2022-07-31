import { DragDropModule } from '@angular/cdk/drag-drop';
import { OverlayContainer, OverlayModule } from '@angular/cdk/overlay';
import { HttpClient } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BattlegroundsMinionsTiersViewOverlayComponent } from '@components/battlegrounds/minions-tiers/battlegrounds-minions-tiers-view.component';
import { BattlegroundsMinionsGroupComponent } from '@components/battlegrounds/minions-tiers/bgs-minions-group.component';
import { BattlegroundsMinionsListComponent } from '@components/battlegrounds/minions-tiers/minions-list.component';
import { BgsHeroShortRecapComponent } from '@components/battlegrounds/overlay/bgs-hero-short-recap.component';
import { NumericInputComponent } from '@components/settings/numeric-input.component';
import { PreferenceDropdownComponent } from '@components/settings/preference-dropdown.component';
import { PreferenceNumericInputComponent } from '@components/settings/preference-numeric-input.component';
import { ColiseumComponentsModule } from '@firestone-hs/coliseum-components';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { NgxChartsModule } from '@sebastientromp/ngx-charts';
import { InlineSVGModule } from 'ng-inline-svg';
import { SelectModule } from 'ng-select';
import { ChartsModule } from 'ng2-charts';
import {
	PerfectScrollbarConfigInterface,
	PerfectScrollbarModule,
	PERFECT_SCROLLBAR_CONFIG,
} from 'ngx-perfect-scrollbar';
import { AdsComponent } from '../../components/ads.component';
import { BgsBattleRecapComponent } from '../../components/battlegrounds/battles/bgs-battle-recap.component';
import { BgsBattleSideComponent } from '../../components/battlegrounds/battles/bgs-battle-side.component';
import { BgsBattleComponent } from '../../components/battlegrounds/battles/bgs-battle.component';
import { BgsBattlesViewComponent } from '../../components/battlegrounds/battles/bgs-battles-view.component';
import { BgsHeroPortraitSimulatorComponent } from '../../components/battlegrounds/battles/bgs-hero-portrait-simulator.component';
import { BgsMinusButtonComponent } from '../../components/battlegrounds/battles/bgs-minus-button.component';
import { BgsPlusButtonComponent } from '../../components/battlegrounds/battles/bgs-plus-button.component';
import { BgsBoardComponent } from '../../components/battlegrounds/bgs-board.component';
import { BgsCardTooltipComponent } from '../../components/battlegrounds/bgs-card-tooltip.component';
import { BgsHeroPortraitComponent } from '../../components/battlegrounds/bgs-hero-portrait.component';
import { BgsPlayerCapsuleComponent } from '../../components/battlegrounds/bgs-player-capsule.component';
import { GraphWithComparisonNewComponent } from '../../components/battlegrounds/graph-with-comparison-new.component';
import { GraphWithComparisonComponent } from '../../components/battlegrounds/graph-with-comparison.component';
import { BgsHeroMiniComponent } from '../../components/battlegrounds/hero-selection/bgs-hero-mini.component';
import { BgsHeroOverviewComponent } from '../../components/battlegrounds/hero-selection/bgs-hero-overview.component';
import { BgsHeroSelectionTooltipComponent } from '../../components/battlegrounds/hero-selection/bgs-hero-selection-tooltip.component';
import { BgsHeroStatsComponent } from '../../components/battlegrounds/hero-selection/bgs-hero-stats.component';
import { BgsHeroTierComponent } from '../../components/battlegrounds/hero-selection/bgs-hero-tier.component.ts';
import { BgsHeroTribesComponent } from '../../components/battlegrounds/hero-selection/bgs-hero-tribes.component';
import { BgsBattleStatusComponent } from '../../components/battlegrounds/in-game/bgs-battle-status.component';
import { BgsOpponentOverviewBigComponent } from '../../components/battlegrounds/in-game/bgs-opponent-overview-big.component';
import { BgsTriplesComponent } from '../../components/battlegrounds/in-game/bgs-triples.component';
import { MinionIconComponent } from '../../components/battlegrounds/minion-icon.component';
import { BgsLeaderboardEmptyCardComponent } from '../../components/battlegrounds/overlay/bgs-leaderboard-empty-card.component';
import { BgsOverlayHeroOverviewComponent } from '../../components/battlegrounds/overlay/bgs-overlay-hero-overview.component';
import { BgsChartHpComponent } from '../../components/battlegrounds/post-match/bgs-chart-hp.component';
import { BgsChartWarbandCompositionComponent } from '../../components/battlegrounds/post-match/bgs-chart-warband-composition.component';
import { BgsChartWarbandStatsComponent } from '../../components/battlegrounds/post-match/bgs-chart-warband-stats.component';
import { BgsPostMatchStatsRecapComponent } from '../../components/battlegrounds/post-match/bgs-post-match-stats-recap.component';
import { BgsPostMatchStatsTabsComponent } from '../../components/battlegrounds/post-match/bgs-post-match-stats-tabs.component';
import { BgsPostMatchStatsComponent } from '../../components/battlegrounds/post-match/bgs-post-match-stats.component';
import { BgsWinrateChartComponent } from '../../components/battlegrounds/post-match/bgs-winrate-chart.component';
import { StatCellComponent } from '../../components/battlegrounds/post-match/stat-cell.component';
import { CdkOverlayContainer } from '../../components/cdk-overlay-container.component';
import { BasicBarChart2Component } from '../../components/common/chart/basic-bar-chart-2.component';
import { BasicBarChartComponent } from '../../components/common/chart/basic-bar-chart.component';
import { PieChartComponent } from '../../components/common/chart/pie-chart.component';
import { SimpleBarChartComponent } from '../../components/common/chart/simple-bar-chart.component';
import { ControlBugComponent } from '../../components/controls/control-bug.component';
import { ControlCloseComponent } from '../../components/controls/control-close.component';
import { ControlDiscordComponent } from '../../components/controls/control-discord.component';
import { ControlHelpComponent } from '../../components/controls/control-help.component';
import { ControlMaximizeComponent } from '../../components/controls/control-maximize.component';
import { ControlMinimizeComponent } from '../../components/controls/control-minimize.component';
import { ControlSettingsComponent } from '../../components/controls/control-settings.component';
import { ControlShareComponent } from '../../components/controls/control-share.component';
import { CopyDesckstringComponent } from '../../components/decktracker/copy-deckstring.component';
import { DeckCardComponent } from '../../components/decktracker/overlay/deck-card.component';
import { DeckListByZoneComponent } from '../../components/decktracker/overlay/deck-list-by-zone.component';
import { DeckListComponent } from '../../components/decktracker/overlay/deck-list.component';
import { DeckZoneComponent } from '../../components/decktracker/overlay/deck-zone.component';
import { DeckTrackerDeckListComponent } from '../../components/decktracker/overlay/decktracker-deck-list.component';
import { GroupedDeckListComponent } from '../../components/decktracker/overlay/grouped-deck-list.component';
import { LeaderboardEmptyCardComponent } from '../../components/decktracker/overlay/twitch/leaderboard-empty-card.component';
import { TwitchBgsHeroOverviewComponent } from '../../components/decktracker/overlay/twitch/twitch-bgs-hero-overview.component';
import { FilterDropdownMultiselectComponent } from '../../components/filter-dropdown-multiselect.component';
import { FilterDropdownComponent } from '../../components/filter-dropdown.component';
import { FilterComponent } from '../../components/filter.component';
import { FsFilterDropdownComponent } from '../../components/fs-filter-dropdown.component';
import { HotkeyComponent } from '../../components/hotkey.component';
import { InfiniteScrollComponent } from '../../components/infinite-scroll.component';
import { LoadingStateComponent } from '../../components/loading-state.component';
import { SecondaryDefaultComponent } from '../../components/main-window/secondary-default.component';
import { ProgressBarComponent } from '../../components/progress-bar.component';
import { CheckboxComponent } from '../../components/settings/checkbox.component';
import { PreferenceToggleComponent } from '../../components/settings/preference-toggle.component';
import { ClipboardShareButtonComponent } from '../../components/sharing/clipboard/clipboard-share-button.component';
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
import { BindCssVariableDirective } from '../../directives/bind-css-variable-directive';
import { CachedComponentTooltipDirective } from '../../directives/cached-component-tooltip.directive';
import { CardTooltipDirective } from '../../directives/card-tooltip.directive';
import { ComponentTooltipDirective } from '../../directives/component-tooltip.directive';
import { DoubleClickDirective } from '../../directives/exclusive-double-click.directive';
import { GrowOnClickDirective } from '../../directives/grow-on-click.directive';
import { HelpTooltipDirective } from '../../directives/help-tooltip.directive';
import { NgxCacheIfDirective } from '../../directives/ngx-cache-if.directive';
import { OwTranslateDirective } from '../../directives/ow-translate.directive';
import { OwTranslatePipe } from '../../directives/ow-translate.pipe';
import { PulseDirective } from '../../directives/pulse.directive';
import { RippleOnClickDirective } from '../../directives/ripple-on-click.directive';
import { RotateOnMouseOverDirective } from '../../directives/rotate-on-mouse-over.directive';
import { ScrollableDirective } from '../../directives/scrollable.directive';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';
import { ApiRunner } from '../../services/api-runner';
import { SharedServicesModule } from '../shared-services/shared-services.module';

const DEFAULT_PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
	suppressScrollX: true,
	maxScrollbarLength: 100,
};

// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient) {
	return new TranslateHttpLoader(http, 'https://static.firestoneapp.com/data/i18n/', '.json?v=112');
}

// Include everything that is needed for both Twitch and the standard app here
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
		PerfectScrollbarModule,
		SharedServicesModule.forRoot(),
		TranslateModule.forRoot({
			defaultLanguage: 'enUS',
			loader: {
				provide: TranslateLoader,
				useFactory: HttpLoaderFactory,
				deps: [HttpClient],
			},
		}),
		DragDropModule,
	],
	declarations: [
		WindowWrapperComponent,
		SecondaryDefaultComponent,

		ControlHelpComponent,
		ControlMinimizeComponent,
		ControlMaximizeComponent,
		ControlCloseComponent,
		ControlSettingsComponent,
		ControlDiscordComponent,
		ControlBugComponent,
		ControlShareComponent,

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
		BindCssVariableDirective,
		GrowOnClickDirective,
		RippleOnClickDirective,
		ScrollableDirective,
		NgxCacheIfDirective,
		RotateOnMouseOverDirective,
		DoubleClickDirective,
		OwTranslateDirective,

		LoadingStateComponent,
		WithLoadingComponent,

		PreferenceToggleComponent,
		PreferenceNumericInputComponent,
		CheckboxComponent,
		NumericInputComponent,
		PreferenceDropdownComponent,

		InfiniteScrollComponent,
		FilterComponent,
		SafeHtmlPipe,
		OwTranslatePipe,

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
		ClipboardShareButtonComponent,

		AdsComponent,

		DeckCardComponent,
		DeckTrackerDeckListComponent,
		DeckListByZoneComponent,
		GroupedDeckListComponent,
		DeckZoneComponent,
		CopyDesckstringComponent,
		DeckListComponent,

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
		BgsPostMatchStatsTabsComponent,
		BgsPostMatchStatsRecapComponent,
		BgsChartHpComponent,
		BgsChartWarbandStatsComponent,
		BgsWinrateChartComponent,
		BgsChartWarbandCompositionComponent,
		BgsHeroOverviewComponent,

		BattlegroundsMinionsTiersViewOverlayComponent,
		BattlegroundsMinionsListComponent,
		BattlegroundsMinionsGroupComponent,

		BgsBattlesViewComponent,
		BgsBattleComponent,
		BgsBattleRecapComponent,
		BgsBattleSideComponent,
		BgsPlusButtonComponent,
		BgsMinusButtonComponent,
		BgsHeroPortraitSimulatorComponent,

		LeaderboardEmptyCardComponent,
		TwitchBgsHeroOverviewComponent,
		BgsLeaderboardEmptyCardComponent,
		BgsHeroShortRecapComponent,
		BgsOverlayHeroOverviewComponent,

		GraphWithComparisonComponent,
		GraphWithComparisonNewComponent,
		SimpleBarChartComponent,
		BasicBarChartComponent,
		BasicBarChart2Component,
		PieChartComponent,

		FilterDropdownComponent,
		FilterDropdownMultiselectComponent,
		FsFilterDropdownComponent,

		StatCellComponent,
		ProgressBarComponent,
	],
	entryComponents: [
		HelpTooltipComponent,
		CardTooltipComponent,
		ConfirmationComponent,
		BgsHeroSelectionTooltipComponent,
		TwitterShareModalComponent,
		RedditShareModalComponent,
		BgsOverlayHeroOverviewComponent,
	],
	exports: [
		WindowWrapperComponent,
		SecondaryDefaultComponent,

		ControlHelpComponent,
		ControlMinimizeComponent,
		ControlMaximizeComponent,
		ControlCloseComponent,
		ControlSettingsComponent,
		ControlDiscordComponent,
		ControlBugComponent,
		ControlShareComponent,

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
		BindCssVariableDirective,
		GrowOnClickDirective,
		RippleOnClickDirective,
		ScrollableDirective,
		NgxCacheIfDirective,
		RotateOnMouseOverDirective,
		DoubleClickDirective,
		OwTranslateDirective,

		LoadingStateComponent,
		WithLoadingComponent,

		PreferenceToggleComponent,
		PreferenceNumericInputComponent,
		CheckboxComponent,
		NumericInputComponent,
		PreferenceDropdownComponent,

		InfiniteScrollComponent,
		FilterComponent,
		SafeHtmlPipe,
		OwTranslatePipe,

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
		ClipboardShareButtonComponent,

		DeckCardComponent,
		DeckTrackerDeckListComponent,
		DeckListByZoneComponent,
		GroupedDeckListComponent,
		DeckZoneComponent,
		CopyDesckstringComponent,
		DeckListComponent,

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
		BgsPostMatchStatsTabsComponent,
		BgsPostMatchStatsRecapComponent,
		BgsChartHpComponent,
		BgsChartWarbandStatsComponent,
		BgsWinrateChartComponent,
		BgsChartWarbandCompositionComponent,
		BgsHeroOverviewComponent,

		BattlegroundsMinionsTiersViewOverlayComponent,
		BattlegroundsMinionsListComponent,
		BattlegroundsMinionsGroupComponent,

		BgsBattlesViewComponent,
		BgsBattleComponent,
		BgsBattleRecapComponent,
		BgsBattleSideComponent,
		BgsPlusButtonComponent,
		BgsMinusButtonComponent,
		BgsHeroPortraitSimulatorComponent,

		LeaderboardEmptyCardComponent,
		TwitchBgsHeroOverviewComponent,
		BgsLeaderboardEmptyCardComponent,
		BgsOverlayHeroOverviewComponent,

		GraphWithComparisonComponent,
		GraphWithComparisonNewComponent,
		SimpleBarChartComponent,
		BasicBarChartComponent,
		BasicBarChart2Component,
		PieChartComponent,

		FilterDropdownComponent,
		FilterDropdownMultiselectComponent,
		FsFilterDropdownComponent,

		StatCellComponent,
		ProgressBarComponent,
	],
	providers: [
		{ provide: OverlayContainer, useClass: CdkOverlayContainer },
		{
			provide: PERFECT_SCROLLBAR_CONFIG,
			useValue: DEFAULT_PERFECT_SCROLLBAR_CONFIG,
		},
		ApiRunner,
	],
})
export class SharedModule {}
