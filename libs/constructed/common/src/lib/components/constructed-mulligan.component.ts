/* eslint-disable @angular-eslint/template/no-negated-async */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Inject,
	OnDestroy,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent, sleep } from '@firestone/shared/framework/common';
import { ADS_SERVICE_TOKEN, IAdsService, ILocalizationService } from '@firestone/shared/framework/core';
import {
	BehaviorSubject,
	Observable,
	combineLatest,
	debounceTime,
	distinctUntilChanged,
	filter,
	shareReplay,
	takeUntil,
} from 'rxjs';
import { ConstructedMulliganGuideGuardianService } from '../services/constructed-mulligan-guide-guardian.service';
import { ConstructedMulliganGuideService } from '../services/constructed-mulligan-guide.service';
import { GameStateFacadeService } from '../services/game-state-facade.service';
import { MulliganChartData } from './mulligan-detailed-info.component';

@Component({
	selector: 'constructed-mulligan',
	styleUrls: ['./constructed-mulligan.component.scss'],
	template: `
		<div class="root">
			<ng-container *ngIf="showHandInfo$ | async">
				<ul
					class="mulligan-guide"
					*ngIf="cardsInHandInfo$ | async as cardsInHandInfo"
					[ngClass]="{ wide: cardsInHandInfo.length === 4 }"
				>
					<ng-container *ngIf="(showPremiumBanner$ | async) === false">
						<div class="mulligan-info scalable" *ngFor="let info of cardsInHandInfo">
							<div class="stat-container" *ngIf="info.impact !== null">
								<div class="stat mulligan-winrate">
									<span
										class="label"
										[fsTranslate]="'decktracker.overlay.mulligan.mulligan-impact'"
										[helpTooltip]="helpTooltip$ | async"
									></span>
									<span class="value">{{ info.impact }}</span>
								</div>
								<div class="stat mulligan-keep-rate">
									<span
										class="label"
										[fsTranslate]="'decktracker.overlay.mulligan.mulligan-keep-rate'"
										[helpTooltip]="
											'decktracker.overlay.mulligan.mulligan-keep-rate-tooltip' | fsTranslate
										"
									></span>
									<span class="value">{{ info.keepRate }}</span>
								</div>
							</div>
							<div class="stat mulligan-winrate no-data scalable" *ngIf="info.impact === null">
								<span
									class="label"
									[fsTranslate]="'decktracker.overlay.mulligan.no-mulligan-data'"
									[helpTooltip]="
										'decktracker.overlay.mulligan.no-mulligan-data-tooltip' | fsTranslate
									"
								></span>
							</div>
						</div>
					</ng-container>
					<ng-container *ngIf="showPremiumBanner$ | async">
						<div class="premium-container" *ngFor="let info of cardsInHandInfo">
							<mulligan-info-premium></mulligan-info-premium>
						</div>
					</ng-container>
				</ul>
			</ng-container>
			<div class="mulligan-overview scalable" *ngIf="showMulliganOverview$ | async">
				<mulligan-detailed-info [data]="allDeckMulliganInfo$ | async"></mulligan-detailed-info>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConstructedMulliganComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit, AfterViewInit, OnDestroy
{
	cardsInHandInfo$: Observable<readonly InternalMulliganAdvice[] | null>;
	allDeckMulliganInfo$: Observable<MulliganChartData | null>;
	showHandInfo$: Observable<boolean | null>;
	showMulliganOverview$: Observable<boolean | null>;
	showPremiumBanner$: Observable<boolean>;
	helpTooltip$: Observable<string | null>;

	private showPremiumBanner$$ = new BehaviorSubject<boolean>(false);
	private noData$$ = new BehaviorSubject<boolean>(false);

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		@Inject(ADS_SERVICE_TOKEN) private readonly ads: IAdsService,
		private readonly gameState: GameStateFacadeService,
		private readonly mulligan: ConstructedMulliganGuideService,
		private readonly guardian: ConstructedMulliganGuideGuardianService,
		private readonly prefs: PreferencesService,
		private readonly i18n: ILocalizationService,
		private readonly el: ElementRef,
		private readonly renderer: Renderer2,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await this.gameState.isReady();
		await this.ads.isReady();
		await this.guardian.isReady();
		await this.prefs.isReady();

		this.mulligan.mulliganAdvice$$
			.pipe(
				filter((advice) => !!advice),
				takeUntil(this.destroyed$),
			)
			.subscribe((advice) => {
				console.debug('[mulligan] noData?', advice?.noData, advice);
				this.noData$$.next(advice?.noData ?? false);
			});

		combineLatest([this.ads.hasPremiumSub$$, this.guardian.freeUsesLeft$$, this.noData$$])
			.pipe(
				debounceTime(200),
				this.mapData(([hasPremiumSub, freeUsesLeft, noData]) => noData || hasPremiumSub || freeUsesLeft > 0),
				distinctUntilChanged(),
			)
			.subscribe((showWidget) => this.showPremiumBanner$$.next(!showWidget));
		this.showPremiumBanner$ = this.showPremiumBanner$$.asObservable();
		this.showHandInfo$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => prefs.decktrackerShowMulliganCardImpact),
		);
		this.showMulliganOverview$ = combineLatest([
			this.showPremiumBanner$$,
			this.noData$$,
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.decktrackerShowMulliganDeckOverview)),
		]).pipe(
			this.mapData(
				([showPremiumBanner, noData, showMulliganOverview]) =>
					!noData && !showPremiumBanner && showMulliganOverview,
			),
		);
		this.helpTooltip$ = combineLatest([this.ads.hasPremiumSub$$, this.guardian.freeUsesLeft$$]).pipe(
			debounceTime(200),
			this.mapData(([hasPremiumSub, freeUsesLeft]) => {
				if (hasPremiumSub) {
					return this.i18n.translateString('decktracker.overlay.mulligan.mulligan-impact-tooltip-premium');
				}
				return this.i18n.translateString('decktracker.overlay.mulligan.mulligan-impact-tooltip-free', {
					value: freeUsesLeft,
				});
			}),
			distinctUntilChanged(),
			shareReplay(1),
		);
		this.cardsInHandInfo$ = combineLatest([this.noData$$, this.mulligan.mulliganAdvice$$]).pipe(
			filter(([noData, guide]) => !!guide),
			this.mapData(([noData, guide]) => {
				return guide!.cardsInHand
					.map((cardId) => guide?.allDeckCards.find((advice) => advice.cardId === cardId))
					.map((advice) => ({
						impact: noData ? null : advice?.score == null ? '-' : advice.score.toFixed(2),
						keepRate: noData
							? null
							: advice?.keepRate == null
							? '-'
							: `${(100 * advice.keepRate).toFixed(1)}%`,
					}));
			}),
		);
		this.allDeckMulliganInfo$ = this.mulligan.mulliganAdvice$$.pipe(
			filter((advice) => !!advice),
			this.mapData((guide) => {
				return {
					mulliganData: guide!.allDeckCards
						.map((advice) => ({
							cardId: advice.cardId,
							label: advice.cardId,
							value: advice.score ?? 0,
							selected: !!guide?.cardsInHand.includes(advice.cardId),
						}))
						.sort((a, b) => a.value - b.value),
					format: guide!.format,
					sampleSize: guide!.sampleSize,
					rankBracket: guide!.rankBracket,
					opponentClass: guide!.opponentClass,
				};
			}),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	async ngAfterViewInit() {
		await this.prefs.isReady();

		this.prefs.preferences$$
			.pipe(
				this.mapData((prefs) => prefs.decktrackerMulliganScale),
				filter((pref) => !!pref),
				distinctUntilChanged(),
				takeUntil(this.destroyed$),
			)
			.subscribe(async (scale) => {
				const newScale = scale / 100;
				const elements = await this.getScalableElements();
				console.debug('[mulligan] setting scale 2', newScale, elements);
				elements.forEach((element) => this.renderer.setStyle(element, 'transform', `scale(${newScale})`));
			});

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	override ngOnDestroy(): void {
		super.ngOnDestroy();
		if (!this.showPremiumBanner$$.value && !this.noData$$.value) {
			this.guardian.acknowledgeMulliganAdviceSeen();
		}
	}

	private async getScalableElements(): Promise<HTMLElement[]> {
		let elements = this.el.nativeElement.querySelectorAll('.scalable');
		let retriesLeft = 10;
		while (retriesLeft >= 0 && elements?.length < 3) {
			await sleep(100);
			elements = this.el.nativeElement.querySelectorAll('.scalable');
			retriesLeft--;
		}
		return elements;
	}
}

interface InternalMulliganAdvice {
	impact: string | null;
	keepRate: string | null;
}
