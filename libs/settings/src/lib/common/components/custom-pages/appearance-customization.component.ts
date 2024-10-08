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
			<custom-color-picker
				[label]="'settings.general.appearance.battlegrounds.widget-background-color' | fsTranslate"
				key="--bgs-widget-background-color"
			></custom-color-picker>
		</div>
		<div class="buttons">
			<button
				class="reset-button"
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
