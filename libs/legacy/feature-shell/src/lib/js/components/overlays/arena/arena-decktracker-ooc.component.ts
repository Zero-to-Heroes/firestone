import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	HostListener,
	OnDestroy,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { CardWithSideboard } from '@components/decktracker/overlay/deck-list-static.component';
import {
	ArenaClientStateType,
	ArenaSessionState,
	DraftMode,
	GameType,
	ReferenceCard,
} from '@firestone-hs/reference-data';
import {
	ARENA_DRAFT_CARD_HIGH_WINS_THRESHOLD,
	ARENA_DRAFT_CARD_HIGH_WINS_THRESHOLD_FALLBACK,
	ArenaCardStatsService,
	ArenaClassStatsService,
	ArenaCombinedCardStats,
	ArenaDraftManagerService,
} from '@firestone/arena/common';
import { buildColor } from '@firestone/constructed/common';
import { ArenaModeFilterType, PreferencesService } from '@firestone/shared/common/service';
import { invertDirection, SortCriteria } from '@firestone/shared/common/view';
import {
	AbstractSubscriptionComponent,
	arraysEqual,
	groupByFunction2,
	uuidShort,
} from '@firestone/shared/framework/common';
import { CardsFacadeService, ILocalizationService, waitForReady } from '@firestone/shared/framework/core';
import { CardsHighlightFacadeService } from '@services/decktracker/card-highlight/cards-highlight-facade.service';
import {
	BehaviorSubject,
	combineLatest,
	distinctUntilChanged,
	filter,
	Observable,
	shareReplay,
	switchMap,
	takeUntil,
} from 'rxjs';
import { VisualDeckCard } from '../../../models/decktracker/visual-deck-card';

