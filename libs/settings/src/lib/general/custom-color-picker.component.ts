/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { ILocalizationService, waitForReady } from '@firestone/shared/framework/core';
import { CustomStyleKey, defaultStyleKeys } from '../common/models/custom-appearance';
import { CustomAppearanceService } from '../common/services/custom-appearance.service';

@Component({
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
	@Input() key: CustomStyleKey = '--bgs-widget-background-color';

	defaultColor: string;
	color: string;
	showColorPicker = false;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly i18n: ILocalizationService,
		private readonly appearance: CustomAppearanceService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.appearance);

		const defaultStyles = await defaultStyleKeys();
		this.defaultColor = defaultStyles[this.key];
		this.color = defaultStyles[this.key];

		this.appearance.colors$$
			.pipe(this.mapData((colors) => colors?.[this.key] ?? this.defaultColor))
			.subscribe((color) => {
				this.color = color;
				if (!(this.cdr as ViewRef).destroyed) {
					this.cdr.detectChanges();
				}
			});

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	onColorSelected() {
		this.appearance.setColor(this.key, this.color);
	}

	onColorChanged() {
		this.appearance.setColor(this.key, this.color);
	}
}
