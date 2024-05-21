import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { ILocalizationService, waitForReady } from '@firestone/shared/framework/core';
import { CustomStyleKey, defaultStyleKeys } from '../common/models/custom-appearance';
import { CustomAppearanceService } from '../common/services/custom-appearance.service';

@Component({
	selector: 'settings-general-appearance',
	styleUrls: [`../settings-common.component.scss`, `./settings-general-appearance.component.scss`],
	template: `
		<div class="title" [fsTranslate]="'settings.general.appearance.battlegrounds.title'"></div>
		<div class="settings-group battlegrounds">
			<!-- 
				Build a component to allow custom color selection for a specific field.
				It should also allow for preset values (which would be the default values for the field)
				as well as a "reset to default" button.
			-->
			<div class="color-component">
				<div class="field-name">Widget background color</div>
				<div class="color-bubble" [style.background]="color" (click)="showColorPicker = !showColorPicker"></div>
				<input
					#ignoredInput
					[(cpToggle)]="showColorPicker"
					[(colorPicker)]="color"
					[cpPresetColors]="[defaultColor]"
					[cpDisableInput]="true"
					(colorPickerSelect)="onColorSelected()"
					(colorPickerChange)="onColorChanged()"
				/>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsGeneralAppearanceComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	key: CustomStyleKey = '--bgs-widget-background-color';
	defaultColor = defaultStyleKeys[this.key];
	color = this.defaultColor;
	showColorPicker = false;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly i18n: ILocalizationService,
		private readonly appearance: CustomAppearanceService,
	) {
		super(cdr);
	}

	// TODO: later on, would be great to model the full color settings (and later, the full settings tree) to allow for
	// easier search
	async ngAfterContentInit() {
		await waitForReady(this.appearance);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	onColorSelected() {
		console.debug('color selected', this.color);
		this.appearance.setColor(this.key, this.color);
	}

	onColorChanged() {
		console.debug('color selected', this.color);
		this.appearance.setColor(this.key, this.color);
	}
}
