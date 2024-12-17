/* eslint-disable no-mixed-spaces-and-tabs */
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
	Input,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { GameStateFacadeService } from '@firestone/game-state';
import { PreferencesService } from '@firestone/shared/common/service';
import { SortCriteria, invertDirection } from '@firestone/shared/common/view';
import { AbstractSubscriptionComponent, sleep } from '@firestone/shared/framework/common';
import {
	ADS_SERVICE_TOKEN,
	CardsFacadeService,
	IAdsService,
	ILocalizationService,
	waitForReady,
} from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable, combineLatest, distinctUntilChanged, filter, takeUntil } from 'rxjs';
import { MulliganChartDataCard, MulliganDeckData } from '../models/mulligan-advice';
import { ConstructedMulliganGuideGuardianService } from '../services/constructed-mulligan-guide-guardian.service';
import { ConstructedMulliganGuideService } from '../services/constructed-mulligan-guide.service';

@Component({
	selector: 'mulligan-deck-view',
	styleUrls: ['./mulligan-deck-view.component.scss'],
	template: `
		<div class="mulligan-deck-overview scalable" *ngIf="showMulliganOverview">
			<div class="widget-header">
				<div class="title" [fsTranslate]="'decktracker.overlay.mulligan.deck-mulligan-overview-title'"></div>
				<mulligan-deck-view-archetype
					*ngIf="showArchetypeSelection"
					class="archetype-info"
					[archetypeId]="archetypeId$ | async"
					[deckstring]="deckstring$ | async"
				>
				</mulligan-deck-view-archetype>
				<div class="filters">
					<div
						class="filter rank-bracket"
						*ngIf="cycleRanks"
						(click)="cycleRanks()"
						[helpTooltip]="rankBracketTooltip"
					>
						<div class="text">{{ rankBracketLabel }}</div>
					</div>
					<div
						class="filter opponent"
						*ngIf="cycleOpponent"
						(click)="cycleOpponent()"
						[helpTooltip]="opponentTooltip"
					>
						<div class="text">{{ opponentLabel }}</div>
					</div>
					<div class="filter time" *ngIf="cycleTime" (click)="cycleTime()" [helpTooltip]="timeTooltip">
						<div class="text">{{ timeLabel }}</div>
					</div>
				</div>
				<div class="additional-info">
					<div class="filter format" *ngIf="formatLabel" (click)="cycleFormat()">
						<div class="text">{{ formatLabel }}</div>
					</div>
					<div class="sample-size" [helpTooltip]="sampleSizeTooltip">{{ sampleSize }}</div>
				</div>
			</div>
			<div class="content">
				<div class="deck-header" *ngIf="sortCriteria$ | async as sort">
					<sortable-table-label
						class="cell keep-rate"
						[name]="'decktracker.overlay.mulligan.mulligan-keep-rate' | fsTranslate"
						[sort]="sort"
						[criteria]="'keep-rate'"
						[helpTooltip]="'app.decktracker.meta.details.cards.mulligan-kept-header-tooltip' | fsTranslate"
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
						[helpTooltip]="
							'app.decktracker.meta.details.cards.mulligan-winrate-impact-header-tooltip' | fsTranslate
						"
						(sortClick)="onSortClick($event)"
					>
					</sortable-table-label>
				</div>
				<div class="deck" *ngIf="sortedDeckMulliganInfo$ | async as allDeckMulliganInfo">
					<div
						class="deck-card"
						*ngFor="let card of allDeckMulliganInfo"
						[ngClass]="{ selected: card.selected }"
					>
						<div class="cell keep-rate" [style.color]="card.keptColor">
							{{ card.keepRate === null ? '-' : card.keepRate?.toFixed(2) + '%' }}
						</div>
						<card-tile class="cell card" [cardId]="card.cardId"></card-tile>
						<div class="cell impact" [style.color]="card.impactColor">
							{{ card.value?.toFixed(2) ?? '-' }}
						</div>
					</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MulliganDeckViewComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit, AfterViewInit
{
	sortedDeckMulliganInfo$: Observable<readonly MulliganChartDataCard[] | null>;
	sortCriteria$: Observable<SortCriteria<ColumnSortType>>;
	deckstring$: Observable<string | null>;
	archetypeId$: Observable<number | null>;

	@Input() showMulliganOverview: boolean | null;
	@Input() showArchetypeSelection: boolean | null;
	@Input() showFilters: boolean;
	@Input() rankBracketTooltip: string | null;
	@Input() rankBracketLabel: string | null;
	@Input() opponentTooltip: string | null;
	@Input() opponentLabel: string | null;
	@Input() timeTooltip: string | null;
	@Input() timeLabel: string | null;
	@Input() formatLabel: string | null;
	@Input() sampleSize: string | null;
	@Input() sampleSizeTooltip: string | null;
	@Input() allowResize = true;
	@Input() cycleRanks: () => void;
	@Input() cycleOpponent: () => void;
	@Input() cycleTime: () => void;
	@Input() cycleFormat: () => void;

	@Input() set deckMulliganInfo(value: MulliganDeckData | null) {
		this.deckMulliganInfo$$.next(value);
		this.deckstring$$.next(value?.deckstring ?? null);
		this.archetypeId$$.next(value?.archetypeId ?? null);
	}

	private sortCriteria$$ = new BehaviorSubject<SortCriteria<ColumnSortType>>({
		criteria: 'impact',
		direction: 'desc',
	});
	private deckMulliganInfo$$ = new BehaviorSubject<MulliganDeckData | null>(null);
	private deckstring$$ = new BehaviorSubject<string | null>(null);
	private archetypeId$$ = new BehaviorSubject<number | null>(null);

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

		this.sortCriteria$ = this.sortCriteria$$.pipe(this.mapData((info) => info));
		this.deckstring$ = this.deckstring$$.pipe(this.mapData((info) => info));
		this.archetypeId$ = this.archetypeId$$.pipe(this.mapData((info) => info));
		this.sortedDeckMulliganInfo$ = combineLatest([this.deckMulliganInfo$$, this.sortCriteria$$]).pipe(
			this.mapData(([mulliganInfo, sortCriteria]) =>
				[...(mulliganInfo?.mulliganData ?? [])].sort((a, b) => this.sortCards(a, b, sortCriteria)),
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
				if (this.allowResize) {
					const newScale = scale / 100;
					const elements = await this.getScalableElements();
					elements.forEach((element) => this.renderer.setStyle(element, 'transform', `scale(${newScale})`));
				}
			});

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
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

type ColumnSortType = 'card' | 'keep-rate' | 'impact';

export const buildColor = (
	goodColor: string,
	badColor: string,
	value: number,
	maxGood: number,
	minBad: number,
	debug?,
): string => {
	const percentage = Math.max(0, Math.min(1, (value - minBad) / (maxGood - minBad)));
	const color = interpolateColors(badColor, goodColor, percentage, debug);
	return color;
};

const interpolateColors = (color1Hsl: string, color2Hsl: string, percentage: number, debug): string => {
	const h1 = parseInt(color1Hsl.substring(4, color1Hsl.indexOf(',')), 10);
	const s1 = parseInt(color1Hsl.substring(color1Hsl.indexOf(',') + 1, color1Hsl.lastIndexOf(',')), 10);
	const l1 = parseInt(color1Hsl.substring(color1Hsl.lastIndexOf(',') + 1, color1Hsl.length - 1), 10);
	const h2 = parseInt(color2Hsl.substring(4, color2Hsl.indexOf(',')), 10);
	const s2 = parseInt(color2Hsl.substring(color2Hsl.indexOf(',') + 1, color2Hsl.lastIndexOf(',')), 10);
	const l2 = parseInt(color2Hsl.substring(color2Hsl.lastIndexOf(',') + 1, color2Hsl.length - 1), 10);
	const h = h1 + Math.round((h2 - h1) * percentage);
	const s = s1 + Math.round((s2 - s1) * percentage);
	const l = l1 + Math.round((l2 - l1) * percentage);
	return `hsl(${h}, ${s}%, ${l}%)`;
};
