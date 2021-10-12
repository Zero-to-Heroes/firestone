import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostListener,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { Preferences } from '../../models/preferences';
import { OverwolfService } from '../../services/overwolf.service';
import { PreferencesService } from '../../services/preferences.service';

@Component({
	selector: 'settings-advanced-toggle',
	styleUrls: [
		`../../../css/global/components-global.scss`,
		`../../../css/global/menu.scss`,
		`../../../css/component/settings/settings-advanced-toggle.component.scss`,
	],
	template: `
		<div class="container">
			<button class="settings-advanced-toggle" (click)="toggleAdvancedSettings()">
				{{ advancedModeToggledOn ? 'Hide advanced settings' : 'Show advanced settings' }}
			</button>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsAdvancedToggleComponent implements AfterViewInit, OnDestroy {
	advancedModeToggledOn: boolean;

	private preferencesSubscription: Subscription;

	constructor(
		private readonly prefs: PreferencesService,
		private readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
	) {}

	ngAfterViewInit() {
		this.loadDefaultValues();
		const preferencesEventBus: BehaviorSubject<any> = this.ow.getMainWindow().preferencesEventBus;
		this.preferencesSubscription = preferencesEventBus.asObservable().subscribe((event) => {
			const preferences: Preferences = event.preferences;
			if (!preferences) {
				return;
			}
			this.advancedModeToggledOn = preferences.advancedModeToggledOn;
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		});
	}

	toggleAdvancedSettings() {
		this.prefs.updateAdvancedSettings(!this.advancedModeToggledOn);
	}

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		this.preferencesSubscription?.unsubscribe();
	}

	private async loadDefaultValues() {
		const prefs = await this.prefs.getPreferences();
		if (!prefs) {
			return;
		}
		this.advancedModeToggledOn = prefs.advancedModeToggledOn;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
