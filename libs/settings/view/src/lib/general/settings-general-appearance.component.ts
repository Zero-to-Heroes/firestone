import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { OverlayAppearanceService } from '@firestone/settings/services';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { ILocalizationService, waitForReady } from '@firestone/shared/framework/core';

// Deprecated: superseded by AppearanceCustomizationPageComponent (overlay themes).
@Component({
	standalone: false,
	selector: 'settings-general-appearance',
	styleUrls: [`../settings-common.component.scss`, `./settings-general-appearance.component.scss`],
	template: `
		<div class="title" [fsTranslate]="'settings.general.appearance.battlegrounds.title'"></div>
		<div class="settings-group battlegrounds">
			<custom-color-picker
				[label]="'settings.general.appearance.overlay-theme.color.bgs-background-start' | fsTranslate"
				key="--ov-bgs-widget-background-color-start"
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
export class SettingsGeneralAppearanceComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly i18n: ILocalizationService,
		private readonly appearance: OverlayAppearanceService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.appearance);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.markForCheck();
		}
	}

	resetAll() {
		this.appearance.resetCustomPalette();
	}
}
