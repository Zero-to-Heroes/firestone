import { AfterContentInit, ChangeDetectorRef, Directive, ElementRef, Input, Renderer2, ViewRef } from '@angular/core';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { PreferencesService } from '../services/preferences.service';

@Directive({
	selector: '[advancedSetting]',
	standalone: false,
})
export class AdvancedSettingDirective extends AbstractSubscriptionComponent implements AfterContentInit {
	@Input() advancedSetting: boolean | undefined | '';

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly renderer: Renderer2,
		private readonly el: ElementRef,
		private readonly prefs: PreferencesService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		if (this.advancedSetting === true || this.advancedSetting === '') {
			await waitForReady(this.prefs);

			this.prefs.preferences$$
				.pipe(this.mapData((prefs) => prefs.advancedModeToggledOn))
				.subscribe((value) => this.updateVisibility(value));

			if (!(this.cdr as ViewRef).destroyed) {
				this.cdr.detectChanges();
			}
		}
	}

	private updateVisibility(advancedModeToggledOn: boolean) {
		this.renderer.setStyle(this.el.nativeElement, 'display', advancedModeToggledOn ? 'inherit' : 'none');
		this.renderer.removeClass(this.el.nativeElement, 'advanced-setting-visible');
		this.renderer.removeClass(this.el.nativeElement, 'advanced-setting-hidden');
		this.renderer.addClass(
			this.el.nativeElement,
			advancedModeToggledOn ? 'advanced-setting-visible' : 'advanced-setting-hidden',
		);
	}
}
