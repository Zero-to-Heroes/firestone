import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { Observable } from 'rxjs';
import { Knob } from '../preference-slider.component';

@Component({
	selector: 'settings-battlegrounds-overlay',
	styleUrls: [
		`../../../../css/global/scrollbar-settings.scss`,
		`../../../../css/global/forms.scss`,
		`../../../../css/component/settings/settings-common.component.scss`,
		`../../../../css/component/settings/battlegrounds/settings-battlegrounds-general.component.scss`,
	],
	template: `
		<div
			class="battlegrounds-general"
			*ngIf="{
				enableSimulation: enableSimulation$ | async,
				bgsEnableBattleSimulationOverlay: bgsEnableBattleSimulationOverlay$ | async,
				bgsHideSimResultsOnRecruit: bgsHideSimResultsOnRecruit$ | async,
				bgsShowSimResultsOnlyOnRecruit: bgsShowSimResultsOnlyOnRecruit$ | async,
				bgsEnableOpponentBoardMouseOver: bgsEnableOpponentBoardMouseOver$ | async,
				bgsFullToggle: bgsFullToggle$ | async,
				bgsEnableApp: bgsEnableApp$ | async,
				bgsUseOverlay: bgsUseOverlay$ | async,
				showBannedTribes: showBannedTribes$ | async,
				bgsEnableQuestsOverlay: bgsEnableQuestsOverlay$ | async,
				bgsShowTribeTiers: bgsShowTribeTiers$ | async,
				bgsEnableMinionListOverlay: bgsEnableMinionListOverlay$ | async
			} as value"
			scrollable
		>
			<preference-toggle
				class="enable-bgs"
				field="bgsFullToggle"
				[label]="'settings.battlegrounds.full-toggle-label' | owTranslate"
				[tooltip]="'settings.battlegrounds.full-toggle-tooltip' | owTranslate"
			></preference-toggle>

			<div class="title" [owTranslate]="'settings.battlegrounds.overlay.overlay-title'"></div>
			<div class="settings-group">
				<preference-toggle
					field="bgsShowHeroSelectionTiers"
					[ngClass]="{ disabled: !value.bgsFullToggle }"
					[label]="'settings.battlegrounds.general.show-hero-tier-label' | owTranslate"
					[tooltip]="'settings.battlegrounds.general.show-hero-tier-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="bgsShowHeroTipsOverlay"
					[ngClass]="{ disabled: !value.bgsFullToggle }"
					[label]="'settings.battlegrounds.general.show-hero-tips-label' | owTranslate"
					[tooltip]="'settings.battlegrounds.general.show-hero-tips-tooltip' | owTranslate"
					premiumSetting
				></preference-toggle>
				<preference-toggle
					field="bgsShowTrinketStatsOverlay"
					[ngClass]="{ disabled: !value.bgsFullToggle }"
					[label]="'settings.battlegrounds.general.show-trinket-stats-label' | owTranslate"
					[tooltip]="'settings.battlegrounds.general.show-trinket-stats-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="bgsShowQuestStatsOverlay"
					[ngClass]="{ disabled: !value.bgsFullToggle }"
					[label]="'settings.battlegrounds.general.show-quest-stats-label' | owTranslate"
					[tooltip]="'settings.battlegrounds.general.show-quest-stats-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="bgsEnableMinionAutoHighlight"
					[ngClass]="{ disabled: !value.bgsFullToggle }"
					[label]="'settings.battlegrounds.general.show-minions-auto-highlight-label' | owTranslate"
					[tooltip]="'settings.battlegrounds.general.show-minions-auto-highlight-tooltip' | owTranslate"
					premiumSetting
				></preference-toggle>
				<preference-toggle
					field="bgsEnableTribeAutoHighlight"
					[ngClass]="{ disabled: !value.bgsFullToggle }"
					[label]="'settings.battlegrounds.general.show-tribes-auto-highlight-label' | owTranslate"
					[tooltip]="'settings.battlegrounds.general.show-tribes-auto-highlight-tooltip' | owTranslate"
					premiumSetting
				></preference-toggle>
				<preference-toggle
					field="bgsShowBannedTribesOverlay"
					[ngClass]="{ disabled: !value.bgsFullToggle }"
					[label]="'settings.battlegrounds.overlay.show-banned-tribes-label' | owTranslate"
					[tooltip]="'settings.battlegrounds.overlay.show-banned-tribes-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="bgsEnableMinionListOverlay"
					[ngClass]="{ disabled: !value.bgsFullToggle }"
					[label]="'settings.battlegrounds.overlay.show-minions-list-label' | owTranslate"
					[tooltip]="'settings.battlegrounds.overlay.show-minions-list-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="bgsEnableTurnNumbertOverlay"
					[ngClass]="{ disabled: !value.bgsFullToggle }"
					[label]="'settings.battlegrounds.overlay.turn-counter-label' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="bgsShowLastOpponentIconInOverlay"
					[ngClass]="{ disabled: !value.bgsFullToggle }"
					[label]="'settings.battlegrounds.overlay.last-opponent-icon-label' | owTranslate"
					[tooltip]="'settings.battlegrounds.overlay.last-opponent-icon-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="bgsEnableOpponentBoardMouseOver"
					[ngClass]="{ disabled: !value.bgsFullToggle }"
					[label]="'settings.battlegrounds.overlay.last-opponent-board-label' | owTranslate"
					[tooltip]="'settings.battlegrounds.overlay.last-opponent-board-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="bgsEnableBattleSimulationOverlay"
					[ngClass]="{ disabled: !value.enableSimulation || !value.bgsFullToggle }"
					[label]="'settings.battlegrounds.overlay.battle-simulation-label' | owTranslate"
					[tooltip]="'settings.battlegrounds.overlay.battle-simulation-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="bgsShowHeroSelectionAchievements"
					[ngClass]="{ disabled: !value.bgsFullToggle }"
					[label]="'settings.battlegrounds.general.show-achievements-label' | owTranslate"
					[tooltip]="'settings.battlegrounds.general.show-achievements-tooltip' | owTranslate"
				></preference-toggle>
			</div>

			<div class="title" [owTranslate]="'settings.battlegrounds.general.simulator-config-title'"></div>
			<div class="settings-group">
				<preference-toggle
					field="bgsEnableSimulationSampleInOverlay"
					[ngClass]="{
						disabled:
							!value.enableSimulation || !value.bgsEnableBattleSimulationOverlay || !value.bgsFullToggle
					}"
					[label]="'settings.battlegrounds.overlay.battle-simulation-example-label' | owTranslate"
					[tooltip]="'settings.battlegrounds.overlay.battle-simulation-example-tooltip' | owTranslate"
				></preference-toggle>
				<div class="slider-label" [owTranslate]="'settings.global.widget-size-label'"></div>
				<preference-slider
					class="simulator-size-slider"
					field="bgsSimulatorScale"
					[enabled]="value.bgsFullToggle && value.bgsEnableApp"
					[showCurrentValue]="false"
					displayedValueUnit=""
					[min]="80"
					[max]="170"
					[snapSensitivity]="5"
					[knobs]="sizeKnobs"
				>
				</preference-slider>
			</div>

			<div class="title" [owTranslate]="'settings.battlegrounds.overlay.banned-tribes-title'"></div>
			<div class="settings-group" [ngClass]="{ disabled: !value.showBannedTribes || !value.bgsFullToggle }">
				<preference-toggle
					class="banned-tribes-vertical"
					field="bgsBannedTribesShowVertically"
					[ngClass]="{ disabled: !value.bgsFullToggle || !value.showBannedTribes }"
					[label]="'settings.battlegrounds.overlay.banned-tribes-show-in-column-label' | owTranslate"
					[tooltip]="'settings.battlegrounds.overlay.banned-tribes-show-in-column-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="bgsShowAvailableTribesOverlay"
					[ngClass]="{ disabled: !value.bgsFullToggle || !value.showBannedTribes }"
					[label]="'settings.battlegrounds.overlay.show-available-tribes-label' | owTranslate"
					[tooltip]="'settings.battlegrounds.overlay.show-available-tribes-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="bgsTribesOverlaySingleRow"
					[ngClass]="{ disabled: !value.bgsFullToggle || !value.showBannedTribes }"
					[label]="'settings.battlegrounds.overlay.banned-tribes-single-row-label' | owTranslate"
					[tooltip]="'settings.battlegrounds.overlay.banned-tribes-single-row-tooltip' | owTranslate"
				></preference-toggle>
				<div
					class="slider-label"
					[owTranslate]="'settings.battlegrounds.overlay.banned-tribes-icon-size-label'"
				></div>
				<preference-slider
					class="banned-tribes-size-slider"
					field="bgsBannedTribeScale"
					[enabled]="value.bgsFullToggle"
					[showCurrentValue]="false"
					displayedValueUnit=""
					[min]="80"
					[max]="135"
					[snapSensitivity]="5"
					[knobs]="sizeKnobs"
				>
				</preference-slider>
			</div>

			<div class="title" [owTranslate]="'settings.battlegrounds.overlay.minions-list-title'"></div>
			<div class="settings-group">
				<preference-toggle
					field="bgsEnableMinionListMouseOver"
					[ngClass]="{ disabled: !value.bgsFullToggle || !value.bgsEnableMinionListOverlay }"
					[label]="'settings.battlegrounds.overlay.minions-list-show-on-mouse-over-label' | owTranslate"
					[tooltip]="'settings.battlegrounds.overlay.minions-list-show-on-mouse-over-tooltip' | owTranslate"
					advancedSetting
					[messageWhenToggleValue]="
						'settings.battlegrounds.overlay.minions-list-show-on-mouse-over-confirmation' | owTranslate
					"
					[valueToDisplayMessageOn]="false"
				></preference-toggle>
				<preference-toggle
					field="bgsGroupMinionsIntoTheirTribeGroup"
					[ngClass]="{ disabled: !value.bgsFullToggle || !value.bgsEnableMinionListOverlay }"
					[label]="
						'settings.battlegrounds.overlay.minions-list-group-minions-into-tribes-label' | owTranslate
					"
					[tooltip]="
						'settings.battlegrounds.overlay.minions-list-group-minions-into-tribes-tooltip' | owTranslate
					"
				></preference-toggle>
				<preference-toggle
					field="bgsShowTribesHighlight"
					[ngClass]="{ disabled: !value.bgsFullToggle || !value.bgsEnableMinionListOverlay }"
					[label]="'settings.battlegrounds.overlay.minions-list-show-tribes-highlight-label' | owTranslate"
					[tooltip]="
						'settings.battlegrounds.overlay.minions-list-show-tribes-highlight-tooltip' | owTranslate
					"
				></preference-toggle>
				<preference-toggle
					field="bgsShowMechanicsTiers"
					[ngClass]="{ disabled: !value.bgsFullToggle || !value.bgsEnableMinionListOverlay }"
					[label]="'settings.battlegrounds.overlay.minions-list-show-mechanics-tiers-label' | owTranslate"
					[tooltip]="'settings.battlegrounds.overlay.minions-list-show-mechanics-tiers-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="bgsShowTribeTiers"
					[ngClass]="{ disabled: !value.bgsFullToggle || !value.bgsEnableMinionListOverlay }"
					[label]="'settings.battlegrounds.overlay.minions-list-show-tribe-tiers-label' | owTranslate"
					[tooltip]="'settings.battlegrounds.overlay.minions-list-show-tribe-tiers-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="bgsShowTierSeven"
					[ngClass]="{ disabled: !value.bgsFullToggle || !value.bgsEnableMinionListOverlay }"
					[label]="'settings.battlegrounds.overlay.minions-list-show-tier-7-label' | owTranslate"
					[tooltip]="'settings.battlegrounds.overlay.minions-list-show-tier-7-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="bgsShowTrinkets"
					[ngClass]="{
						disabled: !value.bgsFullToggle || !value.bgsEnableMinionListOverlay || !value.bgsShowTribeTiers
					}"
					[label]="'settings.battlegrounds.overlay.minions-list-show-trinkets-label' | owTranslate"
					[tooltip]="'settings.battlegrounds.overlay.minions-list-show-trinkets-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="bgsIncludeTrinketsInTribeGroups"
					[ngClass]="{ disabled: !value.bgsFullToggle || !value.bgsEnableMinionListOverlay }"
					[label]="
						'settings.battlegrounds.overlay.minions-list-include-trinkets-in-tribes-label' | owTranslate
					"
					[tooltip]="
						'settings.battlegrounds.overlay.minions-list-include-trinkets-in-tribes-tooltip' | owTranslate
					"
				></preference-toggle>
				<preference-toggle
					field="bgsMinionListShowGoldenCard"
					[ngClass]="{ disabled: !value.bgsFullToggle || !value.bgsEnableMinionListOverlay }"
					[label]="'settings.battlegrounds.overlay.minions-list-show-golden-cards-label' | owTranslate"
					[tooltip]="'settings.battlegrounds.overlay.minions-list-show-golden-cards-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="bgsMinionListShowSpellsAtBottom"
					[ngClass]="{ disabled: !value.bgsFullToggle || !value.bgsEnableMinionListOverlay }"
					[label]="'settings.battlegrounds.overlay.minions-list-show-spells-at-bottom-label' | owTranslate"
					[tooltip]="
						'settings.battlegrounds.overlay.minions-list-show-spells-at-bottom-tooltip' | owTranslate
					"
				></preference-toggle>
				<div class="slider-label" [owTranslate]="'settings.global.widget-size-label'"></div>
				<preference-slider
					class="minions-list-size-slider"
					field="bgsMinionsListScale"
					[enabled]="value.bgsFullToggle && value.bgsEnableMinionListOverlay"
					[showCurrentValue]="false"
					displayedValueUnit=""
					[min]="40"
					[max]="135"
					[snapSensitivity]="5"
					[knobs]="minionsListSizeKnobs"
				>
				</preference-slider>
			</div>

			<div class="title" [owTranslate]="'settings.battlegrounds.overlay.opponent-board-title'"></div>
			<div
				class="settings-group"
				[ngClass]="{ disabled: !value.bgsEnableOpponentBoardMouseOver || !value.bgsFullToggle }"
			>
				<preference-toggle
					class="opponent-board-top"
					field="bgsOpponentOverlayAtTop"
					[ngClass]="{ disabled: !value.bgsEnableOpponentBoardMouseOver || !value.bgsFullToggle }"
					[label]="'settings.battlegrounds.overlay.opponent-board-show-top-label' | owTranslate"
					[tooltip]="'settings.battlegrounds.overlay.opponent-board-show-top-tooltip' | owTranslate"
				></preference-toggle>
				<div class="slider-label" [owTranslate]="'settings.global.widget-size-label'"></div>
				<preference-slider
					class="opponent-board-size-slider"
					field="bgsOpponentBoardScale"
					[enabled]="value.bgsFullToggle && value.bgsEnableOpponentBoardMouseOver"
					[showCurrentValue]="false"
					displayedValueUnit=""
					[min]="80"
					[max]="150"
					[snapSensitivity]="5"
					[knobs]="sizeKnobs"
				>
				</preference-slider>
			</div>

			<div class="title" [owTranslate]="'settings.battlegrounds.overlay.counters-title'"></div>
			<div class="settings-group">
				<preference-toggle
					field="playerBgsTuskarrRaiderCounter"
					[ngClass]="{ disabled: !value.bgsFullToggle }"
					[label]="'settings.battlegrounds.overlay.counter-tuskarr-raider-label' | owTranslate"
					[tooltip]="'settings.battlegrounds.overlay.counter-tuskarr-raider-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="playerBgsBloodGemCounter"
					[ngClass]="{ disabled: !value.bgsFullToggle }"
					[label]="'settings.battlegrounds.overlay.counter-blood-gem-label' | owTranslate"
					[tooltip]="'settings.battlegrounds.overlay.counter-blood-gem-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="playerBgsGoldDeltaCounter"
					[ngClass]="{ disabled: !value.bgsFullToggle }"
					[label]="'settings.battlegrounds.overlay.counter-gold-delta-label' | owTranslate"
					[tooltip]="'settings.battlegrounds.overlay.counter-gold-delta-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="playerBgsLordOfGainsCounter"
					[ngClass]="{ disabled: !value.bgsFullToggle }"
					[label]="'settings.battlegrounds.overlay.counter-lord-of-gains-label' | owTranslate"
					[tooltip]="'settings.battlegrounds.overlay.counter-lord-of-gains-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="playerBgsMajordomoCounter"
					[ngClass]="{ disabled: !value.bgsFullToggle }"
					[label]="'settings.battlegrounds.overlay.counter-majordomo-label' | owTranslate"
					[tooltip]="'settings.battlegrounds.overlay.counter-majordomo-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="playerBgsMagmalocCounter"
					[ngClass]="{ disabled: !value.bgsFullToggle }"
					[label]="'settings.battlegrounds.overlay.counter-magmaloc-label' | owTranslate"
					[tooltip]="'settings.battlegrounds.overlay.counter-magmaloc-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="playerBgsSouthseaCounter"
					[ngClass]="{ disabled: !value.bgsFullToggle }"
					[label]="'settings.battlegrounds.overlay.counter-soutshsea-label' | owTranslate"
					[tooltip]="'settings.battlegrounds.overlay.counter-soutshsea-tooltip' | owTranslate"
				></preference-toggle>
			</div>

			<div class="title" [owTranslate]="'settings.battlegrounds.overlay.quest-stats-title'"></div>
			<div class="settings-group">
				<div class="slider-label" [owTranslate]="'settings.global.widget-size-label'"></div>
				<preference-slider
					class="simulator-size-slider"
					field="bgsQuestsOverlayScale"
					[enabled]="value.bgsFullToggle && value.bgsEnableApp && value.bgsEnableQuestsOverlay"
					[showCurrentValue]="false"
					displayedValueUnit=""
					[min]="50"
					[max]="150"
					[snapSensitivity]="5"
					[knobs]="sizeKnobs2"
				>
				</preference-slider>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsBattlegroundsOverlayComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	enableSimulation$: Observable<boolean>;
	bgsEnableBattleSimulationOverlay$: Observable<boolean>;
	bgsHideSimResultsOnRecruit$: Observable<boolean>;
	bgsShowSimResultsOnlyOnRecruit$: Observable<boolean>;
	bgsEnableOpponentBoardMouseOver$: Observable<boolean>;
	bgsFullToggle$: Observable<boolean>;
	bgsEnableApp$: Observable<boolean>;
	bgsUseOverlay$: Observable<boolean>;
	showBannedTribes$: Observable<boolean>;
	bgsEnableMinionListOverlay$: Observable<boolean>;
	bgsEnableQuestsOverlay$: Observable<boolean>;
	bgsShowTribeTiers$: Observable<boolean>;

	numberOfSimsKnobs: readonly Knob[] = [
		{
			absoluteValue: 2500,
		},
	];
	minionsListSizeKnobs: readonly Knob[] = [
		{
			absoluteValue: 40,
			label: this.i18n.translateString('settings.global.knob-sizes.small'),
		},
		{
			absoluteValue: 100,
			label: this.i18n.translateString('settings.global.knob-sizes.medium'),
		},
		{
			absoluteValue: 135,
			label: this.i18n.translateString('settings.global.knob-sizes.large'),
		},
	];
	sizeKnobs: readonly Knob[] = [
		{
			percentageValue: 0,
			label: this.i18n.translateString('settings.global.knob-sizes.small'),
		},
		{
			percentageValue: 18,
			label: this.i18n.translateString('settings.global.knob-sizes.medium'),
		},
		{
			percentageValue: 100,
			label: this.i18n.translateString('settings.global.knob-sizes.large'),
		},
	];
	sizeKnobs2: readonly Knob[] = [
		{
			percentageValue: 0,
			label: this.i18n.translateString('settings.global.knob-sizes.small'),
		},
		{
			percentageValue: 50,
			label: this.i18n.translateString('settings.global.knob-sizes.medium'),
		},
		{
			percentageValue: 100,
			label: this.i18n.translateString('settings.global.knob-sizes.large'),
		},
	];

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly prefs: PreferencesService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs);

		this.enableSimulation$ = this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.bgsEnableSimulation));
		this.bgsEnableBattleSimulationOverlay$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => prefs.bgsEnableBattleSimulationOverlay),
		);
		this.bgsHideSimResultsOnRecruit$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => prefs.bgsHideSimResultsOnRecruit),
		);
		this.bgsShowSimResultsOnlyOnRecruit$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => prefs.bgsShowSimResultsOnlyOnRecruit),
		);
		this.bgsEnableOpponentBoardMouseOver$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => prefs.bgsEnableOpponentBoardMouseOver),
		);
		this.bgsEnableApp$ = this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.bgsEnableApp));
		this.bgsUseOverlay$ = this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.bgsUseOverlay));
		this.bgsFullToggle$ = this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.bgsFullToggle));
		this.showBannedTribes$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => prefs.bgsShowBannedTribesOverlay),
		);
		this.bgsEnableMinionListOverlay$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => prefs.bgsEnableMinionListOverlay),
		);
		this.bgsEnableQuestsOverlay$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => prefs.bgsShowQuestStatsOverlay),
		);
		this.bgsShowTribeTiers$ = this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.bgsShowTribeTiers));

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}
}
