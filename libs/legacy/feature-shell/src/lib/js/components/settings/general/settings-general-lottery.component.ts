import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { Observable, firstValueFrom } from 'rxjs';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../abstract-subscription-store.component';
import { Knob } from '../preference-slider.component';

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

		<div
			class="title"
			[owTranslate]="'settings.general.menu.premium'"
			[helpTooltip]="'settings.general.premium.lottery-premium-section-tooltip' | owTranslate"
		></div>
		<div class="settings-group" [ngClass]="{ disabled: !(isPremium$ | async) }">
			<div class="header" [owTranslate]="'settings.general.premium.lottery-size-title'"></div>
			<preference-slider
				class="first-slider"
				[field]="'lotteryScale'"
				[enabled]="true"
				[min]="30"
				[max]="125"
				[snapSensitivity]="5"
				[knobs]="sizeKnobs"
			>
			</preference-slider>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsGeneralLotteryComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	isPremium$: Observable<boolean>;

	lotteryText1 = this.i18n.translateString('settings.general.premium.lottery-block-text1', {
		twitterLink: `<a href="https://twitter.com/ZerotoHeroes_HS" target="_blank">${this.i18n.translateString(
			'global.social.twitter',
		)}</a>`,
		discordLink: `<a href="https://discord.gg/vKeB3gnKTy" target="_blank">${this.i18n.translateString(
			'global.social.discord',
		)}</a>`,
	});

	sizeKnobs: readonly Knob[] = [
		{
			absoluteValue: 30,
			label: this.i18n.translateString('settings.global.knob-sizes.small'),
		},
		{
			absoluteValue: 100,
			label: this.i18n.translateString('settings.global.knob-sizes.medium'),
		},
		{
			absoluteValue: 125,
			label: this.i18n.translateString('settings.global.knob-sizes.large'),
		},
	];

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
		this.isPremium$ = this.store.hasPremiumSub$();
	}
}
