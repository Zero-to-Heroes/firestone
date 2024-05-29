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
	Renderer2,
	ViewRef,
} from '@angular/core';
import { getBaseCardId } from '@firestone-hs/reference-data';
import { MulliganDeckData, buildColor } from '@firestone/constructed/common';
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
	Observable,
	combineLatest,
	debounceTime,
	distinctUntilChanged,
	filter,
	shareReplay,
	takeUntil,
	tap,
} from 'rxjs';
import { ArenaMulliganGuideGuardianService } from '../../../services/arena-mulligan-guide-guardian.service';
import { ArenaMulliganGuideService } from '../../../services/arena-mulligan-guide.service';

@Component({
	selector: 'arena-mulligan-deck',
	styleUrls: ['./arena-mulligan-deck.component.scss'],
	template: `
		<mulligan-deck-view
			[deckMulliganInfo]="allDeckMulliganInfo$ | async"
			[showMulliganOverview]="showMulliganOverview$ | async"
			[showFilters]="false"
			[sampleSize]="sampleSize$ | async"
		>
		</mulligan-deck-view>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaMulliganDeckComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit, AfterViewInit
{
	allDeckMulliganInfo$: Observable<MulliganDeckData | null>;
	showMulliganOverview$: Observable<boolean | null>;
	sampleSize$: Observable<string>;

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

		const showWidget$ = combineLatest([this.ads.hasPremiumSub$$, this.guardian.freeUsesLeft$$]).pipe(
			debounceTime(200),
			tap((info) => console.debug('[mulligan] showWidget', info)),
			this.mapData(([hasPremiumSub, freeUsesLeft]) => hasPremiumSub || freeUsesLeft > 0),
			distinctUntilChanged(),
		);
		this.showMulliganOverview$ = combineLatest([
			showWidget$,
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.decktrackerShowMulliganDeckOverview)),
		]).pipe(
			tap((info) => console.debug('[mulligan] showMulliganOverview', info)),
			this.mapData(([showWidget, showMulliganOverview]) => showWidget && showMulliganOverview),
		);

		this.allDeckMulliganInfo$ = this.mulligan.mulliganAdvice$$.pipe(
			filter((advice) => !!advice),
			this.mapData((guide) => {
				const result: MulliganDeckData = {
					mulliganData: guide!.allDeckCards.map((advice) => ({
						cardId: advice.cardId,
						label: advice.cardId,
						value: advice.score ?? 0,
						keepRate: 100 * (advice.keepRate ?? 0),
						selected: !!guide?.cardsInHand
							.map((cardId) => this.allCards.getRootCardId(getBaseCardId(cardId)))
							.includes(this.allCards.getRootCardId(getBaseCardId(advice.cardId))),
						keptColor: buildColor(
							'hsl(112, 100%, 64%)',
							'hsl(0, 100%, 64%)',
							advice.keepRate ?? 0,
							0.6,
							0.4,
						),
						impactColor: buildColor('hsl(112, 100%, 64%)', 'hsl(0, 100%, 64%)', advice.score ?? 0, 4, -4),
					})),
					format: guide!.format,
					sampleSize: guide!.sampleSize,
					rankBracket: guide!.rankBracket,
					opponentClass: guide!.opponentClass,
				};
				return result;
			}),
			shareReplay(1),
			tap((info) => console.debug('[mulligan] mulliganInfo', info)),
			takeUntil(this.destroyed$),
		);

		this.sampleSize$ = this.allDeckMulliganInfo$.pipe(
			this.mapData(
				(mulliganInfo) =>
					this.i18n.translateString(`app.decktracker.filters.sample-size-filter`, {
						value: mulliganInfo?.sampleSize.toLocaleString(this.i18n.formatCurrentLocale() ?? 'enUS'),
					})!,
			),
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
