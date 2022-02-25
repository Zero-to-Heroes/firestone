import { AfterContentInit, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { Observable } from 'rxjs';
import { OverwolfService } from '../../../services/overwolf.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';
import { Knob } from '../preference-slider.component';

@Component({
	selector: 'settings-battlegrounds-general',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/global/scrollbar-settings.scss`,
		`../../../../css/global/forms.scss`,
		`../../../../css/component/settings/settings-common.component.scss`,
		`../../../../css/component/settings/battlegrounds/settings-battlegrounds-general.component.scss`,
	],
	template: `
		<!-- TODO translate -->
		<div
			class="battlegrounds-general"
			*ngIf="{
				useLocalSimulator: useLocalSimulator$ | async,
				enableSimulation: enableSimulation$ | async,
				bgsHideSimResultsOnRecruit: bgsHideSimResultsOnRecruit$ | async,
				bgsShowSimResultsOnlyOnRecruit: bgsShowSimResultsOnlyOnRecruit$ | async,
				bgsEnableOpponentBoardMouseOver: bgsEnableOpponentBoardMouseOver$ | async,
				bgsFullToggle: bgsFullToggle$ | async,
				bgsEnableApp: bgsEnableApp$ | async,
				bgsUseOverlay: bgsUseOverlay$ | async
			} as value"
			scrollable
		>
			<preference-toggle
				class="enable-bgs"
				field="bgsFullToggle"
				[label]="'settings.battlegrounds.full-toggle-label' | owTranslate"
				[tooltip]="'settings.battlegrounds.full-toggle-tooltip' | owTranslate"
			></preference-toggle>
			<div class="title" [owTranslate]="'settings.battlegrounds.general.companion-app-title'"></div>
			<div class="settings-group">
				<div class="subgroup">
					<preference-toggle
						field="bgsEnableApp"
						[ngClass]="{ 'disabled': !value.bgsFullToggle }"
						[label]="'settings.battlegrounds.general.enable-app-label' | owTranslate"
					></preference-toggle>
					<preference-toggle
						field="bgsUseOverlay"
						[ngClass]="{ 'disabled': !value.bgsEnableApp || !value.bgsFullToggle }"
						[label]="'settings.battlegrounds.general.integrated-mode-label' | owTranslate"
						[tooltip]="'settings.battlegrounds.general.integrated-mode-tooltip' | owTranslate"
						[toggleFunction]="toggleOverlay"
					></preference-toggle>
					<preference-toggle
						field="bgsEnableSimulation"
						[ngClass]="{ 'disabled': !value.bgsFullToggle }"
						[label]="'settings.battlegrounds.general.enable-battle-sim-label' | owTranslate"
						[tooltip]="'settings.battlegrounds.general.enable-battle-sim-tooltip' | owTranslate"
					></preference-toggle>
					<preference-toggle
						field="bgsHideSimResultsOnRecruit"
						[ngClass]="{ 'disabled': !value.bgsFullToggle || value.bgsShowSimResultsOnlyOnRecruit }"
						[label]="'settings.battlegrounds.general.hide-simulation-label' | owTranslate"
						[tooltip]="'settings.battlegrounds.general.hide-simulation-tooltip' | owTranslate"
					></preference-toggle>
					<preference-toggle
						field="bgsShowSimResultsOnlyOnRecruit"
						[ngClass]="{ 'disabled': !value.bgsFullToggle || value.bgsHideSimResultsOnRecruit }"
						[label]="'settings.battlegrounds.general.show-sim-only-in-tavern-label' | owTranslate"
						[tooltip]="'settings.battlegrounds.general.show-sim-only-in-tavern-tooltip' | owTranslate"
					></preference-toggle>
					<preference-toggle
						field="bgsUseLocalSimulator"
						[ngClass]="{ 'disabled': !value.enableSimulation || !value.bgsFullToggle }"
						[label]="'settings.battlegrounds.general.use-local-simulator-label' | owTranslate"
						[tooltip]="'settings.battlegrounds.general.use-local-simulator-tooltip' | owTranslate"
					></preference-toggle>
					<preference-toggle
						field="bgsShowHeroSelectionScreen"
						[ngClass]="{ 'disabled': !value.bgsEnableApp || !value.bgsFullToggle }"
						[label]="'settings.battlegrounds.general.popup-hero-selection-screen-label' | owTranslate"
						[tooltip]="'settings.battlegrounds.general.popup-hero-selection-screen-tooltip' | owTranslate"
					></preference-toggle>
					<preference-toggle
						field="bgsShowNextOpponentRecapSeparately"
						[ngClass]="{ 'disabled': !value.bgsEnableApp || !value.bgsFullToggle }"
						[label]="'settings.battlegrounds.general.show-next-opponent-recap-label' | owTranslate"
						[tooltip]="'settings.battlegrounds.general.show-next-opponent-recap-tooltip' | owTranslate"
					></preference-toggle>
					<preference-toggle
						field="bgsShowHeroSelectionAchievements"
						[ngClass]="{ 'disabled': !value.bgsFullToggle }"
						[label]="'settings.battlegrounds.general.show-achievements-label' | owTranslate"
						[tooltip]="'settings.battlegrounds.general.show-achievements-tooltip' | owTranslate"
					></preference-toggle>
					<preference-toggle
						field="bgsShowHeroSelectionTooltip"
						[ngClass]="{ 'disabled': !value.bgsFullToggle }"
						[label]="'settings.battlegrounds.general.show-hero-tooltip-label' | owTranslate"
						[tooltip]="'settings.battlegrounds.general.show-hero-tooltip-tooltip' | owTranslate"
					></preference-toggle>
					<preference-toggle
						field="bgsShowOverlayButton"
						[ngClass]="{ 'disabled': !value.bgsEnableApp || !value.bgsFullToggle || !value.bgsUseOverlay }"
						[label]="'settings.battlegrounds.general.show-overlay-label' | owTranslate"
						[tooltip]="'settings.battlegrounds.general.show-overlay-tooltip' | owTranslate"
					></preference-toggle>
					<preference-toggle
						field="bgsForceShowPostMatchStats"
						[ngClass]="{ 'disabled': !value.bgsEnableApp || !value.bgsFullToggle }"
						[label]="'settings.battlegrounds.general.popup-post-match-stats-label' | owTranslate"
						[tooltip]="'settings.battlegrounds.general.popup-post-match-stats-tooltip' | owTranslate"
					></preference-toggle>
				</div>
			</div>

			<div class="title" [owTranslate]="'settings.battlegrounds.general.simulator-config-title'"></div>
			<div class="settings-group">
				<div
					class="slider-label"
					[ngClass]="{
						'disabled': !value.useLocalSimulator || !value.enableSimulation || !value.bgsFullToggle
					}"
					[owTranslate]="'settings.battlegrounds.general.simulator-number-of-sims-label'"
					[helpTooltip]="'settings.battlegrounds.general.simulator-number-of-sims-tooltip' | owTranslate"
				></div>
				<preference-slider
					class="simulation-slider"
					field="bgsSimulatorNumberOfSims"
					[enabled]="value.useLocalSimulator && value.bgsEnableApp && value.bgsFullToggle"
					[showCurrentValue]="true"
					displayedValueUnit=""
					[min]="700"
					[max]="15000"
					[snapSensitivity]="200"
					[knobs]="numberOfSimsKnobs"
				>
				</preference-slider>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsBattlegroundsGeneralComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit, AfterViewInit {
	useLocalSimulator$: Observable<boolean>;
	enableSimulation$: Observable<boolean>;
	bgsHideSimResultsOnRecruit$: Observable<boolean>;
	bgsShowSimResultsOnlyOnRecruit$: Observable<boolean>;
	bgsEnableOpponentBoardMouseOver$: Observable<boolean>;
	bgsFullToggle$: Observable<boolean>;
	bgsEnableApp$: Observable<boolean>;
	bgsUseOverlay$: Observable<boolean>;

	numberOfSimsKnobs: readonly Knob[] = [
		{
			absoluteValue: 2500,
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

	// private preferencesSubscription: Subscription;

	private reloadBgWindows;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly i18n: LocalizationFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.useLocalSimulator$ = this.listenForBasicPref$((prefs) => prefs.bgsUseLocalSimulator);
		this.enableSimulation$ = this.listenForBasicPref$((prefs) => prefs.bgsEnableSimulation);
		this.bgsHideSimResultsOnRecruit$ = this.listenForBasicPref$((prefs) => prefs.bgsHideSimResultsOnRecruit);
		this.bgsShowSimResultsOnlyOnRecruit$ = this.listenForBasicPref$(
			(prefs) => prefs.bgsShowSimResultsOnlyOnRecruit,
		);
		this.bgsEnableOpponentBoardMouseOver$ = this.listenForBasicPref$(
			(prefs) => prefs.bgsEnableOpponentBoardMouseOver,
		);
		this.bgsEnableApp$ = this.listenForBasicPref$((prefs) => prefs.bgsEnableApp);
		this.bgsUseOverlay$ = this.listenForBasicPref$((prefs) => prefs.bgsUseOverlay);
		this.bgsFullToggle$ = this.listenForBasicPref$((prefs) => prefs.bgsFullToggle);
	}

	ngAfterViewInit() {
		this.reloadBgWindows = this.ow.getMainWindow().reloadBgWindows;
	}

	toggleOverlay = () => {
		this.reloadBgWindows();
	};
}
