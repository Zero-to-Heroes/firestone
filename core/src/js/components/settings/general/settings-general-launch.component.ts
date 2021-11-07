import { AfterViewInit, ChangeDetectionStrategy, Component } from '@angular/core';
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
					label="Launch Firestone when game starts"
					tooltip="When turned off, you need to manually launch Firestone every time"
					advancedSetting
				></preference-toggle>
				<preference-toggle
					field="collectionUseOverlay"
					label="Set integrated mode"
					tooltip="When turned on, the main window becomes an overlay, and is bound to the game window. Using this is recommended for single monitor setups, or if you want to stream the app. Changing this value will close then reopen the Settings window and the Main window"
					[toggleFunction]="toggleOverlay"
				></preference-toggle>
				<preference-toggle
					field="showSessionRecapOnExit"
					label="Session recap on exit"
					tooltip="Shows a recap of the past session when you exit Hearthstone"
				></preference-toggle>

				<preference-toggle
					field="showXpRecapAtGameEnd"
					label="Show XP recap on game end"
					tooltip="Shows a recap of the XP / levels gained after each match"
				></preference-toggle>
				<preference-toggle
					field="dontShowNewVersionNotif"
					label="Hide release notes on app start"
					tooltip="Don't show the new release notes for the new Firestone version"
				></preference-toggle>
				<preference-toggle
					field="setAllNotifications"
					label="Display notifications"
					tooltip="Toggles global visibility of toast notifications [bottom-right]. When active, you can still configure notifications per game mode in the corresponding tabs."
					advancedSetting
					messageWhenToggleValue="Notifications now TURNED OFF globally."
					[valueToDisplayMessageOn]="false"
				></preference-toggle>

				<div class="title">Accessibility</div>
				<div class="settings-group">
					<div class="subtitle" helpTooltip="A zoom level that will be applied to all windows">
						Zoom level
					</div>
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
			</section>
		</div>

		<div class="reset-container">
			<button
				(mousedown)="reset()"
				helpTooltip="Reset ALL your preferences, including the various widgets positions on screen"
			>
				<span>{{ resetText }}</span>
			</button>
			<div class="confirmation" *ngIf="showResetConfirmationText">
				All your preferences have been reset. This includes the various widgets locations on screen, as well as
				your Twitch settings, so don't forget to set back what you need :)
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsGeneralLaunchComponent implements AfterViewInit {
	resetText = 'Reset preferences';
	confirmationShown = false;
	showResetConfirmationText = false;
	sizeKnobs: readonly Knob[] = [
		{
			absoluteValue: 100,
			label: 'Normal',
		},
		{
			absoluteValue: 200,
			label: '200%',
		},
		{
			absoluteValue: 400,
			label: '400%',
		},
	];

	private reloadWindows;

	constructor(private readonly ow: OverwolfService, private readonly prefs: PreferencesService) {}

	ngAfterViewInit() {
		this.reloadWindows = this.ow.getMainWindow().reloadWindows;
	}

	toggleOverlay = () => {
		this.reloadWindows();
	};

	async reset() {
		if (!this.confirmationShown) {
			this.confirmationShown = true;
			this.resetText = 'Are you sure?';
			return;
		}

		this.resetText = 'Reset preferences';
		this.confirmationShown = false;
		this.showResetConfirmationText = true;
		await this.prefs.reset();
		this.reloadWindows();
	}
}
