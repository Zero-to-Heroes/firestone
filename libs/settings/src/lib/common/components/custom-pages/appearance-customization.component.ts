import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { ILocalizationService, waitForReady } from '@firestone/shared/framework/core';
import { CustomAppearanceService } from '../../services/custom-appearance.service';

@Component({
	selector: 'appearance-customization',
	styleUrls: [`../../../settings-common.component.scss`, `./appearance-customization.component.scss`],
	template: `
		<div class="title" [fsTranslate]="'settings.general.appearance.battlegrounds.title'"></div>
		<div class="settings-group battlegrounds">
			<div class="subtitle" [fsTranslate]="'settings.general.appearance.battlegrounds.global'"></div>
			<custom-color-picker
				[label]="'--bgs-widget-background-color-start'"
				key="--bgs-widget-background-color-start"
			></custom-color-picker>
			<custom-color-picker
				[label]="'--bgs-widget-background-color-end'"
				key="--bgs-widget-background-color-end"
			></custom-color-picker>
			<custom-color-picker [label]="'--bgs-color-1'" key="--bgs-color-1"></custom-color-picker>
			<custom-color-picker [label]="'--bgs-color-2'" key="--bgs-color-2"></custom-color-picker>
			<custom-color-picker [label]="'--bgs-color-3'" key="--bgs-color-3"></custom-color-picker>
			<custom-color-picker [label]="'--bgs-color-4'" key="--bgs-color-4"></custom-color-picker>
			<custom-color-picker [label]="'--bgs-color-5'" key="--bgs-color-5"></custom-color-picker>
			<custom-color-picker [label]="'--bgs-color-6'" key="--bgs-color-6"></custom-color-picker>
			<custom-color-picker [label]="'--bgs-color-7'" key="--bgs-color-7"></custom-color-picker>
			<custom-color-picker [label]="'--bgs-color-8'" key="--bgs-color-8"></custom-color-picker>
			<custom-color-picker [label]="'--bgs-color-9'" key="--bgs-color-9"></custom-color-picker>
		</div>
		<!-- <div class="settings-group battlegrounds">
			<div class="subtitle" [fsTranslate]="'settings.general.appearance.battlegrounds.widgets'"></div>
			<custom-color-picker [label]="'--bgs-color-1'" key="--bgs-color-1"></custom-color-picker>
		</div> -->
		<div class="buttons">
			<button
				class="button reset-button"
				[fsTranslate]="'settings.general.appearance.reset-button'"
				(click)="resetAll()"
			></button>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppearanceCustomizationPageComponent extends AbstractSubscriptionComponent implements AfterContentInit {
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

	resetAll() {
		this.appearance.resetAll();
	}
}
