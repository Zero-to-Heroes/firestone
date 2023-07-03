import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Renderer2,
} from '@angular/core';
import { AbstractSubscriptionStoreComponent } from '@components/abstract-subscription-store.component';
import { AnalyticsService } from '@firestone/shared/framework/core';
import { Observable, tap } from 'rxjs';
import { LocalizationFacadeService } from '../../services/localization-facade.service';
import { PreferencesService } from '../../services/preferences.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { LotteryTabType } from './lottery-navigation.component';

@Component({
	selector: 'lottery',
	styleUrls: [`../../../css/themes/general-theme.scss`, '../../../css/component/lottery/lottery.component.scss'],
	template: `
		<div class="lottery-container scalable general-theme">
			<div class="title-bar">
				<div class="controls">
					<div
						class="tracking-indicator"
						*ngIf="{
							trackingOngoing: trackingOngoing$ | async
						} as value"
						[helpTooltip]="trackingTooltip$ | async"
						[helpTooltipClasses]="'general-theme'"
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
						[helpTooltipClasses]="'general-theme'"
					></preference-toggle>
					<div
						class="control opt-out"
						inlineSVG="assets/svg/delete.svg"
						[helpTooltip]="'app.lottery.opt-out-tooltip' | owTranslate"
						[helpTooltipClasses]="'general-theme'"
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

			<div class="content-header">
				<lottery-navigation class="navigation"></lottery-navigation>
				<div class="tab-title">{{ currentModuleName$ | async }}</div>
				<div
					*ngIf="(selectedModule$ | async) === 'lottery'"
					class="control info"
					inlineSVG="assets/svg/info.svg"
					[helpTooltip]="'app.lottery.lottery.info-text' | owTranslate"
					[helpTooltipClasses]="'general-theme'"
					[helpTooltipWidth]="300"
				></div>
			</div>

			<div class="content-main">
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
	currentModuleName$: Observable<string>;

	closeConfirmationText: string;
	closeConfirmationCancelText: string;
	closeConfirmationOkText: string;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly prefs: PreferencesService,
		private readonly i18n: LocalizationFacadeService,
		private readonly analytics: AnalyticsService,
		private readonly renderer: Renderer2,
		private readonly el: ElementRef,
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
		this.selectedModule$ = this.store
			.listenPrefs$((prefs) => prefs.lotteryCurrentModule)
			.pipe(this.mapData(([module]) => module || 'lottery'));

		this.currentModuleName$ = this.selectedModule$.pipe(
			this.mapData((module) => this.i18n.translateString(`app.lottery.navigation.${module}`)),
		);
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

		this.store
			.listenPrefs$((prefs) => prefs.lotteryScale)
			.pipe(this.mapData(([pref]) => pref))
			.subscribe((scale) => {
				// this.el.nativeElement.style.setProperty('--decktracker-scale', scale / 100);
				// this.el.nativeElement.style.setProperty(
				// 	'--decktracker-max-height',
				// 	this.player === 'player' ? '90vh' : '70vh',
				// );
				const newScale = scale / 100;
				const element = this.el.nativeElement.querySelector('.scalable');
				this.renderer.setStyle(element, 'transform', `scale(${newScale})`);
			});
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
}
