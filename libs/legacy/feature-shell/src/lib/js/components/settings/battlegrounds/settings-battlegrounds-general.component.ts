import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ViewRef,
} from '@angular/core';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { Observable, combineLatest } from 'rxjs';
import { AdService } from '../../../services/ad.service';
import { Knob } from '../preference-slider.component';

@Component({
	selector: 'settings-battlegrounds-general',
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
						[ngClass]="{ disabled: !value.bgsFullToggle }"
						[label]="'settings.battlegrounds.general.enable-app-label' | owTranslate"
					></preference-toggle>
					<preference-toggle
						field="bgsUseOverlay"
						[ngClass]="{ disabled: !value.bgsEnableApp || !value.bgsFullToggle }"
						[label]="'settings.battlegrounds.general.integrated-mode-label' | owTranslate"
						[tooltip]="'settings.battlegrounds.general.integrated-mode-tooltip' | owTranslate"
						[toggleFunction]="toggleOverlay"
					></preference-toggle>
					<preference-toggle
						field="bgsShowOverlayButton"
						[ngClass]="{ disabled: !value.bgsEnableApp || !value.bgsFullToggle || !value.bgsUseOverlay }"
						[label]="'settings.battlegrounds.general.show-overlay-button' | owTranslate"
						[tooltip]="'settings.battlegrounds.general.show-overlay-button-tooltip' | owTranslate"
					></preference-toggle>
					<preference-toggle
						field="bgsShowHeroSelectionScreen"
						[ngClass]="{ disabled: !value.bgsEnableApp || !value.bgsFullToggle }"
						[label]="'settings.battlegrounds.general.popup-hero-selection-screen-label' | owTranslate"
						[tooltip]="'settings.battlegrounds.general.popup-hero-selection-screen-tooltip' | owTranslate"
					></preference-toggle>
					<preference-toggle
						field="bgsShowNextOpponentRecapSeparately"
						[ngClass]="{ disabled: !value.bgsEnableApp || !value.bgsFullToggle }"
						[label]="'settings.battlegrounds.general.show-next-opponent-recap-label' | owTranslate"
						[tooltip]="'settings.battlegrounds.general.show-next-opponent-recap-tooltip' | owTranslate"
					></preference-toggle>
					<preference-toggle
						field="bgsShowEndGameNotif"
						[ngClass]="{ disabled: !value.bgsEnableApp || !value.bgsFullToggle }"
						[label]="'settings.battlegrounds.general.show-game-end-notif-label' | owTranslate"
						[tooltip]="'settings.battlegrounds.general.show-game-end-notif-tooltip' | owTranslate"
					></preference-toggle>
					<preference-toggle
						field="bgsForceShowPostMatchStats2"
						[ngClass]="{ disabled: !value.bgsEnableApp || !value.bgsFullToggle }"
						[label]="'settings.battlegrounds.general.popup-post-match-stats-label' | owTranslate"
						[tooltip]="'settings.battlegrounds.general.popup-post-match-stats-tooltip' | owTranslate"
					></preference-toggle>
				</div>
			</div>

			<div class="title" [owTranslate]="'settings.battlegrounds.general.simulator-config-title'"></div>
			<div class="settings-group">
				<preference-toggle
					field="bgsEnableSimulation"
					[ngClass]="{ disabled: !value.bgsFullToggle }"
					[label]="'settings.battlegrounds.general.enable-battle-sim-label' | owTranslate"
					[tooltip]="'settings.battlegrounds.general.enable-battle-sim-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="bgsUseRemoteSimulator"
					[ngClass]="{ disabled: !value.enableSimulation || !value.bgsFullToggle }"
					[label]="'settings.battlegrounds.general.use-remote-simulator-label' | owTranslate"
					[tooltip]="'settings.battlegrounds.general.use-remote-simulator-tooltip' | owTranslate"
					premiumSetting
				></preference-toggle>
				<preference-toggle
					field="bgsHideSimResultsOnRecruit"
					[ngClass]="{ disabled: !value.bgsFullToggle || value.bgsShowSimResultsOnlyOnRecruit }"
					[label]="'settings.battlegrounds.general.hide-simulation-label' | owTranslate"
					[tooltip]="'settings.battlegrounds.general.hide-simulation-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="bgsShowSimResultsOnlyOnRecruit"
					[ngClass]="{ disabled: !value.bgsFullToggle || value.bgsHideSimResultsOnRecruit }"
					[label]="'settings.battlegrounds.general.show-sim-only-in-tavern-label' | owTranslate"
					[tooltip]="'settings.battlegrounds.general.show-sim-only-in-tavern-tooltip' | owTranslate"
				></preference-toggle>
				<div
					class="slider-label"
					[ngClass]="{
						disabled: !value.useLocalSimulator || !value.enableSimulation || !value.bgsFullToggle
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
	implements AfterContentInit, AfterViewInit
{
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

	private reloadBgWindows;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly i18n: LocalizationFacadeService,
		private readonly ads: AdService,
		private readonly prefs: PreferencesService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.ads, this.prefs);

		const premium$ = this.ads.enablePremiumFeatures$$.pipe(this.mapData((premium) => premium));
		this.useLocalSimulator$ = combineLatest([
			premium$,
			this.prefs.preferences$$.pipe(this.mapData((prefs) => !prefs.bgsUseRemoteSimulator)),
		]).pipe(this.mapData(([premium, useLocalSimulator]) => !premium || useLocalSimulator));
		this.enableSimulation$ = this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.bgsEnableSimulation));
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

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	ngAfterViewInit() {
		this.reloadBgWindows = this.ow.getMainWindow().reloadBgWindows;
	}

	toggleOverlay = () => {
		console.log('toggling overlay, reloading windows');
		this.reloadBgWindows();
	};
}
