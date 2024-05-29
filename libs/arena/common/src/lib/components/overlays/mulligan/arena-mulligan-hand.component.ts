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
import { getBaseCardId } from '@firestone-hs/reference-data';
import { buildColor } from '@firestone/constructed/common';
import { GameStateFacadeService } from '@firestone/game-state';
import { PreferencesService } from '@firestone/shared/common/service';
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
	takeUntil,
} from 'rxjs';
import { ArenaMulliganGuideGuardianService } from '../../../services/arena-mulligan-guide-guardian.service';
import { ArenaMulliganGuideService } from '../../../services/arena-mulligan-guide.service';

@Component({
	selector: 'arena-mulligan-hand',
	styleUrls: ['./arena-mulligan-hand.component.scss'],
	template: `
		<div class="root">
			<mulligan-hand-view
				[showHandInfo]="showHandInfo$ | async"
				[showPremiumBanner]="showPremiumBanner$ | async"
				[cardsInHandInfo]="cardsInHandInfo$ | async"
				[impactWithFreeUsersHelpTooltip]="helpTooltip$ | async"
			>
				<arena-mulligan-info-premium></arena-mulligan-info-premium>
				></mulligan-hand-view
			>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaMulliganHandComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit, AfterViewInit, OnDestroy
{
	cardsInHandInfo$: Observable<readonly InternalMulliganAdvice[] | null>;
	showHandInfo$: Observable<boolean | null>;
	showPremiumBanner$: Observable<boolean>;
	helpTooltip$: Observable<string | null>;

	private showPremiumBanner$$ = new BehaviorSubject<boolean>(false);
	private noData$$ = new BehaviorSubject<boolean>(false);

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		@Inject(ADS_SERVICE_TOKEN) private readonly ads: IAdsService,
		private readonly gameState: GameStateFacadeService,
		private readonly mulligan: ArenaMulliganGuideService,
		private readonly guardian: ArenaMulliganGuideGuardianService,
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
