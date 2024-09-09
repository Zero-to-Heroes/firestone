import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { PreferencesService } from '@firestone/shared/common/service';
import { Setting } from '../models/settings.types';

@Component({
	selector: 'setting-element',
	styleUrls: [`../../settings-common.component.scss`, `./setting-element.component.scss`],
	template: `
		<ng-container [ngSwitch]="_setting.type">
			<preference-toggle
				*ngSwitchCase="'toggle'"
				[ngClass]="{ disabled: disabled }"
				[field]="_setting.field"
				[label]="_setting.label"
				[tooltip]="_setting.tooltip"
				[advancedSetting]="_setting.advancedSetting"
				premiumSetting
				[premiumSettingEnabled]="_setting.premiumSetting"
				[messageWhenToggleValue]="_setting.toggleConfig?.messageWhenToggleValue"
				[valueToDisplayMessageOn]="_setting.toggleConfig?.valueToDisplayMessageOn"
				[toggleFunction]="_setting.toggleConfig?.toggleFunction"
			></preference-toggle>
		</ng-container>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingElementComponent {
	@Input() set setting(value: Setting) {
		this._setting = value;
		this.updateInfo();
	}

	_setting: Setting;
	disabled: boolean | undefined;

	constructor(private readonly prefs: PreferencesService) {}

	private async updateInfo() {
		const prefs = await this.prefs.getPreferences();
		this.disabled = this._setting?.disabledIf?.(prefs);
	}
}
