import { Injectable } from '@angular/core';
import { ArenaClassStats } from '@firestone-hs/arena-stats';
import { GameType, normalizeHeroPower, ReferenceCard } from '@firestone-hs/reference-data';
import { ArenaCardOption as MemoryArenaCardOption } from '@firestone/memory';
import { PatchesConfigService } from '@firestone/shared/common/service';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { CardsFacadeService, waitForReady } from '@firestone/shared/framework/core';
import { combineLatest, filter, map, shareReplay, switchMap } from 'rxjs';
import { ArenaCardOption } from '../models/arena-card-options';
import { ArenaCombinedCardStat, ArenaCombinedCardStats } from '../models/arena-combined-card-stat';
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
		const currentHeroPower$ = this.draftManager.currentDeck$$.pipe(
			map((deck) =>
				!!deck?.HeroPowerCardId
					? normalizeHeroPower(deck?.HeroPowerCardId, this.allCards.getService())
					: undefined,
			),
		);
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
		const cardStats$ = combineLatest([currentHero$, currentHeroPower$, gameMode$, timeFrame$]).pipe(
			switchMap(([currentHero, currentHeroPower, gameMode, timeFrame]) => {
				const isDualClass =
					currentHero &&
					currentHeroPower &&
					this.allCards.getCard(currentHero)?.playerClass?.toUpperCase() !==
						this.allCards.getCard(currentHeroPower)?.playerClass?.toUpperCase();
				console.debug('[debug] isDualClass', isDualClass, currentHero, currentHeroPower);
				const heroStats = this.arenaCardStats.buildCardStats(
					currentHero ? this.allCards.getCard(currentHero)?.playerClass?.toLowerCase() : 'global',
					timeFrame,
					'arena-underground',
				);
				console.debug('[debug] heroStats', heroStats);
				const heroPowerStats = !isDualClass
					? null
					: this.arenaCardStats.buildCardStats(
							currentHeroPower
								? this.allCards.getCard(currentHeroPower)?.playerClass?.toLowerCase()
								: 'global',
							timeFrame,
							'arena-underground',
						);
				console.debug('[debug] heroPowerStats', heroPowerStats);
				const combinedStats = !isDualClass
					? null
					: this.arenaCardStats.buildCardStats(
							`${this.allCards.getCard(currentHero)?.playerClass?.toLowerCase()}-${currentHeroPower}`,
							timeFrame,
							'arena-underground',
						);
				console.debug('[debug] combinedStats', combinedStats);
				return Promise.all([heroStats, heroPowerStats, combinedStats]);
			}),
			map(([heroStats, heroPowerStats, combinedStats]) => {
				return {
					heroStats: heroStats,
					heroPowerStats: heroPowerStats,
					combinedStats: combinedStats,
				};
			}),
		);
		const options$ = combineLatest([
			this.draftManager.cardOptions$$,
			cardStats$,
			currentHero$,
			currentHeroPower$,
			classStats$,
		]).pipe(
			filter(
				([options, stats, currentHero, currentHeroPower, classStats]) =>
					!!options?.length && !!stats && !!classStats?.stats?.length,
			),
			map(([options, stats, currentHero, currentHeroPower, classStats]) =>
				this.buildOptions(options!, stats!, currentHero, currentHeroPower, classStats!),
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

	private buildOptions(
		options: readonly MemoryArenaCardOption[],
		cardStats: {
			heroStats: ArenaCombinedCardStats | null;
			heroPowerStats: ArenaCombinedCardStats | null;
			combinedStats: ArenaCombinedCardStats | null;
		},
		currentHero: string | undefined,
		currentHeroPower: string | undefined,
		classStats: ArenaClassStats,
	): readonly ArenaCardOption[] {
		const isDualClass =
			currentHero &&
			currentHeroPower &&
			this.allCards.getCard(currentHero)?.playerClass?.toUpperCase() !==
				this.allCards.getCard(currentHeroPower)?.playerClass?.toUpperCase();
		console.debug('[debug] isDualClass', isDualClass, currentHero, currentHeroPower);
		// The exact combo
		const mainHeroStats = classStats?.stats.find(
			(s) =>
				s.playerClass?.toUpperCase() === this.allCards.getCard(currentHero!)?.playerClass?.toUpperCase() &&
				(!isDualClass
					? true
					: this.allCards.getCard(s.playerHeroPower!).playerClass?.toUpperCase() ===
						this.allCards.getCard(currentHeroPower!)?.playerClass?.toUpperCase()),
		);
		console.debug('[debug] mainHeroStats', mainHeroStats);
		const mainHeroWinrate = !mainHeroStats?.totalGames
			? null
			: (mainHeroStats?.totalsWins ?? 0) / mainHeroStats.totalGames;
		console.debug('[debug] mainHeroWinrate', mainHeroWinrate);

		return (
			options?.flatMap((option) => {
				const result: ArenaCardOption[] = [];
				const stat = cardStats?.combinedStats?.stats?.find(
					(s) => this.allCards.getRootCardId(s.cardId) === this.allCards.getRootCardId(option.CardId),
				);
				console.debug('[debug] stat', stat);
				const cardStat = this.buildOptionDraftStat(
					this.allCards.getCard(option.CardId)!,
					stat!,
					mainHeroWinrate!,
				);
				if (isDualClass) {
					cardStat.splitClasses = [];
					const classStat1 = cardStats?.heroStats?.stats?.find(
						(s) => this.allCards.getRootCardId(s.cardId) === this.allCards.getRootCardId(option.CardId),
					);
					const cardStat1 = this.buildOptionDraftStat(
						this.allCards.getCard(option.CardId)!,
						classStat1!,
						mainHeroWinrate!,
					);
					cardStat.splitClasses.push(cardStat1);
					const classStat2 = cardStats?.heroPowerStats?.stats?.find(
						(s) => this.allCards.getRootCardId(s.cardId) === this.allCards.getRootCardId(option.CardId),
					);
					const cardStat2 = this.buildOptionDraftStat(
						this.allCards.getCard(option.CardId)!,
						classStat2!,
						mainHeroWinrate!,
					);
					cardStat.splitClasses.push(cardStat2);
				}
				result.push(cardStat);
				if (option.PackageCardIds?.length) {
					for (const packageCardId of option.PackageCardIds) {
						const packageCard = this.allCards.getCard(packageCardId);
						const packageCardStat = cardStats?.combinedStats?.stats?.find(
							(s) => this.allCards.getRootCardId(s.cardId) === this.allCards.getRootCardId(packageCardId),
						);
						const packageCardResult = this.buildOptionDraftStat(
							packageCard,
							packageCardStat!,
							mainHeroWinrate!,
						);
						packageCardResult.isPackageCard = true;
						result.push(packageCardResult);
					}
				}
				return result;
			}) ?? []
		);
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
