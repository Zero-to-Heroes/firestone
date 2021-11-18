import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Observable } from 'rxjs';
import { PreferencesService } from '../../services/preferences.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../abstract-subscription.component';

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
				{{ (advancedModeToggledOn$ | async) ? 'Hide advanced settings' : 'Show advanced settings' }}
			</button>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsAdvancedToggleComponent extends AbstractSubscriptionComponent implements AfterViewInit {
	advancedModeToggledOn$: Observable<boolean>;

	constructor(
		private readonly prefs: PreferencesService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	ngAfterViewInit() {
		this.advancedModeToggledOn$ = this.listenForBasicPref$((prefs) => prefs.advancedModeToggledOn);
	}

	toggleAdvancedSettings() {
		this.prefs.toggleAdvancedSettings();
	}
}
