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
			<preference-ynlimited
				*ngSwitchCase="'toggle'"
				class="toggle"
				[field]="_setting.field"
				[label]="_setting.label"
				[tooltip]="_setting.tooltip"
			></preference-ynlimited>
			<preferences-dropdown
				*ngSwitchCase="'dropdown'"
				[ngClass]="{ disabled: disabled }"
				[options]="_setting.dropdownConfig!.options"
				[field]="_setting.field"
				[label]="_setting.label"
				[tooltip]="_setting.tooltip"
				[afterSelection]="_setting.dropdownConfig!.afterSelection"
				[advancedSetting]="_setting.advancedSetting"
				premiumSetting
				[premiumSettingEnabled]="_setting.premiumSetting"
			></preferences-dropdown>
			<preference-numeric-input
				*ngSwitchCase="'dropdown'"
				[ngClass]="{ disabled: disabled }"
				[field]="_setting.field"
				[label]="_setting.label"
				[tooltip]="_setting.tooltip"
				[minValue]="_setting.numericConfig!.minValue"
				[incrementStep]="_setting.numericConfig!.incrementStep"
			></preference-numeric-input>
			<div class="slider-container" *ngSwitchCase="'slider'">
				<div class="label">
					<div class="setting-text" [innerHTML]="_setting.label"></div>
					<i class="setting-info" *ngIf="_setting.tooltip" [helpTooltip]="_setting.tooltip">
						<svg>
							<use xlink:href="assets/svg/sprite.svg#info" />
						</svg>
					</i>
				</div>
				<preference-slider
					class="slider"
					[field]="_setting.field"
					[enabled]="!disabled"
					[min]="_setting.sliderConfig!.min!"
					[max]="_setting.sliderConfig!.max!"
					[snapSensitivity]="_setting.sliderConfig!.snapSensitivity"
					[knobs]="_setting.sliderConfig!.knobs"
					[showCurrentValue]="_setting.sliderConfig!.showCurrentValue"
				>
				</preference-slider>
			</div>
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
