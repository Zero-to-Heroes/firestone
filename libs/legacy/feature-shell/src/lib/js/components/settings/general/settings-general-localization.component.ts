import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { Observable } from 'rxjs';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';

@Component({
	selector: 'settings-general-localization',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/global/forms.scss`,
		`../../../../css/component/settings/settings-common.component.scss`,
		`../../../../css/component/settings/general/settings-general-localization.component.scss`,
	],
	template: `
		<div class="title" [owTranslate]="'settings.general.localization.title'"></div>
		<div class="settings-group localization">
			<div class="text" [innerHTML]="'settings.general.localization.text-1' | owTranslate"></div>
			<div class="text" [innerHTML]="'settings.general.localization.text-11' | owTranslate"></div>
			<div class="text" [innerHTML]="text2$ | async"></div>
			<div class="text" [innerHTML]="'settings.general.localization.text-3' | owTranslate"></div>
			<localization-dropdown class="language-dropdown"></localization-dropdown>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsGeneralLocalizationComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	text2$: Observable<string>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.text2$ = this.listenForBasicPref$((prefs) => prefs.locale).pipe(
			this.mapData((locale) =>
				this.i18n.translateString('settings.general.localization.text-2', {
					link: `<a href="https://github.com/Zero-to-Heroes/firestone-translations/blob/main/README.md" target="_blank">${this.i18n.translateString(
						'settings.general.localization.link',
					)}</a>`,
				}),
			),
		);
	}
}
