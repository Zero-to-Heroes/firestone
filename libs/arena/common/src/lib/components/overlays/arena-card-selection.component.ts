/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	Inject,
	ViewRef,
} from '@angular/core';
import { CardMousedOverService } from '@firestone/memory';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import {
	ADS_SERVICE_TOKEN,
	CARDS_HIGHLIGHT_SERVICE_TOKEN,
	CardsFacadeService,
	IAdsService,
	ICardsHighlightService,
	ILocalizationService,
	OverwolfService,
	waitForReady,
} from '@firestone/shared/framework/core';
import { Observable, combineLatest, distinctUntilChanged, pairwise, takeUntil, tap } from 'rxjs';
import { ArenaCardStatsService } from '../../services/arena-card-stats.service';
import { ArenaClassStatsService } from '../../services/arena-class-stats.service';
import {
	ARENA_DRAFT_MANAGER_SERVICE_TOKEN,
	IArenaDraftManagerService,
} from '../../services/arena-draft-manager.interface';
import { ArenaCardOption } from './model';

@Component({
	selector: 'arena-card-selection',
	styleUrls: ['./arena-card-selection.component.scss'],
	template: `
		<div class="root" *ngIf="showing$ | async">
			<arena-card-option
				class="option"
				*ngFor="let option of options$ | async; trackBy: trackByFn"
				[card]="option"
				[pickNumber]="(pickNumber$ | async)!"
			>
			</arena-card-option>
		</div>
		<div class="root-side" *ngIf="showingSideBanner$ | async">
			<arena-option-info-premium [extended]="true"></arena-option-info-premium>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaCardSelectionComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	showing$: Observable<boolean>;
	showingSideBanner$: Observable<boolean>;
	pickNumber$: Observable<number>;
	options$: Observable<readonly ArenaCardOption[]>;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly arenaCardStats: ArenaCardStatsService,
		private readonly i18n: ILocalizationService,
		private readonly allCards: CardsFacadeService,
		private readonly ow: OverwolfService,
		private readonly arenaClassStats: ArenaClassStatsService,
		private readonly prefs: PreferencesService,
		private readonly mouseOverService: CardMousedOverService,
		@Inject(ADS_SERVICE_TOKEN) private readonly ads: IAdsService,
		// Provided in the app
		@Inject(ARENA_DRAFT_MANAGER_SERVICE_TOKEN) private readonly draftManager: IArenaDraftManagerService,
		@Inject(CARDS_HIGHLIGHT_SERVICE_TOKEN) private readonly cardsHighlightService: ICardsHighlightService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.draftManager, this.arenaCardStats, this.arenaClassStats, this.ads, this.prefs);
		console.debug('[arena-card-selection] ready');

		const isHearthArenaRunning = await this.ow.getExtensionRunningState(`eldaohcjmecjpkpdhhoiolhhaeapcldppbdgbnbc`);
		console.log('[arena-card-selection] isHearthArenaRunning', isHearthArenaRunning);

		this.pickNumber$ = this.draftManager.currentDeck$$.pipe(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			this.mapData((deck) => deck?.DeckList?.length ?? 0),
		);
		this.showingSideBanner$ = combineLatest([
			this.ads.hasPremiumSub$$,
			this.pickNumber$,
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.arenaShowCardSelectionOverlay)),
		]).pipe(
			tap((info) =>
				console.debug('[arena-card-selection] showingSideBanner', info, isHearthArenaRunning.isRunning),
			),
			this.mapData(
				([hasPremium, pickNumber, arenaShowCardSelectionOverlay]) =>
					arenaShowCardSelectionOverlay && pickNumber >= 1 && !hasPremium && isHearthArenaRunning?.isRunning,
			),
		);
		// TODO: load the context of the current class
		// So this means storing somewhere the current draft info (including the decklist)
		// this.updateClassContext();
		const currentHero$ = this.draftManager.currentDeck$$.pipe(
			tap((deck) => console.debug('current deck', deck)),
			this.mapData((deck) => deck?.HeroCardId),
		);
		const currentHeroWinrate$ = combineLatest([currentHero$, this.arenaClassStats.classStats$$]).pipe(
			this.mapData(([currentHero, stats]) => {
				const heroStats = stats?.stats.find(
					(s) =>
						s.playerClass?.toUpperCase() ===
						this.allCards.getCard(currentHero!)?.playerClass?.toUpperCase(),
				);
				return !heroStats?.totalGames ? null : (heroStats?.totalsWins ?? 0) / heroStats.totalGames;
			}),
			distinctUntilChanged(),
			takeUntil(this.destroyed$),
		);
		this.options$ = combineLatest([
			this.draftManager.cardOptions$$,
			this.arenaCardStats.cardStats$$,
			currentHeroWinrate$,
		]).pipe(
			this.mapData(
				([options, stats, currentHeroWinrate]) =>
					options?.map((option) => {
						const stat = stats?.stats?.find((s) => s.cardId === option);
						const drawnWinrate = !stat?.matchStats?.stats?.drawn
							? null
							: stat.matchStats.stats.drawnThenWin / stat.matchStats.stats.drawn;
						const pickRate = !stat?.draftStats?.pickRate ? null : stat.draftStats.pickRate;
						const pickRateDelta = !stat?.draftStats?.pickRateImpact ? null : stat.draftStats.pickRateImpact;
						const pickRateHighWins = !stat?.draftStats?.pickRateHighWins
							? null
							: stat.draftStats.pickRateHighWins;
						const drawnImpact =
							currentHeroWinrate == null || drawnWinrate == null
								? null
								: drawnWinrate - currentHeroWinrate;
						const deckWinrate = !stat?.matchStats?.stats?.decksWithCard
							? null
							: stat.matchStats.stats.decksWithCardThenWin / stat.matchStats.stats.decksWithCard;
						const deckImpact =
							currentHeroWinrate == null || deckWinrate == null ? null : deckWinrate - currentHeroWinrate;
						console.debug('drawnImpact', drawnImpact, currentHeroWinrate, drawnWinrate);
						const result: ArenaCardOption = {
							cardId: option,
							drawnWinrate: drawnWinrate,
							drawnImpact: drawnImpact,
							deckWinrate: deckWinrate,
							deckImpact: deckImpact,
							pickRate: pickRate,
							pickRateDelta: pickRateDelta,
							pickRateHighWins: pickRateHighWins,
						};
						return result;
					}) ?? [],
			),
		);
		this.showing$ = combineLatest([this.options$, this.showingSideBanner$]).pipe(
			this.mapData(([options, showingSideBanner]) => !showingSideBanner && options.length > 0),
		);

		this.cardsHighlightService.initForSingle();

		this.mouseOverService.mousedOverCard$$
			.pipe(
				distinctUntilChanged(
					(a, b) =>
						a?.CardId == b?.CardId &&
						a?.EntityId === b?.EntityId &&
						a?.Zone === b?.Zone &&
						a?.Side === b?.Side,
				),
				pairwise(),
				takeUntil(this.destroyed$),
			)
			.subscribe(([previousMouseOverCard, mousedOverCard]) => {
				// We use cardId instead of entityId so that it still works when we have multiple cards in hand (since only one entity
				// id is assigned)
				if (mousedOverCard?.CardId) {
					this.onMouseEnter(mousedOverCard?.CardId);
				} else if (previousMouseOverCard?.CardId) {
					this.onMouseLeave(previousMouseOverCard.CardId);
					// this.forceMouseOver$$.next(false);
				}
			});

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	onMouseEnter(cardId: string) {
		console.debug('mouseenter', cardId);
		this.cardsHighlightService.onMouseEnter(cardId, 'single');
	}

	onMouseLeave(cardId: string) {
		this.cardsHighlightService.onMouseLeave(cardId);
	}

	trackByFn(index: number, item: ArenaCardOption) {
		return index;
	}
}
