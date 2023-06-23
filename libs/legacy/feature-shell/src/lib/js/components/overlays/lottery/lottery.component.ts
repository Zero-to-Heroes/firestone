import { AfterContentInit, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { AbstractSubscriptionStoreComponent } from '@components/abstract-subscription-store.component';
import { AnalyticsService } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { PreferencesService } from '../../../services/preferences.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';

@Component({
	selector: 'lottery',
	styleUrls: ['../../../../css/component/overlays/lottery/lottery.component.scss'],
	template: `
		<div class="lottery-container">
			<div class="title-bar">
				<div class="controls">
					<div
						class="control info"
						inlineSVG="assets/svg/info.svg"
						[helpTooltip]="'app.lottery.info-text' | owTranslate"
						[helpTooltipWidth]="300"
					></div>
					<control-close-simple
						class="control"
						(requestClose)="close()"
						[requestConfirmation]="true"
						[confirmationText]="closeConfirmationText"
						[confirmationCancel]="closeConfirmationCancelText"
						[confirmationOk]="closeConfirmationOkText"
					></control-close-simple>
				</div>
			</div>

			<div class="lottery-content">
				<div class="title">
					<div class="text" [owTranslate]="'app.lottery.title'"></div>
					<div class="value">{{ totalPoints$ | async }}</div>
				</div>
				<div class="stats">
					<div class="stat">
						<div
							class="label"
							[owTranslate]="'app.lottery.resources'"
							[helpTooltip]="'app.lottery.resources-tooltip' | translate"
						></div>
						<div class="value">{{ resources$ | async }}</div>
					</div>
					<div class="stat">
						<div
							class="label"
							[owTranslate]="'app.lottery.quilboars'"
							[helpTooltip]="'app.lottery.quilboars-tooltip' | translate"
						></div>
						<div class="value">{{ quilboars$ | async }}</div>
					</div>
					<div class="stat">
						<div
							class="label"
							[owTranslate]="'app.lottery.spells'"
							[helpTooltip]="'app.lottery.spells-tooltip' | translate"
						></div>
						<div class="value">{{ spells$ | async }}</div>
					</div>
				</div>
				<single-ad class="ad" [adId]="'bottom'" *ngIf="displayAd$ | async"></single-ad>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LotteryWidgetComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit, AfterViewInit
{
	displayAd$: Observable<boolean>;
	totalPoints$: Observable<string>;
	resources$: Observable<string>;
	quilboars$: Observable<string>;
	spells$: Observable<string>;

	closeConfirmationText: string;
	closeConfirmationCancelText: string;
	closeConfirmationOkText: string;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly prefs: PreferencesService,
		private readonly i18n: LocalizationFacadeService,
		private readonly analytics: AnalyticsService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit(): void {
		this.totalPoints$ = this.store
			.lottery$()
			.pipe(this.mapData((lottery) => lottery.currentPoints().toLocaleString(this.i18n.formatCurrentLocale())));
		this.resources$ = this.store
			.lottery$()
			.pipe(
				this.mapData((lottery) =>
					(lottery.totalResourcesUsed + lottery.resourcesUsedThisTurn).toLocaleString(
						this.i18n.formatCurrentLocale(),
					),
				),
			);
		this.quilboars$ = this.store
			.lottery$()
			.pipe(this.mapData((lottery) => lottery.quilboardsPlayed.toLocaleString(this.i18n.formatCurrentLocale())));
		this.spells$ = this.store
			.lottery$()
			.pipe(this.mapData((lottery) => lottery.spellsPlayed.toLocaleString(this.i18n.formatCurrentLocale())));
		this.displayAd$ = this.store.hasPremiumSub$().pipe(this.mapData((hasPremium) => !hasPremium));
		this.closeConfirmationText = `
			<div>${this.i18n.translateString('app.lottery.close-confirmation-text-1')}</div>
			<div style="font-weight: bold">${this.i18n.translateString('app.lottery.close-confirmation-text-2')}</div>
		`;
		this.closeConfirmationCancelText = this.i18n.translateString('app.lottery.close-confirmation-button-cancel');
		this.closeConfirmationOkText = this.i18n.translateString('app.lottery.close-confirmation-button-ok');
	}

	ngAfterViewInit() {
		this.analytics.trackEvent('lottery-show');
	}

	async close() {
		const prefs = await this.prefs.getPreferences();
		await this.prefs.savePreferences({ ...prefs, showLottery: false });
		this.analytics.trackEvent('lottery-close');
	}
}
