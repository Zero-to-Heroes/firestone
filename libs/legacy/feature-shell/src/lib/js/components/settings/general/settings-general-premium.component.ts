import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../abstract-subscription-store.component';

@Component({
	selector: 'settings-general-premium',
	styleUrls: [
		`../../../../css/global/forms.scss`,
		`../../../../css/component/settings/settings-common.component.scss`,
		`../../../../css/component/settings/general/settings-general-premium.component.scss`,
	],
	template: `
		<div class="settings-group premium">
			<div class="title" [owTranslate]="'settings.general.premium.title'"></div>
			<div class="text" [innerHTML]="text1$ | async"></div>
		</div>
		<div class="settings-group overlay-ad" *ngIf="showOverlayAdBlock$$ | async">
			<div class="title" [owTranslate]="'settings.general.premium.overlay-ad-block-title'"></div>
			<div class="text" [innerHTML]="'settings.general.premium.overlay-ad-block-text' | owTranslate"></div>
			<preference-toggle
				field="showOverlayAd"
				[label]="'settings.general.premium.overlay-ad-button-text' | owTranslate"
			></preference-toggle>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsGeneralPremiumComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	text1$: Observable<string>;

	showOverlayAdBlock$$ = new BehaviorSubject<boolean>(false);

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.text1$ = this.listenForBasicPref$((prefs) => prefs.locale).pipe(
			this.mapData((locale) =>
				this.i18n.translateString('settings.general.localization.text-1', {
					link: `<a href="https://github.com/Zero-to-Heroes/firestone/wiki/Premium-vs-ads" target="_blank">${this.i18n.translateString(
						'settings.general.localization.link',
					)}</a>`,
				}),
			),
		);
		overwolf.settings.getExtensionSettings((settingsResult) => {
			this.showOverlayAdBlock$$.next(
				settingsResult?.settings?.channel === 'beta' || process.env['NODE_ENV'] !== 'production',
			);
		});
	}
}
