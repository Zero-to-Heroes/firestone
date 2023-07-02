import { AfterContentInit, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { AbstractSubscriptionStoreComponent } from '@components/abstract-subscription-store.component';
import { AnalyticsService } from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { LocalizationFacadeService } from '../../services/localization-facade.service';
import { PreferencesService } from '../../services/preferences.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { LotteryTabType } from './lottery-navigation.component';

@Component({
	selector: 'lottery',
	styleUrls: ['../../../css/component/lottery/lottery.component.scss'],
	template: `
		<div class="lottery-container">
			<div class="title-bar">
				<div class="controls">
					<div
						class="tracking-indicator"
						*ngIf="{
							trackingOngoing: trackingOngoing$ | async
						} as value"
						[helpTooltip]="trackingTooltip$ | async"
					>
						<div
							class="light"
							[ngClass]="{ tracking: value.trackingOngoing, 'not-tracking': !value.trackingOngoing }"
						></div>
					</div>
					<preference-toggle
						field="lotteryOverlay"
						[label]="'app.lottery.overlay-toggle-label' | owTranslate"
						[helpTooltip]="'app.lottery.overlay-toggle-tooltip' | owTranslate"
					></preference-toggle>
					<div
						class="control info"
						inlineSVG="assets/svg/info.svg"
						[helpTooltip]="'app.lottery.info-text' | owTranslate"
						[helpTooltipWidth]="300"
					></div>
					<div
						class="control opt-out"
						inlineSVG="assets/svg/delete.svg"
						[helpTooltip]="'app.lottery.opt-out-tooltip' | owTranslate"
						[helpTooltipWidth]="300"
						confirmationTooltip
						[askConfirmation]="true"
						[confirmationText]="'app.lottery.opt-out-confirmation-text' | owTranslate"
						[validButtonText]="'app.lottery.opt-out-button-ok' | owTranslate"
						[cancelButtonText]="'app.lottery.opt-out-button-cancel' | owTranslate"
						[confirmationPosition]="'right'"
						(onConfirm)="optOut()"
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
				<lottery-navigation class="navigation" (moduleSelected)="onModuleSelected($event)"></lottery-navigation>
				<ng-container [ngSwitch]="selectedModule$ | async">
					<lottery-lottery *ngSwitchCase="'lottery'"></lottery-lottery>
					<lottery-achievements *ngSwitchCase="'achievements'"></lottery-achievements>
				</ng-container>
			</div>
			<single-ad
				class="ad"
				[adId]="'bottom'"
				*ngIf="displayAd$ | async"
				(adVisibility)="onAdVisibilityChanged($event)"
			></single-ad>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LotteryWidgetComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit, AfterViewInit
{
	displayAd$: Observable<boolean>;
	selectedModule$: Observable<LotteryTabType>;
	trackingOngoing$: Observable<boolean>;
	trackingTooltip$: Observable<string>;

	closeConfirmationText: string;
	closeConfirmationCancelText: string;
	closeConfirmationOkText: string;

	private selectedModule$$ = new BehaviorSubject<LotteryTabType>(null);

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
		this.displayAd$ = this.store.hasPremiumSub$().pipe(this.mapData((hasPremium) => !hasPremium));
		this.closeConfirmationText = `
			<div style="font-weight: bold">${this.i18n.translateString('app.lottery.close-confirmation-text-2')}</div>
		`;
		this.closeConfirmationCancelText = this.i18n.translateString('app.lottery.close-confirmation-button-cancel');
		this.closeConfirmationOkText = this.i18n.translateString('app.lottery.close-confirmation-button-ok');
		this.selectedModule$ = this.selectedModule$$.asObservable();
		this.trackingOngoing$ = this.store.shouldTrackLottery$().pipe(
			tap((info) => console.debug('should track lottery', info)),
			this.mapData((shouldTrack) => shouldTrack),
		);
		this.trackingTooltip$ = this.trackingOngoing$.pipe(
			this.mapData((trackingOngoing) =>
				trackingOngoing
					? this.i18n.translateString('app.lottery.tracking-ongoing-tooltip')
					: this.i18n.translateString('app.lottery.tracking-not-ongoing-tooltip'),
			),
		);
	}

	ngAfterViewInit() {
		this.analytics.trackEvent('lottery-show');
	}

	async close() {
		console.log('[lottery] sending close event');
		this.store.eventBus$$.next({ name: 'lottery-closed' });
		this.analytics.trackEvent('lottery-close');
	}

	async optOut() {
		const prefs = await this.prefs.getPreferences();
		await this.prefs.savePreferences({ ...prefs, showLottery: false });
		this.analytics.trackEvent('lottery-opt-out');
	}

	onAdVisibilityChanged(visible: 'hidden' | 'partial' | 'full') {
		this.store.eventBus$$.next({ name: 'lottery-visibility-changed', data: { visible } });
	}

	onModuleSelected(module: LotteryTabType) {
		console.debug('selected module', module);
		this.selectedModule$$.next(module);
	}
}