@Component({
	standalone: false,
	selector: 'arena-decktracker-ooc',
	styleUrls: [
		// `../../../../css/global/scrollbar-decktracker-overlay.scss`,
		// '../../../../css/global/scrollbar-cards-list.scss',
		'../../../../css/component/decktracker/overlay/decktracker-overlay.component.scss',
		'./arena-decktracker-ooc.component.scss',
	],
	template: `
		<div class="root active" [activeTheme]="'decktracker'">
			<!-- Never remove the scalable from the DOM so that we can perform resizing even when not visible -->
			<div
				class="scalable"
				*ngIf="{
					cards: cards$ | async,
					currentOptions: currentOptions$ | async,
					colorManaCost: colorManaCost$ | async,
				} as value"
			>
				<ng-container *ngIf="value.cards || value.currentOptions">
					<div class="decktracker-container">
						<div class="decktracker" *ngIf="!!value.cards || !!value.currentOptions">
							<div class="background"></div>
							<div class="header" *ngIf="sortCriteria$ | async as sort">
								<sortable-table-label
									class="cell pick-rate"
									*ngIf="showPickRate$ | async"
									[name]="'app.arena.card-stats.header-pickrate' | fsTranslate"
									[sort]="sort"
									[criteria]="'pick-rate'"
									[helpTooltip]="headerPickrateTooltip"
									(sortClick)="onSortClick($event)"
								>
								</sortable-table-label>
								<sortable-table-label
									class="cell name"
									[name]="'decktracker.overlay.mulligan.mulligan-card' | fsTranslate"
									[sort]="sort"
									[criteria]="'card'"
									(sortClick)="onSortClick($event)"
								>
								</sortable-table-label>
								<sortable-table-label
									class="cell deck-wr"
									*ngIf="showImpact$ | async"
									[name]="'app.arena.card-stats.header-deck-winrate-impact' | fsTranslate"
									[sort]="sort"
									[criteria]="'impact'"
									[helpTooltip]="
										'app.arena.card-stats.header-deck-winrate-impact-tooltip' | fsTranslate
									"
									(sortClick)="onSortClick($event)"
								>
								</sortable-table-label>
							</div>
							<div class="played-cards">
								<div class="deck-list" scrollable>
									<li
										class="card-container"
										*ngFor="let cardInfo of value.cards ?? []; trackBy: trackByCardId"
									>
										<div
											class="cell pick-rate"
											*ngIf="showPickRate$ | async"
											[style.color]="cardInfo.pickedColor"
										>
											{{ cardInfo.pickrate | percent: '1.1' }}
										</div>
										<deck-card
											class="cell card name"
											[card]="cardInfo.card"
											[colorManaCost]="value.colorManaCost"
											[showRelatedCards]="true"
											[side]="'arena-draft'"
											[gameTypeOverride]="gameType"
										></deck-card>
										<div
											class="cell deck-wr"
											*ngIf="showImpact$ | async"
											[style.color]="cardInfo.impactColor"
										>
											{{ cardInfo.deckWinrateImpact | number: '1.2-2' }}
										</div>
									</li>

									<ng-container *ngIf="showCurrentOptions$ | async">
										<div class="current-options" *ngIf="value.currentOptions">
											<div class="header">
												<div class="cell pick-rate" *ngIf="showPickRate$ | async"></div>
												<div
													class="cell card name"
													[fsTranslate]="'app.arena.card-stats.header-current-options'"
												></div>
												<div class="cell deck-wr" *ngIf="showImpact$ | async"></div>
											</div>
											<li
												class="card-container"
												*ngFor="let cardInfo of value.currentOptions; trackBy: trackByCardId"
												[ngClass]="{ indented: cardInfo.indented }"
											>
												<div
													class="cell pick-rate"
													*ngIf="showPickRate$ | async"
													[style.color]="cardInfo.pickedColor"
												>
													{{ cardInfo.pickrate | percent: '1.1' }}
												</div>
												<deck-card
													class="cell card name"
													[card]="cardInfo.card"
													[colorManaCost]="value.colorManaCost"
													[showRelatedCards]="true"
													[side]="'arena-draft'"
													[gameTypeOverride]="gameType"
												></deck-card>
												<div
													class="cell deck-wr"
													*ngIf="showImpact$ | async"
													[style.color]="cardInfo.impactColor"
												>
													{{ cardInfo.deckWinrateImpact | number: '1.2-2' }}
												</div>
											</li>
										</div>
									</ng-container>
								</div>
							</div>
						</div>
					</div>
				</ng-container>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaDecktrackerOocComponent extends AbstractSubscriptionComponent implements AfterContentInit, OnDestroy {
	sortCriteria$: Observable<SortCriteria<ColumnSortType>>;
	cards$: Observable<readonly CardInfo[]>;
	currentOptions$: Observable<readonly CardInfo[]>;
	colorManaCost$: Observable<boolean>;
	showPickRate$: Observable<boolean>;
	showImpact$: Observable<boolean>;
	showCurrentOptions$: Observable<boolean>;

	headerPickrateTooltip = this.i18n.translateString(
		'app.arena.card-stats.header-pickrate-high-wins-variable-tooltip',
		{
			value: ARENA_DRAFT_CARD_HIGH_WINS_THRESHOLD,
			value2: ARENA_DRAFT_CARD_HIGH_WINS_THRESHOLD_FALLBACK,
		},
	);

	gameType = GameType.GT_ARENA;

	private sortCriteria$$ = new BehaviorSubject<SortCriteria<ColumnSortType>>({
		criteria: 'card',
		direction: 'asc',
	});

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly cardsHighlight: CardsHighlightFacadeService,
		private readonly allCards: CardsFacadeService,
		private readonly draftManager: ArenaDraftManagerService,
		private readonly prefs: PreferencesService,
		private readonly el: ElementRef,
		private readonly renderer: Renderer2,
		private readonly cardStats: ArenaCardStatsService,
		private readonly classStats: ArenaClassStatsService,
		private readonly i18n: ILocalizationService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.draftManager, this.prefs, this.cardStats, this.classStats);

		this.sortCriteria$ = this.sortCriteria$$.asObservable().pipe(this.mapData((sort) => sort));
		this.colorManaCost$ = this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.overlayShowRarityColors));
		const isRedraft$ = combineLatest([this.draftManager.clientStateType$$, this.draftManager.sessionState$$]).pipe(
			this.mapData(
				([mode, sessionState]) =>
					[
						// ArenaClientStateType.Normal_Redraft,
						ArenaClientStateType.Normal_DeckEdit,
						// ArenaClientStateType.Underground_Redraft,
						ArenaClientStateType.Underground_DeckEdit,
					].includes(mode) || [ArenaSessionState.EDITING_DECK].includes(sessionState),
			),
		);
		this.showPickRate$ = combineLatest([
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.arenaOocTrackerShowPickRate)),
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.arenaOocTrackerImpactOnlyOnRedraft)),
			isRedraft$,
		]).pipe(
			this.mapData(
				([showPickRate, showOnlyOnRedraft, isRedraft]) => showPickRate && (!showOnlyOnRedraft || isRedraft),
			),
			shareReplay(1),
			takeUntil(this.destroyed$),
		);
		this.showImpact$ = combineLatest([
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.arenaOocTrackerShowImpact)),
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.arenaOocTrackerImpactOnlyOnRedraft)),
			isRedraft$,
		]).pipe(
			this.mapData(
				([showPickRate, showOnlyOnRedraft, isRedraft]) => showPickRate && (!showOnlyOnRedraft || isRedraft),
			),
			shareReplay(1),
			takeUntil(this.destroyed$),
		);
		const cardsList$ = this.draftManager.currentDeck$$.pipe(
			filter((deck) => !!deck),
			distinctUntilChanged((a, b) => arraysEqual(a?.DeckList, b?.DeckList)),
			this.mapData((deck) => {
				const cardIds = deck.DeckList as readonly string[];
				const groupedByCardId = groupByFunction2(cardIds, (cardId: string) => cardId);
				const cards = Object.values(groupedByCardId).flatMap((cardIds) => {
					const refCard = this.allCards.getCard(cardIds[0]);
					const internalEntityId = uuidShort();
					const card = CardWithSideboard.create({
						cardId: refCard.id,
						cardName: refCard.name,
						refManaCost: refCard.hideStats ? null : refCard.cost,
						rarity: refCard.rarity,
						totalQuantity: cardIds.length,
						internalEntityId: internalEntityId,
						internalEntityIds: [internalEntityId],
					});
					return card;
				});
				return cards;
			}),
		);
		const currentClass$ = this.draftManager.currentDeck$$.pipe(
			this.mapData((deck) => this.allCards.getCard(deck?.HeroCardId).classes?.[0]?.toLowerCase() ?? null),
		);
		const currentMode$ = this.draftManager.currentMode$$.pipe(
			this.mapData((mode) => (mode === GameType.GT_UNDERGROUND_ARENA ? 'arena-underground' : 'arena')),
		);
		const classStats$ = currentMode$.pipe(
			switchMap((mode) => this.classStats.buildClassStats('last-patch', mode as ArenaModeFilterType)),
		);
		const classStat$ = combineLatest([currentClass$, classStats$]).pipe(
			filter(([playerClass, classStats]) => !!playerClass && !!classStats),
			this.mapData(([playerClass, classStats]) => classStats?.stats?.find((s) => s.playerClass === playerClass)),
		);
		const cardStats$ = combineLatest([currentClass$, currentMode$]).pipe(
			switchMap(([playerClass, mode]) => this.cardStats.buildCardStats(playerClass, 'last-patch', mode)),
		);
		const cardsWithStats$ = combineLatest([cardsList$, cardStats$, classStat$]).pipe(
			filter(([cards, cardStats, classStat]) => !!cards?.length && !!cardStats?.stats?.length && !!classStat),
			this.mapData(([cards, cardStats, classStat]) => {
				const cardsWithStats: CardInfo[] = [];
				const classWinrate = classStat.totalsWins / classStat.totalGames;
				for (const card of cards) {
					const stat = cardStats?.stats?.find(
						(s) => this.allCards.getRootCardId(s.cardId) === this.allCards.getRootCardId(card.cardId),
					);
					const decksWithCard = stat?.matchStats?.stats?.decksWithCard ?? 0;
					const deckWinrate = !decksWithCard
						? null
						: (stat.matchStats?.stats?.decksWithCardThenWin ?? 0) / decksWithCard;
					const deckImpact = deckWinrate == null ? null : 100 * (deckWinrate - classWinrate);
					const pickrate = stat?.draftStats?.pickRateHighWins ?? stat?.draftStats?.pickRate ?? null;
					const cardInfo: CardInfo = {
						card: card,
						deckWinrateImpact: deckImpact,
						pickrate: pickrate,
						pickedColor: buildColor('hsl(112, 100%, 64%)', 'hsl(0, 100%, 64%)', pickrate ?? 0, 0.7, 0.3),
						impactColor: buildColor('hsl(112, 100%, 64%)', 'hsl(0, 100%, 64%)', deckImpact ?? 0, 1, -1),
					};
					cardsWithStats.push(cardInfo);
				}
				return cardsWithStats;
			}),
		);

		// Add sort
		this.cards$ = combineLatest([cardsWithStats$, this.sortCriteria$$]).pipe(
			this.mapData(([cards, sort]) => {
				return cards.sort((a, b) => this.sortCards(a, b, sort));
			}),
		);

		const currentDraftMode$ = this.draftManager.currentDraftMode$$.pipe(this.mapData((mode) => mode));
		this.showCurrentOptions$ = combineLatest([
			currentDraftMode$,
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.arenaOocTrackerShowCurrentOptions)),
		]).pipe(this.mapData(([mode, showCurrentOptions]) => mode === DraftMode.DRAFTING && showCurrentOptions));

		this.currentOptions$ = combineLatest([this.draftManager.cardOptions$$, cardStats$, classStat$]).pipe(
			filter(([cards, cardStats, classStat]) => !!cards?.length && !!cardStats?.stats?.length && !!classStat),
			this.mapData(([cards, cardStats, classStat]) => {
				const cardsWithStats: CardInfo[] = [];
				const classWinrate = classStat.totalsWins / classStat.totalGames;
				for (const card of cards) {
					const refCard = this.allCards.getCard(card.CardId);
					const cardWithStat = this.buildCardWithStats(refCard, cardStats, classWinrate);
					cardsWithStats.push(cardWithStat);
					if (card.PackageCardIds?.length) {
						for (const packageCardId of card.PackageCardIds) {
							const packageCard = this.allCards.getCard(packageCardId);
							const packageCardWithStat = this.buildCardWithStats(packageCard, cardStats, classWinrate);
							packageCardWithStat.indented = true;
							cardsWithStats.push(packageCardWithStat);
						}
					}
				}
				return cardsWithStats;
			}),
		);

		combineLatest([
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.globalWidgetScale ?? 100)),
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.arenaOocTrackerScale ?? 100)),
		])
			.pipe(takeUntil(this.destroyed$))
			.subscribe(([globalScale, scale]) => {
				const newScale = (globalScale / 100) * (scale / 100);
				this.el.nativeElement.style.setProperty('--decktracker-scale', newScale);
				this.el.nativeElement.style.setProperty('--decktracker-max-height', '90vh');
				const element = this.el.nativeElement.querySelector('.scalable');
				if (!!element) {
					this.renderer.setStyle(element, 'transform', `scale(${newScale})`);
				}
			});

		this.cardsHighlight.initForSingle();
		this.draftManager.currentDeck$$.pipe(this.mapData((deck) => deck?.HeroCardId)).subscribe((heroCardId) => {
			this.cardsHighlight.forceHeroCardId(heroCardId);
			console.log('[arena-decktracker-ooc] forceHeroCardId', heroCardId);
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

	trackByCardId(index: number, card: CardInfo): string {
		return card.card.cardId;
	}

	@HostListener('window:beforeunload')
	ngOnDestroy(): void {
		super.ngOnDestroy();
	}

	private sortCards(a: CardInfo, b: CardInfo, sortCriteria: SortCriteria<ColumnSortType>): number {
		switch (sortCriteria?.criteria) {
			case 'card':
				return this.sortByCard(a, b, sortCriteria.direction);
			case 'impact':
				return this.sortByImpact(a, b, sortCriteria.direction);
			case 'pick-rate':
				return this.sortByPickRate(a, b, sortCriteria.direction);
			default:
				return 0;
		}
	}

	private sortByCard(a: CardInfo, b: CardInfo, direction: 'asc' | 'desc'): number {
		const aData = this.allCards.getCard(a.card.cardId)?.cost ?? 0;
		const bData = this.allCards.getCard(b.card.cardId)?.cost ?? 0;
		return direction === 'asc' ? aData - bData : bData - aData;
	}

	private sortByImpact(a: CardInfo, b: CardInfo, direction: 'asc' | 'desc'): number {
		const aData = a.deckWinrateImpact ?? 0;
		const bData = b.deckWinrateImpact ?? 0;
		return direction === 'asc' ? aData - bData : bData - aData;
	}

	private sortByPickRate(a: CardInfo, b: CardInfo, direction: 'asc' | 'desc'): number {
		const aData = a.pickrate ?? 0;
		const bData = b.pickrate ?? 0;
		return direction === 'asc' ? aData - bData : bData - aData;
	}

	private buildCardWithStats(
		refCard: ReferenceCard,
		cardStats: ArenaCombinedCardStats,
		classWinrate: number,
	): CardInfo {
		const internalEntityId = uuidShort();
		const deckCard = VisualDeckCard.create({
			cardId: refCard.id,
			cardName: refCard.name,
			refManaCost: refCard.cost,
			rarity: refCard.rarity,
			totalQuantity: 1,
			internalEntityId: internalEntityId,
			internalEntityIds: [internalEntityId],
		});
		const stat = cardStats?.stats?.find(
			(s) => this.allCards.getRootCardId(s.cardId) === this.allCards.getRootCardId(deckCard.cardId),
		);
		const decksWithCard = stat?.matchStats?.stats?.decksWithCard ?? 0;
		const deckWinrate = !decksWithCard ? null : (stat.matchStats?.stats?.decksWithCardThenWin ?? 0) / decksWithCard;
		const deckImpact = deckWinrate == null ? null : 100 * (deckWinrate - classWinrate);
		const pickrate = stat?.draftStats?.pickRateHighWins ?? stat?.draftStats?.pickRate ?? null;
		const cardInfo: CardInfo = {
			card: deckCard,
			deckWinrateImpact: deckImpact,
			pickrate: pickrate,
			pickedColor: buildColor('hsl(112, 100%, 64%)', 'hsl(0, 100%, 64%)', pickrate ?? 0, 0.7, 0.3),
			impactColor: buildColor('hsl(112, 100%, 64%)', 'hsl(0, 100%, 64%)', deckImpact ?? 0, 1, -1),
		};
		return cardInfo;
	}
}

interface CardInfo {
	indented?: boolean;
	readonly card: CardWithSideboard;
	readonly deckWinrateImpact: number | null;
	readonly pickrate: number | null;
	readonly pickedColor: string;
	readonly impactColor: string;
}

type ColumnSortType = 'card' | 'pick-rate' | 'impact';
