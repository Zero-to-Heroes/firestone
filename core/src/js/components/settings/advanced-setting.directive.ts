import {
	AfterViewInit,
	ChangeDetectorRef,
	Directive,
	ElementRef,
	HostListener,
	OnDestroy,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { Preferences } from '../../models/preferences';
import { OverwolfService } from '../../services/overwolf.service';
import { PreferencesService } from '../../services/preferences.service';

@Directive({
	selector: '[advancedSetting]',
})
// See https://blog.angularindepth.com/building-tooltips-for-angular-3cdaac16d138
export class AdvancedSettingDirective implements AfterViewInit, OnDestroy {
	private preferencesSubscription: Subscription;

	constructor(
		private readonly prefs: PreferencesService,
		private readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly renderer: Renderer2,
		private readonly el: ElementRef,
	) {}

	ngAfterViewInit() {
		this.loadDefaultValues();
		const preferencesEventBus: BehaviorSubject<any> = this.ow.getMainWindow().preferencesEventBus;
		this.preferencesSubscription = preferencesEventBus.asObservable().subscribe((event) => {
			const preferences: Preferences = event.preferences;
			if (!preferences) {
				console.warn('no pref received', event);
				return;
			}

			this.updateVisibility(preferences.advancedModeToggledOn);
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		});
	}

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		this.preferencesSubscription?.unsubscribe();
	}

	private async loadDefaultValues() {
		const prefs = await this.prefs.getPreferences();
		this.updateVisibility(prefs.advancedModeToggledOn);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private updateVisibility(advancedModeToggledOn: boolean) {
		this.renderer.setStyle(this.el.nativeElement, 'display', advancedModeToggledOn ? 'initial' : 'none');
	}
}
