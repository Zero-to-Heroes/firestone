/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { OverlayAppearanceService, getDefaultOverlayPalette } from '@firestone/settings/services';
import { OverlayAppearanceColorKey } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { ILocalizationService, waitForReady } from '@firestone/shared/framework/core';

@Component({
	standalone: false,
	selector: 'custom-color-picker',
	styleUrls: [`../settings-common.component.scss`, `./custom-color-picker.component.scss`],
	template: `
		<div class="color-component">
			<div class="field-name">{{ label }}</div>
			<div class="color-bubble" [style.background]="color" (click)="showColorPicker = !showColorPicker"></div>
			<input
				#ignoredInput
				[(cpToggle)]="showColorPicker"
				[(colorPicker)]="color"
				[cpPresetColors]="[defaultColor]"
				[cpDisableInput]="true"
				[cpCancelButton]="true"
				[cpAlphaChannel]="'always'"
				[value]="color"
				(colorPickerSelect)="onColorSelected()"
				(colorPickerChange)="onColorChanged()"
			/>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomColorPickerComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	@Input() label: string;
	@Input() key: OverlayAppearanceColorKey = '--ov-color-1';

	defaultColor: string;
	color: string;
	showColorPicker = false;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly i18n: ILocalizationService,
		private readonly appearance: OverlayAppearanceService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.appearance);

		const defaults = getDefaultOverlayPalette();
		this.defaultColor = defaults[this.key] ?? '';
		this.color = this.defaultColor;

		this.appearance.customPalette$$
			.pipe(this.mapData((palette) => palette?.[this.key] ?? this.defaultColor))
			.subscribe((color) => {
				this.color = color;
				if (!(this.cdr as ViewRef).destroyed) {
					this.cdr.markForCheck();
				}
			});

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.markForCheck();
		}
	}

	onColorSelected() {
		this.appearance.setColor(this.key, this.color);
	}

	onColorChanged() {
		this.appearance.setColor(this.key, this.color);
	}
}
