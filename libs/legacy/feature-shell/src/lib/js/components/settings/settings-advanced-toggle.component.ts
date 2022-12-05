import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { Observable } from 'rxjs';
import { PreferencesService } from '../../services/preferences.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../abstract-subscription.component';

@Component({
	selector: 'settings-advanced-toggle',
	styleUrls: [
		`../../../css/global/menu.scss`,
		`../../../css/component/settings/settings-advanced-toggle.component.scss`,
	],
	template: `
		<div class="container">
			<button class="settings-advanced-toggle" (click)="toggleAdvancedSettings()">
				{{ buttonText$ | async }}
			</button>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsAdvancedToggleComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	buttonText$: Observable<string>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly prefs: PreferencesService,
		private readonly i18n: LocalizationFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.buttonText$ = this.listenForBasicPref$((prefs) => prefs.advancedModeToggledOn).pipe(
			this.mapData((pref) =>
				pref
					? this.i18n.translateString('settings.global.hide-advanced-settings-button')
					: this.i18n.translateString('settings.global.show-advanced-settings-button'),
			),
		);
	}

	toggleAdvancedSettings() {
		this.prefs.toggleAdvancedSettings();
	}
}
