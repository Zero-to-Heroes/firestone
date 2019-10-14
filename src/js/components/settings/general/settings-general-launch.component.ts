import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, ViewRef } from '@angular/core';
import { PreferencesService } from '../../../services/preferences.service';

@Component({
	selector: 'settings-general-launch',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/global/forms.scss`,
		`../../../../css/component/settings/settings-common.component.scss`,
		`../../../../css/component/settings/general/settings-general-launch.component.scss`,
	],
	template: `
		<div class="general-launch">
			<section class="toggle-label">
				<form class="settings-section form-toggle">
					<fieldset name="">
						<div class="form-section">
							<input
								hidden
								type="checkbox"
								[checked]="launchAppOnGameStart"
								name=""
								id="a-01"
								(change)="toggleLaunchAppOnGameStart()"
							/>
							<label for="a-01" [ngClass]="{ 'enabled': launchAppOnGameStart }">
								<b></b>
								<p class="settings-p">Launch Firestone when game starts</p>
							</label>
						</div>
					</fieldset>
				</form>
			</section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsGeneralLaunchComponent {
	launchAppOnGameStart: boolean;

	constructor(private prefs: PreferencesService, private cdr: ChangeDetectorRef, private el: ElementRef) {
		this.updateDefaultValues();
	}

	toggleLaunchAppOnGameStart() {
		this.launchAppOnGameStart = !this.launchAppOnGameStart;
		this.prefs.setLaunchAppOnGameStart(this.launchAppOnGameStart);
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	private async updateDefaultValues() {
		const preferences = await this.prefs.getPreferences();
		this.launchAppOnGameStart = preferences.launchAppOnGameStart;
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	// private async changeVideoSettings() {
	// 	console.log('changing settings with', this.captureVideo);
	// 	const result = await this.prefs.setDontRecordAchievements(!this.captureVideo);
	// 	console.log('recording settings changed', result);
	// }
}
