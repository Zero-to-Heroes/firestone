import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { PreferencesService } from '@firestone/shared/common/service';
import { SettingButton } from '../models/settings.types';

@Component({
	selector: 'setting-button',
	styleUrls: [`../../settings-common.component.scss`, `./setting-element.component.scss`],
	template: `
		<div class="button-container">
			<div class="label">
				<div class="setting-text" [innerHTML]="_setting.label"></div>
				<i class="setting-info" *ngIf="_setting.tooltip" [helpTooltip]="_setting.tooltip">
					<svg>
						<use xlink:href="assets/svg/sprite.svg#info" />
					</svg>
				</i>
			</div>
			<button (mousedown)="requestAction()">
				<span>{{ currentButtonText }}</span>
			</button>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingButtonComponent {
	@Input() set setting(value: SettingButton) {
		this._setting = value;
		this.defaultButtonText = value.text;
		this.currentButtonText = value.text;
		this.updateInfo();
	}

	_setting: SettingButton;
	disabled: boolean | undefined;
	currentButtonText: string;

	private defaultButtonText: string;
	private confirmationShown: boolean;

	constructor(private readonly prefs: PreferencesService) {}

	requestAction() {
		if (!this._setting.confirmation) {
			this._setting.action();
			return;
		}

		if (!this.confirmationShown) {
			this.confirmationShown = true;
			this.currentButtonText = this._setting.confirmation;
			return;
		}

		this.currentButtonText = this.defaultButtonText;
		this.confirmationShown = false;
		this._setting.action();
	}

	private async updateInfo() {
		// const prefs = await this.prefs.getPreferences();
		this.disabled = false;
		// this.disabled = this._setting?.disabledIf?.(prefs);
	}
}
