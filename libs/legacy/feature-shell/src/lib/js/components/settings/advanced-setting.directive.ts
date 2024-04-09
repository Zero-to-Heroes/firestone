import { AfterContentInit, ChangeDetectorRef, Directive, ElementRef, Renderer2, ViewRef } from '@angular/core';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';

@Directive({
	selector: '[advancedSetting]',
})
export class AdvancedSettingDirective extends AbstractSubscriptionComponent implements AfterContentInit {
	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly renderer: Renderer2,
		private readonly el: ElementRef,
		private readonly prefs: PreferencesService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs);

		this.prefs.preferences$$
			.pipe(this.mapData((prefs) => prefs.advancedModeToggledOn))
			.subscribe((value) => this.updateVisibility(value));

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	private updateVisibility(advancedModeToggledOn: boolean) {
		this.renderer.setStyle(this.el.nativeElement, 'display', advancedModeToggledOn ? 'inherit' : 'none');
	}
}
