import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { BehaviorSubject, combineLatest, filter } from 'rxjs';
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
				*ngSwitchCase="'toggle-ynlimited'"
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
				*ngSwitchCase="'numeric-input'"
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
					[displayedValueUnit]="_setting.sliderConfig!.displayedValueUnit ?? ''"
				>
				</preference-slider>
			</div>
		</ng-container>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingElementComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	@Input() set setting(value: Setting) {
		this._setting = value;
		this.setting$$.next(value);
	}

	_setting: Setting;
	disabled: boolean | undefined;

	private setting$$ = new BehaviorSubject<Setting | null>(null);

	constructor(protected override readonly cdr: ChangeDetectorRef, private readonly prefs: PreferencesService) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs);

		combineLatest([this.setting$$, this.prefs.preferences$$])
			.pipe(
				filter(([setting, prefs]) => !!setting && !!prefs),
				this.mapData(([setting, prefs]) => setting?.disabledIf?.(prefs)),
			)
			.subscribe((disabled) => {
				this.disabled = disabled;
				if (!(this.cdr as ViewRef).destroyed) {
					this.cdr.detectChanges();
				}
			});

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}
}
