import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { Observable, firstValueFrom } from 'rxjs';
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
		<div class="settings-group overlay-ad">
			<div class="title" [owTranslate]="'settings.general.premium.lottery-block-title'"></div>
			<div class="text" [innerHTML]="lotteryText1"></div>
			<preference-toggle
				field="showLottery"
				[label]="'settings.general.premium.lottery-button-text' | owTranslate"
				[valueExtractor]="lotteryValueExtractor"
			></preference-toggle>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsGeneralPremiumComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	text1$: Observable<string>;

	lotteryText1 = this.i18n.translateString('settings.general.premium.lottery-block-text', {
		twitterLink: `<a href="https://twitter.com/ZerotoHeroes_HS" target="_blank">${this.i18n.translateString(
			'global.social.twitter',
		)}</a>`,
		discordLink: `<a href="https://discord.gg/vKeB3gnKTy" target="_blank">${this.i18n.translateString(
			'global.social.discord',
		)}</a>`,
	});

	lotteryValueExtractor = async (valueFromPrefs: boolean): Promise<boolean> => {
		const hasPremiumSub = await firstValueFrom(this.store.hasPremiumSub$());
		const result = valueFromPrefs == null ? !hasPremiumSub : valueFromPrefs;
		console.debug('enable lottery displayed value', result, valueFromPrefs, hasPremiumSub);
		return result;
	};

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
	}
}
