/* eslint-disable @angular-eslint/template/no-negated-async */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Inject,
	OnDestroy,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { getBaseCardId } from '@firestone-hs/reference-data';
import { GameStateFacadeService } from '@firestone/game-state';
import { CONSTRUCTED_MULLIGAN_DAILY_FREE_USES, PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent, sleep } from '@firestone/shared/framework/common';
import {
	ADS_SERVICE_TOKEN,
	CardsFacadeService,
	IAdsService,
	ILocalizationService,
	waitForReady,
} from '@firestone/shared/framework/core';
import {
	BehaviorSubject,
	Observable,
	combineLatest,
	debounceTime,
	distinctUntilChanged,
	filter,
	shareReplay,
	switchMap,
	takeUntil,
} from 'rxjs';
import { MulliganChartData } from '../models/mulligan-advice';
import { ConstructedMulliganGuideGuardianService } from '../services/constructed-mulligan-guide-guardian.service';
import { ConstructedMulliganGuideService } from '../services/constructed-mulligan-guide.service';
import { buildColor } from './mulligan-deck-view.component';
import { InternalMulliganAdvice } from './mulligan-hand-view.component';

@Component({
	standalone: false,
	selector: 'constructed-mulligan-hand',
	styleUrls: ['./constructed-mulligan-hand.component.scss'],
	template: `
		<div class="root">
			<mulligan-hand-view
				[showHandInfo]="showHandInfo$ | async"
				[showPremiumBanner]="showPremiumBanner$ | async"
				[cardsInHandInfo]="cardsInHandInfo$ | async"
				[impactWithFreeUsersHelpTooltip]="helpTooltip$ | async"
				[premiumType]="'constructed'"
				[freeUses]="freeUses"
			>
			</mulligan-hand-view>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConstructedMulliganHandComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit, OnDestroy
{
	cardsInHandInfo$: Observable<readonly InternalMulliganAdvice[] | null>;
	allDeckMulliganInfo$: Observable<MulliganChartData | null>;
	showHandInfo$: Observable<boolean | null>;
	showPremiumBanner$: Observable<boolean>;
	helpTooltip$: Observable<string | null>;

	freeUses = CONSTRUCTED_MULLIGAN_DAILY_FREE_USES;

	private showPremiumBanner$$ = new BehaviorSubject<boolean>(false);
	private noData$$ = new BehaviorSubject<boolean>(false);
	private againstAi$$ = new BehaviorSubject<boolean>(false);

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
		private readonly allCards: CardsFacadeService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.gameState, this.ads, this.guardian, this.prefs);

		this.mulligan.mulliganAdvice$$
			.pipe(
				filter((advice) => !!advice),
				takeUntil(this.destroyed$),
			)
			.subscribe((advice) => {
				this.noData$$.next(advice?.noData ?? false);
				this.againstAi$$.next(advice?.againstAi ?? false);
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
					.map(
						(cardId) =>
							guide?.allDeckCards.find(
								(advice) => getBaseCardId(advice.cardId) === getBaseCardId(cardId),
							) ??
							guide?.allDeckCards.find(
								(advice) =>
									this.allCards.getRootCardId(getBaseCardId(advice.cardId)) ===
									this.allCards.getRootCardId(getBaseCardId(cardId)),
							),
					)
					.map((advice) => ({
						impact: noData ? null : advice?.score == null ? '-' : advice.score.toFixed(2),
						keepRate: noData
							? null
							: advice?.keepRate == null
							? '-'
							: `${(100 * advice.keepRate).toFixed(1)}%`,
						keptColor: buildColor(
							'hsl(112, 100%, 64%)',
							'hsl(0, 100%, 64%)',
							advice?.keepRate ?? 0,
							0.6,
							0.4,
						),
						impactColor: buildColor('hsl(112, 100%, 64%)', 'hsl(0, 100%, 64%)', advice?.score ?? 0, 4, -4),
					}));
			}),
			shareReplay(1),
			takeUntil(this.destroyed$),
		);

		this.cardsInHandInfo$
			.pipe(
				filter((info) => !!info?.length),
				switchMap(() =>
					combineLatest([
						this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.globalWidgetScale ?? 100)),
						this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.decktrackerMulliganScale ?? 100)),
					]),
				),
				takeUntil(this.destroyed$),
			)
			.subscribe(async ([globalScale, scale]) => {
				const newScale = (globalScale / 100) * (scale / 100);
				const elements = await this.getScalableElements();
				elements.forEach((element) => this.renderer.setStyle(element, 'transform', `scale(${newScale})`));
			});

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	override ngOnDestroy(): void {
		super.ngOnDestroy();
		if (!this.showPremiumBanner$$.value && !this.noData$$.value && !this.againstAi$$.value) {
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
