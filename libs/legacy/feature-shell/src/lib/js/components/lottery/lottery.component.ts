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
import { Observable, combineLatest, interval, tap } from 'rxjs';
import { LocalizationFacadeService } from '../../services/localization-facade.service';
import { PreferencesService } from '../../services/preferences.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { LotteryTabType } from './lottery-navigation.component';

@Component({
	selector: 'lottery',
	styleUrls: [`../../../css/themes/general-theme.scss`, '../../../css/component/lottery/lottery.component.scss'],
	template: `
		<div class="lottery-container scalable general-theme" *ngIf="{ opacity: opacity$ | async } as value">
			<div class="background" [style.opacity]="value.opacity"></div>
			<div class="title-bar" [style.opacity]="value.opacity">
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

			<div class="content-header" [style.opacity]="value.opacity">
				<lottery-navigation class="navigation"></lottery-navigation>
				<ng-container *ngIf="selectedModule$ | async as selectedModule">
					<ng-container *ngIf="selectedModule === 'lottery'">
						<div class="tab-name lottery">
							<div class="tab-title">{{ currentModuleName$ | async }}</div>
							<div class="season-duration" [helpTooltip]="seasonStartDate$ | async">
								{{ seasonDurationEnd$ | async }}
							</div>
						</div>
						<div
							*ngIf="selectedModule === 'lottery'"
							class="control info"
							inlineSVG="assets/svg/info.svg"
							[helpTooltip]="'app.lottery.lottery.info-text' | owTranslate"
							[helpTooltipClasses]="'general-theme'"
							[helpTooltipWidth]="300"
						></div>
					</ng-container>
					<div class="tab-title" *ngIf="selectedModule !== 'lottery'">{{ currentModuleName$ | async }}</div>
				</ng-container>
			</div>

			<div class="content-main" [style.opacity]="value.opacity">
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
	seasonStartDate$: Observable<string>;
	seasonDurationEnd$: Observable<string>;
	opacity$: Observable<number>;

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
		this.opacity$ = this.store
			.listenPrefs$((prefs) => prefs.lotteryOpacity)
			.pipe(this.mapData(([opacity]) => opacity / 100));
		this.trackingTooltip$ = this.trackingOngoing$.pipe(
			this.mapData((trackingOngoing) =>
				trackingOngoing
					? this.i18n.translateString('app.lottery.tracking-ongoing-tooltip')
					: this.i18n.translateString('app.lottery.tracking-not-ongoing-tooltip'),
			),
		);
		this.seasonStartDate$ = this.store.lottery$().pipe(
			this.mapData((lottery) =>
				this.i18n.translateString('app.lottery.lottery.season-duration-end-tooltip', {
					// Only show the date, not the time
					startDate: lottery?.startDate().toLocaleString(this.i18n.formatCurrentLocale(), {
						year: 'numeric',
						month: 'numeric',
						day: 'numeric',
					}),
				}),
			),
		);
		this.seasonDurationEnd$ = combineLatest([interval(1000), this.store.lottery$()]).pipe(
			this.mapData(([_, lottery]) => {
				const endDate = lottery?.endDate();
				const timeLeft = endDate ? endDate.getTime() - Date.now() : 0;
				const timeLeftInSeconds = Math.round(timeLeft / 1000);
				const days = Math.floor(timeLeftInSeconds / (3600 * 24));
				const hours = Math.floor((timeLeftInSeconds % (3600 * 24)) / 3600);
				const minutes = Math.floor((timeLeftInSeconds % 3600) / 60);
				const seconds = Math.floor(timeLeftInSeconds % 60);
				return this.i18n.translateString('app.lottery.lottery.season-duration-end', {
					days: days,
					hours: hours,
					minutes: minutes,
					seconds: seconds,
				});
			}),
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
