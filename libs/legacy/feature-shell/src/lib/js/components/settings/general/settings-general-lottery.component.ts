import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { firstValueFrom } from 'rxjs';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../abstract-subscription-store.component';

@Component({
	selector: 'settings-general-lottery',
	styleUrls: [
		`../../../../css/global/forms.scss`,
		`../../../../css/component/settings/settings-common.component.scss`,
		`../../../../css/component/settings/general/settings-general-lottery.component.scss`,
	],
	template: `
		<div class="title" [owTranslate]="'settings.general.premium.lottery-block-title'"></div>
		<div class="settings-group overlay-ad">
			<div class="text" [innerHTML]="lotteryText1"></div>
			<div class="text" [owTranslate]="'settings.general.premium.lottery-block-text2'"></div>
			<div class="text" [owTranslate]="'settings.general.premium.lottery-block-text3'"></div>
			<div class="text" [owTranslate]="'settings.general.premium.lottery-block-text4'"></div>
			<preference-toggle
				field="showLottery"
				[label]="'settings.general.premium.lottery-button-text' | owTranslate"
				[valueExtractor]="lotteryValueExtractor"
			></preference-toggle>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsGeneralLotteryComponent extends AbstractSubscriptionStoreComponent {
	lotteryText1 = this.i18n.translateString('settings.general.premium.lottery-block-text1', {
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
}
