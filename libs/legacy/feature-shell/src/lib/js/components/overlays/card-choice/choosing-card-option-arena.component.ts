/* eslint-disable @typescript-eslint/no-empty-function */
import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostListener,
	Inject,
	Input,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { CardIds, ReferenceCard } from '@firestone-hs/reference-data';
import {
	ArenaCardOption,
	ArenaCardStatsService,
	ArenaClassStatsService,
	ArenaDiscoversGuardianService,
} from '@firestone/arena/common';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent, deepEqual, uuidShort } from '@firestone/shared/framework/common';
import { ADS_SERVICE_TOKEN, CardsFacadeService, IAdsService, waitForReady } from '@firestone/shared/framework/core';
import {
	BehaviorSubject,
	combineLatest,
	debounceTime,
	distinctUntilChanged,
	filter,
	from,
	Observable,
	shareReplay,
	switchMap,
	takeUntil,
} from 'rxjs';
import { CardsHighlightFacadeService } from '../../../services/decktracker/card-highlight/cards-highlight-facade.service';
import { CardChoiceOption, NO_HIGHLIGHT_CARD_IDS } from './choosing-card-widget-wrapper.component';

@Component({
	selector: 'choosing-card-option-arena',
	styleUrls: ['./choosing-card-option-arena.component.scss'],
	template: `
		<div class="option" (mouseenter)="onMouseEnter($event)" (mouseleave)="onMouseLeave($event)">
			<ng-container *ngIf="showArenaCardStatDuringDiscovers$ | async">
				<arena-card-option-view
					[card]="arenaCardStats$ | async"
					*ngIf="canSeeWidget$ | async"
				></arena-card-option-view>
				<arena-option-info-premium
					class="premium"
					*ngIf="(canSeeWidget$ | async) === false"
				></arena-option-info-premium>
			</ng-container>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChoosingCardOptionArenaComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit, OnDestroy
{
	arenaCardStats$: Observable<ArenaCardOption>;
	showArenaCardStatDuringDiscovers$: Observable<boolean | null>;
	canSeeWidget$: Observable<boolean | null>;

	@Input() set option(value: CardChoiceOption) {
		this._option = value;
		this._referenceCard = this.allCards.getCard(value?.cardId);
		this.shouldHighlight = !NO_HIGHLIGHT_CARD_IDS.includes(value?.cardId as CardIds);
		this.cardId$$.next(value?.cardId);
		this.registerHighlight();
	}

	@Input() set playerClass(value: string | null) {
		this.playerClass$$.next(value);
	}

	_option: CardChoiceOption;

	private _referenceCard: ReferenceCard;
	private side: 'player' | 'opponent' = 'player';
	private _uniqueId: string;
	private shouldHighlight: boolean;

	private cardId$$ = new BehaviorSubject<string | null>(null);
	private playerClass$$ = new BehaviorSubject<string | null>(null);

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly cardsHighlightService: CardsHighlightFacadeService,
		private readonly allCards: CardsFacadeService,
		private readonly arenaCardStats: ArenaCardStatsService,
		private readonly arenaClassStats: ArenaClassStatsService,
		private readonly prefs: PreferencesService,
		private readonly guardian: ArenaDiscoversGuardianService,
		@Inject(ADS_SERVICE_TOKEN) private readonly ads: IAdsService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.arenaCardStats, this.guardian, this.prefs);

		this.showArenaCardStatDuringDiscovers$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => prefs.arenaShowCardStatDuringDiscovers),
			debounceTime(500),
			distinctUntilChanged(),
			shareReplay(1),
			takeUntil(this.destroyed$),
		);
		this.canSeeWidget$ = combineLatest([this.ads.hasPremiumSub$$, this.guardian.freeUsesLeft$$]).pipe(
			this.mapData(([hasPremium, freeUsesLeft]) => hasPremium || freeUsesLeft > 0),
			debounceTime(500),
			distinctUntilChanged(),
			shareReplay(1),
			takeUntil(this.destroyed$),
		);
		combineLatest([this.showArenaCardStatDuringDiscovers$, this.canSeeWidget$])
			.pipe(
				filter(([show, canSee]) => show && canSee),
				distinctUntilChanged((a, b) => deepEqual(a, b)),
			)
			.subscribe(([show, canSee]) => {
				this.guardian.acknowledgeDiscoverStatsSeen();
			});
		this.arenaCardStats$ = combineLatest([this.cardId$$, this.playerClass$$]).pipe(
			filter(([cardId]) => !!cardId),
			switchMap(([cardId, playerClass]) =>
				from(this.arenaCardStats.getStatsFor(cardId, playerClass)).pipe(
					this.mapData((stat) => ({ stat, playerClass })),
					distinctUntilChanged((a, b) => deepEqual(a, b)),
				),
			),
			switchMap(async ({ stat, playerClass }) => {
				if (!stat) {
					return null;
				}
				const heroStats = await this.arenaClassStats.classStats$$.getValueWithInit();
				const heroStat = heroStats?.stats.find(
					(s) => s.playerClass?.toUpperCase() === playerClass?.toUpperCase(),
				);
				const currentHeroWinrate = !heroStat?.totalGames
					? null
					: (heroStat?.totalsWins ?? 0) / heroStat.totalGames;
				const drawnWinrate = !stat?.matchStats?.stats?.drawn
					? null
					: stat.matchStats.stats.drawnThenWin / stat.matchStats.stats.drawn;
				const drawnImpact =
					currentHeroWinrate == null || drawnWinrate == null ? null : drawnWinrate - currentHeroWinrate;
				const result: ArenaCardOption = {
					cardId: stat.cardId,
					drawnImpact: drawnImpact,
				} as ArenaCardOption;
				return result;
			}),
			this.mapData((stat) => stat),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	registerHighlight() {
		this._uniqueId && this.cardsHighlightService.unregister(this._uniqueId, this.side);
		this._uniqueId = this._uniqueId || uuidShort();
		if (this.shouldHighlight) {
			this.cardsHighlightService.register(
				this._uniqueId,
				{
					referenceCardProvider: () => this._referenceCard,
					// We don't react to highlights, only trigger them
					deckCardProvider: () => null,
					zoneProvider: () => null,
					highlightCallback: () => {},
					unhighlightCallback: () => {},
					side: () => 'player',
				},
				'player',
			);
		}
	}

	onMouseEnter(event: MouseEvent) {
		if (!this.shouldHighlight) {
			return;
		}
		this.cardsHighlightService?.onMouseEnter(this._option?.cardId, this.side, null);
	}

	onMouseLeave(event: MouseEvent) {
		if (!this.shouldHighlight) {
			return;
		}
		this.cardsHighlightService?.onMouseLeave(this._option?.cardId);
	}

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		this.cardsHighlightService?.onMouseLeave(this._option?.cardId);
		this.cardsHighlightService.unregister(this._uniqueId, this.side);
	}
}
