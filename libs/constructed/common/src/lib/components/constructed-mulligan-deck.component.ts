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
import { CardClass, getBaseCardId } from '@firestone-hs/reference-data';
import { GameStateFacadeService } from '@firestone/game-state';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { SortCriteria, invertDirection } from '@firestone/shared/common/view';
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
	takeUntil,
	tap,
} from 'rxjs';
import { ConstructedMulliganGuideGuardianService } from '../services/constructed-mulligan-guide-guardian.service';
import { ConstructedMulliganGuideService } from '../services/constructed-mulligan-guide.service';
import { MulliganChartDataCard } from './mulligan-detailed-info.component';

@Component({
	selector: 'constructed-mulligan-deck',
	styleUrls: ['./constructed-mulligan-deck.component.scss'],
	template: `
		<div class="mulligan-deck-overview scalable" *ngIf="showMulliganOverview$ | async">
			<div class="widget-header">
				<div class="title" [fsTranslate]="'decktracker.overlay.mulligan.deck-mulligan-overview-title'"></div>
				<div class="filters">
					<div class="filter rank-bracket" (click)="cycleRanks()">
						<div class="text">{{ rankBracketLabel$ | async }}</div>
					</div>
					<div class="filter opponent" (click)="cycleOpponent()">
						<div class="text">{{ opponentLabel$ | async }}</div>
					</div>
					<div class="format">{{ formatLabel$ | async }}</div>
				</div>
				<div class="sample-size">{{ sampleSize$ | async }}</div>
			</div>
			<div class="content">
				<div class="deck-header" *ngIf="sortCriteria$ | async as sort">
					<sortable-table-label
						class="cell keep-rate"
						[name]="'decktracker.overlay.mulligan.mulligan-keep-rate' | fsTranslate"
						[sort]="sort"
						[criteria]="'keep-rate'"
						(sortClick)="onSortClick($event)"
					>
					</sortable-table-label>
					<sortable-table-label
						class="cell card"
						[name]="'decktracker.overlay.mulligan.mulligan-card' | fsTranslate"
						[sort]="sort"
						[criteria]="'card'"
						(sortClick)="onSortClick($event)"
					>
					</sortable-table-label>
					<sortable-table-label
						class="cell impact"
						[name]="'decktracker.overlay.mulligan.mulligan-impact' | fsTranslate"
						[sort]="sort"
						[criteria]="'impact'"
						(sortClick)="onSortClick($event)"
					>
					</sortable-table-label>
				</div>
				<div class="deck" *ngIf="allDeckMulliganInfo$ | async as allDeckMulliganInfo">
					<div
						class="deck-card"
						*ngFor="let card of allDeckMulliganInfo"
						[ngClass]="{ selected: card.selected }"
					>
						<div class="cell keep-rate">{{ card.keepRate?.toFixed(2) ?? '-' }}%</div>
						<card-tile class="cell card" [cardId]="card.cardId"></card-tile>
						<div class="cell impact">{{ card.value?.toFixed(2) ?? '-' }}</div>
					</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConstructedMulliganDeckComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit, AfterViewInit
{
	cardsInHandInfo$: Observable<readonly InternalMulliganAdvice[] | null>;
	allDeckMulliganInfo$: Observable<readonly MulliganChartDataCard[] | null>;
	showMulliganOverview$: Observable<boolean | null>;

	rankBracketLabel$: Observable<string>;
	opponentLabel$: Observable<string>;
	formatLabel$: Observable<string>;
	sampleSize$: Observable<string>;

	sortCriteria$: Observable<SortCriteria<ColumnSortType>>;

	private sortCriteria$$ = new BehaviorSubject<SortCriteria<ColumnSortType>>({
		criteria: 'impact',
		direction: 'desc',
	});
	private opponentActualClass$$ = new BehaviorSubject<string | null>(null);

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

		this.sortCriteria$ = this.sortCriteria$$;
		// const noData$ = this.mulligan.mulliganAdvice$$.pipe(
		// 	filter((advice) => !!advice),
		// 	this.mapData((advice) => advice?.noData ?? false),
		// );
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

		const mulliganInfo$ = this.mulligan.mulliganAdvice$$.pipe(
			filter((advice) => !!advice),
			this.mapData((guide) => {
				return {
					mulliganData: guide!.allDeckCards
						.map((advice) => ({
							cardId: advice.cardId,
							label: advice.cardId,
							value: advice.score ?? 0,
							keepRate: 100 * (advice.keepRate ?? 0),
							selected: !!guide?.cardsInHand
								.map((cardId) => this.allCards.getRootCardId(getBaseCardId(cardId)))
								.includes(this.allCards.getRootCardId(getBaseCardId(advice.cardId))),
						}))
						.sort((a, b) => a.value - b.value),
					format: guide!.format,
					sampleSize: guide!.sampleSize,
					rankBracket: guide!.rankBracket,
					opponentClass: guide!.opponentClass,
				};
			}),
		);
		this.allDeckMulliganInfo$ = combineLatest([mulliganInfo$, this.sortCriteria$$]).pipe(
			this.mapData(([mulliganInfo, sortCriteria]) =>
				[...(mulliganInfo?.mulliganData ?? [])].sort((a, b) => this.sortCards(a, b, sortCriteria)),
			),
		);

		this.rankBracketLabel$ = this.prefs.preferences$$.pipe(
			this.mapData(
				(prefs) =>
					this.i18n.translateString(
						`app.decktracker.filters.rank-bracket.${prefs.decktrackerMulliganRankBracket}`,
					)!,
			),
		);
		this.opponentLabel$ = this.prefs.preferences$$.pipe(
			this.mapData(
				(prefs) =>
					this.i18n.translateString(`app.decktracker.meta.matchup-vs-tooltip`, {
						className: this.i18n.translateString(`global.class.${prefs.decktrackerMulliganOpponent}`),
					})!,
			),
		);
		this.formatLabel$ = mulliganInfo$.pipe(
			this.mapData((mulliganInfo) => this.i18n.translateString(`global.format.${mulliganInfo.format}`)!),
		);
		this.sampleSize$ = mulliganInfo$.pipe(
			this.mapData(
				(mulliganInfo) =>
					this.i18n.translateString(`app.decktracker.filters.sample-size-filter`, {
						value: mulliganInfo.sampleSize.toLocaleString(this.i18n.formatCurrentLocale() ?? 'enUS'),
					})!,
			),
		);
		this.gameState.gameState$$
			.pipe(
				this.mapData((gameState) =>
					CardClass[gameState?.opponentDeck?.hero?.classes?.[0] ?? CardClass.NEUTRAL].toLowerCase(),
				),
			)
			.subscribe(this.opponentActualClass$$);

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

	async cycleRanks() {
		const prefs = await this.prefs.getPreferences();
		const currentRank = prefs.decktrackerMulliganRankBracket;
		// Build an array based on all the possible values of the decktrackerMulliganRankBracket type
		const ranks: ('competitive' | 'top-2000-legend' | 'legend' | 'legend-diamond')[] = [
			'competitive',
			'top-2000-legend',
			'legend',
			'legend-diamond',
		];
		const nextRank = ranks[(ranks.indexOf(currentRank) + 1) % ranks.length];
		const newPrefs: Preferences = {
			...prefs,
			decktrackerMulliganRankBracket: nextRank,
		};
		await this.prefs.savePreferences(newPrefs);
	}

	async cycleOpponent() {
		const prefs = await this.prefs.getPreferences();
		const currentOpponent = prefs.decktrackerMulliganOpponent;
		const options = ['all', this.opponentActualClass$$.value ?? 'all'];
		const nextOpponent = options[(options.indexOf(currentOpponent) + 1) % options.length];
		const newPrefs: Preferences = {
			...prefs,
			decktrackerMulliganOpponent: nextOpponent,
		};
		await this.prefs.savePreferences(newPrefs);
	}

	onSortClick(rawCriteria: string) {
		const criteria: ColumnSortType = rawCriteria as ColumnSortType;
		this.sortCriteria$$.next({
			criteria: criteria,
			direction:
				criteria === this.sortCriteria$$.value?.criteria
					? invertDirection(this.sortCriteria$$.value.direction)
					: 'desc',
		});
	}

	private sortCards(
		a: MulliganChartDataCard,
		b: MulliganChartDataCard,
		sortCriteria: SortCriteria<ColumnSortType>,
	): number {
		switch (sortCriteria?.criteria) {
			case 'card':
				return this.sortByCard(a, b, sortCriteria.direction);
			case 'impact':
				return this.sortByImpact(a, b, sortCriteria.direction);
			case 'keep-rate':
				return this.sortByKeepRate(a, b, sortCriteria.direction);
			default:
				return 0;
		}
	}

	private sortByCard(a: MulliganChartDataCard, b: MulliganChartDataCard, direction: 'asc' | 'desc'): number {
		const aData = this.allCards.getCard(a.cardId)?.cost ?? 0;
		const bData = this.allCards.getCard(b.cardId)?.cost ?? 0;
		return direction === 'asc' ? aData - bData : bData - aData;
	}

	private sortByImpact(a: MulliganChartDataCard, b: MulliganChartDataCard, direction: 'asc' | 'desc'): number {
		const aData = a.value ?? 0;
		const bData = b.value ?? 0;
		return direction === 'asc' ? aData - bData : bData - aData;
	}

	private sortByKeepRate(a: MulliganChartDataCard, b: MulliganChartDataCard, direction: 'asc' | 'desc'): number {
		const aData = a.keepRate ?? 0;
		const bData = b.keepRate ?? 0;
		return direction === 'asc' ? aData - bData : bData - aData;
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

type ColumnSortType = 'card' | 'keep-rate' | 'impact';
