import { AfterViewInit, ChangeDetectionStrategy, Component } from '@angular/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { OverwolfService } from '../../../services/overwolf.service';
import { PreferencesService } from '../../../services/preferences.service';
import { Knob } from '../preference-slider.component';

@Component({
	selector: 'settings-general-launch',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/global/forms.scss`,
		`../../../../css/component/settings/settings-common.component.scss`,
		`../../../../css/component/settings/general/settings-general-launch.component.scss`,
	],
	template: `
		<div class="settings-group general-launch">
			<section class="toggle-label">
				<preference-toggle
					field="launchAppOnGameStart"
					[label]="'settings.general.launch.launch-on-game-start-label' | owTranslate"
					[tooltip]="'settings.general.launch.launch-on-game-start-tooltip' | owTranslate"
					advancedSetting
				></preference-toggle>
				<preference-toggle
					field="collectionUseOverlay"
					[label]="'settings.general.launch.integrated-mode-label' | owTranslate"
					[tooltip]="'settings.general.launch.integrated-mode-tooltip' | owTranslate"
					[toggleFunction]="toggleOverlay"
				></preference-toggle>
				<preference-toggle
					field="showSessionRecapOnExit"
					[label]="'settings.general.launch.session-recap-on-exit-label' | owTranslate"
					[tooltip]="'settings.general.launch.session-recap-on-exit-tooltip' | owTranslate"
				></preference-toggle>

				<preference-toggle
					field="showXpRecapAtGameEnd"
					[label]="'settings.general.launch.xp-recap-on-game-end-label' | owTranslate"
					[tooltip]="'settings.general.launch.xp-recap-on-game-end-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="dontShowNewVersionNotif"
					[label]="'settings.general.launch.hide-release-notes-label' | owTranslate"
					[tooltip]="'settings.general.launch.hide-release-notes-tooltip' | owTranslate"
				></preference-toggle>
				<preference-toggle
					field="setAllNotifications"
					[label]="'settings.general.launch.display-notifications-label' | owTranslate"
					[tooltip]="'settings.general.launch.display-notifications-tooltip' | owTranslate"
					advancedSetting
					[messageWhenToggleValue]="
						'settings.general.launch.display-notifications-confirmation' | owTranslate
					"
					[valueToDisplayMessageOn]="false"
				></preference-toggle>
			</section>
		</div>

		<div class="title" [owTranslate]="'settings.general.launch.accessibility-title'"></div>
		<div class="settings-group">
			<preference-toggle
				field="flashWindowOnYourTurn"
				[label]="'settings.general.launch.flash-window' | owTranslate"
				[tooltip]="'settings.general.launch.flash-window-tooltip' | owTranslate"
			></preference-toggle>
			<div
				class="subtitle"
				[owTranslate]="'settings.general.launch.zoom-label'"
				[helpTooltip]="'settings.general.launch.zoom-tooltip' | owTranslate"
			></div>
			<preference-slider
				class="first-slider"
				[field]="'globalZoomLevel'"
				[enabled]="true"
				[min]="100"
				[max]="400"
				[snapSensitivity]="5"
				[knobs]="sizeKnobs"
			>
			</preference-slider>
		</div>

		<div class="buttons">
			<div class="reset-container">
				<button
					(mousedown)="reset()"
					[helpTooltip]="'settings.general.launch.reset-prefs-tooltip' | owTranslate"
				>
					<span>{{ resetText }}</span>
				</button>
				<div
					class="confirmation"
					*ngIf="showResetConfirmationText"
					[owTranslate]="'settings.general.launch.reset-prefs-confirmation'"
				></div>
			</div>
			<div class="res-container">
				<button (mousedown)="restartApp()">
					<span [owTranslate]="'settings.general.launch.restart-app-button-label'"></span>
				</button>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsGeneralLaunchComponent implements AfterViewInit {
	resetText = this.i18n.translateString('settings.general.launch.reset-prefs-button-default');
	confirmationShown = false;
	showResetConfirmationText = false;
	sizeKnobs: readonly Knob[] = [
		{
			absoluteValue: 100,
			label: this.i18n.translateString('settings.global.knob-zoom.normal'),
		},
		{
			absoluteValue: 200,
			label: this.i18n.translateString('settings.global.knob-zoom.zoom-200'),
		},
		{
			absoluteValue: 400,
			label: this.i18n.translateString('settings.global.knob-zoom.zoom-400'),
		},
	];

	private reloadWindows;

	constructor(
		private readonly ow: OverwolfService,
		private readonly prefs: PreferencesService,
		private readonly i18n: LocalizationFacadeService,
	) {}

	ngAfterViewInit() {
		this.reloadWindows = this.ow.getMainWindow().reloadWindows;
	}

	toggleOverlay = () => {
		this.reloadWindows();
	};

	async reset() {
		if (!this.confirmationShown) {
			this.confirmationShown = true;
			this.resetText = this.i18n.translateString('settings.general.launch.reset-prefs-button-confirmation');
			return;
		}

		this.resetText = this.i18n.translateString('settings.general.launch.reset-prefs-button-default');
		this.confirmationShown = false;
		this.showResetConfirmationText = true;
		await this.prefs.reset();
		this.reloadWindows();
	}

	async restartApp() {
		this.ow.relaunchApp();
	}
}
