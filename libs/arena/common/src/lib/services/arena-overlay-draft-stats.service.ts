import { Injectable } from '@angular/core';
import { GameType, ReferenceCard } from '@firestone-hs/reference-data';
import { PatchesConfigService } from '@firestone/shared/common/service';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { CardsFacadeService, waitForReady } from '@firestone/shared/framework/core';
import { combineLatest, distinctUntilChanged, filter, map, shareReplay, switchMap } from 'rxjs';
import { ArenaCardOption } from '../components/overlays/model';
import { ArenaCombinedCardStat } from '../models/arena-combined-card-stat';
import { ArenaCardStatsService } from './arena-card-stats.service';
import { ArenaClassStatsService } from './arena-class-stats.service';
import { ArenaDraftManagerService } from './arena-draft-manager.service';

@Injectable({ providedIn: 'root' })
export class ArenaOverlayDraftStatsService {
	optionDraftStats$$: SubscriberAwareBehaviorSubject<readonly ArenaCardOption[] | null>;

	constructor(
		private readonly draftManager: ArenaDraftManagerService,
		private readonly allCards: CardsFacadeService,
		private readonly arenaCardStats: ArenaCardStatsService,
		private readonly arenaClassStats: ArenaClassStatsService,
		private readonly patches: PatchesConfigService,
	) {
		this.init();
	}

	private async init() {
		this.optionDraftStats$$ = new SubscriberAwareBehaviorSubject<readonly ArenaCardOption[] | null>(null);

		await waitForReady(this.draftManager, this.patches, this.arenaCardStats, this.arenaClassStats);

		// Only show stats for Underground, as it's the most relevant ones
		const gameMode$ = this.draftManager.currentMode$$.pipe(map((mode) => GameType.GT_UNDERGROUND_ARENA));
		const currentHero$ = this.draftManager.currentDeck$$.pipe(map((deck) => deck?.HeroCardId));
		const timeFrame$ = this.patches.currentArenaMetaPatch$$.pipe(
			filter((patch) => !!patch),
			map((patch) => {
				const isPatchTooRecent = new Date(patch.date).getTime() > Date.now() - 3 * 24 * 60 * 60 * 1000;
				return isPatchTooRecent ? 'past-3' : 'last-patch';
			}),
		);
		const classStats$ = combineLatest([gameMode$, timeFrame$]).pipe(
			switchMap(([gameMode, timeFrame]) =>
				this.arenaClassStats.buildClassStats(
					timeFrame,
					// gameMode === GameType.GT_ARENA ? 'arena' : 'arena-underground',
					'arena-underground',
				),
			),
		);
		const currentHeroWinrate$ = combineLatest([currentHero$, classStats$]).pipe(
			map(([currentHero, stats]) => {
				const heroStats = stats?.stats.find(
					(s) =>
						s.playerClass?.toUpperCase() ===
						this.allCards.getCard(currentHero!)?.playerClass?.toUpperCase(),
				);
				return !heroStats?.totalGames ? null : (heroStats?.totalsWins ?? 0) / heroStats.totalGames;
			}),
			distinctUntilChanged(),
		);
		const cardStats$ = combineLatest([currentHero$, gameMode$, timeFrame$]).pipe(
			switchMap(([currentHero, gameMode, timeFrame]) =>
				this.arenaCardStats.buildCardStats(
					currentHero ? this.allCards.getCard(currentHero)?.playerClass?.toLowerCase() : 'global',
					timeFrame,
					// gameMode === GameType.GT_ARENA ? 'arena' : 'arena-underground',
					'arena-underground',
				),
			),
		);
		const options$ = combineLatest([this.draftManager.cardOptions$$, cardStats$, currentHeroWinrate$]).pipe(
			filter(([options, stats, currentHeroWinrate]) => !!options?.length && !!stats && !!currentHeroWinrate),
			map(
				([options, stats, currentHeroWinrate]) =>
					options?.flatMap((option) => {
						const result: ArenaCardOption[] = [];
						const stat = stats?.stats?.find(
							(s) => this.allCards.getRootCardId(s.cardId) === this.allCards.getRootCardId(option.CardId),
						);
						const cardStat = this.buildOptionDraftStat(
							this.allCards.getCard(option.CardId)!,
							stat!,
							currentHeroWinrate!,
						);
						result.push(cardStat);
						if (option.PackageCardIds?.length) {
							for (const packageCardId of option.PackageCardIds) {
								const packageCard = this.allCards.getCard(packageCardId);
								const packageCardStat = stats?.stats?.find(
									(s) =>
										this.allCards.getRootCardId(s.cardId) ===
										this.allCards.getRootCardId(packageCardId),
								);
								const packageCardResult = this.buildOptionDraftStat(
									packageCard,
									packageCardStat!,
									currentHeroWinrate!,
								);
								packageCardResult.isPackageCard = true;
								result.push(packageCardResult);
							}
						}
						return result;
					}) ?? [],
			),
			shareReplay(1),
		);

		this.optionDraftStats$$.onFirstSubscribe(async () => {
			options$.subscribe((options) => {
				this.optionDraftStats$$.next(options);
				console.log('[arena-overlay-draft-stats] options', options);
			});
		});
	}

	private buildOptionDraftStat(
		option: ReferenceCard,
		stat: ArenaCombinedCardStat,
		currentHeroWinrate: number,
	): ArenaCardOption {
		const drawnWinrate = !stat?.matchStats?.stats?.drawn
			? null
			: stat.matchStats.stats.drawnThenWin / stat.matchStats.stats.drawn;
		const pickRate = !stat?.draftStats?.pickRate ? null : stat.draftStats.pickRate;
		const pickRateDelta = !stat?.draftStats?.pickRateImpact ? null : stat.draftStats.pickRateImpact;
		const pickRateHighWins = !stat?.draftStats?.pickRateHighWins ? null : stat.draftStats.pickRateHighWins;
		const drawnImpact =
			currentHeroWinrate == null || drawnWinrate == null ? null : drawnWinrate - currentHeroWinrate;
		const deckWinrate = !stat?.matchStats?.stats?.decksWithCard
			? null
			: stat.matchStats.stats.decksWithCardThenWin / stat.matchStats.stats.decksWithCard;
		const deckImpact = currentHeroWinrate == null || deckWinrate == null ? null : deckWinrate - currentHeroWinrate;
		const result: ArenaCardOption = {
			cardId: option.id,
			drawnWinrate: drawnWinrate,
			drawnImpact: drawnImpact,
			deckWinrate: deckWinrate,
			deckImpact: deckImpact,
			pickRate: pickRate,
			pickRateDelta: pickRateDelta,
			pickRateHighWins: pickRateHighWins,
			dataPoints: stat?.matchStats?.stats?.inStartingDeck ?? null,
		};
		return result;
	}
}
