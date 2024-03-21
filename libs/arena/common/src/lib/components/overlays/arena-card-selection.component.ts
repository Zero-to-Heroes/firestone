/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	Inject,
	ViewRef,
} from '@angular/core';
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
} from '@firestone/shared/framework/core';
import { Observable, combineLatest, distinctUntilChanged, takeUntil, tap } from 'rxjs';
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
				(mouseenter)="onMouseEnter(option.cardId)"
				(mouseleave)="onMouseLeave(option.cardId, $event)"
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
		private readonly prefs: PreferencesService,
		private readonly ow: OverwolfService,
		private readonly arenaClassStats: ArenaClassStatsService,
		@Inject(ADS_SERVICE_TOKEN) private readonly ads: IAdsService,
		// Provided in the app
		@Inject(ARENA_DRAFT_MANAGER_SERVICE_TOKEN) private readonly draftManager: IArenaDraftManagerService,
		@Inject(CARDS_HIGHLIGHT_SERVICE_TOKEN) private readonly cardsHighlightService: ICardsHighlightService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await this.draftManager.isReady();
		await this.arenaCardStats.isReady();
		await this.arenaClassStats.isReady();
		await this.prefs.isReady();
		await this.ads.isReady();
		console.debug('[arena-card-selection] ready');

		const isHearthArenaRunning = await this.ow.getExtensionRunningState(`eldaohcjmecjpkpdhhoiolhhaeapcldppbdgbnbc`);
		console.log('[arena-card-selection] isHearthArenaRunning', isHearthArenaRunning);

		this.pickNumber$ = this.draftManager.currentDeck$$.pipe(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			this.mapData((deck) => deck?.DeckList?.length ?? 0),
		);
		this.showingSideBanner$ = combineLatest([this.ads.hasPremiumSub$$, this.pickNumber$]).pipe(
			tap((info) =>
				console.debug('[arena-card-selection] showingSideBanner', info, isHearthArenaRunning.isRunning),
			),
			this.mapData(
				([hasPremium, pickNumber]) => pickNumber >= 1 && !hasPremium && isHearthArenaRunning?.isRunning,
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
						const drawnWinrate = !stat?.matchStats?.drawn
							? null
							: stat.matchStats.drawnThenWin / stat.matchStats.drawn;
						const pickRate = !stat?.draftStats?.pickRate ? null : stat.draftStats.pickRate;
						const pickRateDelta = !stat?.draftStats?.pickRateImpact ? null : stat.draftStats.pickRateImpact;
						const pickRateHighWins = !stat?.draftStats?.pickRateHighWins
							? null
							: stat.draftStats.pickRateHighWins;
						const drawnImpact =
							currentHeroWinrate == null || drawnWinrate == null
								? null
								: drawnWinrate - currentHeroWinrate;
						const deckWinrate = !stat?.matchStats?.decksWithCard
							? null
							: stat.matchStats.decksWithCardThenWin / stat.matchStats.decksWithCard;
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

		this.cardsHighlightService.initForDuels();

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	onMouseEnter(cardId: string) {
		console.debug('mouseenter', cardId);
		this.cardsHighlightService.onMouseEnter(cardId, 'duels');
	}

	onMouseLeave(cardId: string, event: MouseEvent) {
		this.cardsHighlightService.onMouseLeave(cardId);
	}

	trackByFn(index: number, item: ArenaCardOption) {
		return index;
	}
}
