import { Inject, Injectable, Optional } from '@angular/core';
import { BgsPostMatchStats as IBgsPostMatchStats } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { normalizeHeroCardId } from '@firestone-hs/reference-data';
import { BgsBestStat, Input as BgsComputeRunStatsInput, buildNewStats } from '@firestone-hs/user-bgs-post-match-stats';
import { BgsGame, BgsPostMatchStats, BgsPostMatchStatsForReview, RealTimeStatsState } from '@firestone/game-state';
import { Events } from '@firestone/shared/common/service';
import { sleep } from '@firestone/shared/framework/common';
import { ApiRunner, CardsFacadeService, UserService } from '@firestone/shared/framework/core';
import { GameForUpload, GameStatsProviderService } from '@firestone/stats/services';
import { buildBgsRunStatsInput } from './bgs-run-stats-input-builder';
import { BGS_RUN_STATS_EVENT_HANDLER, IBgsRunStatsEventHandler } from './bgs-run-stats-event-handler.interface';

@Injectable()
export class BgsRunStatsService {
	constructor(
		private readonly apiRunner: ApiRunner,
		private readonly events: Events,
		private readonly userService: UserService,
		private readonly games: GameStatsProviderService,
		private readonly allCards: CardsFacadeService,
		@Optional() @Inject(BGS_RUN_STATS_EVENT_HANDLER) private readonly eventHandler?: IBgsRunStatsEventHandler,
	) {
		this.events.on(Events.START_BGS_RUN_STATS).subscribe(async (event) => {
			console.debug(
				'[bgs-run-stats] starting run stats',
				event.data[0],
				event.data[1],
				event.data[2],
				event.data[3],
			);
			this.computeRunStats(event.data[0], event.data[1], event.data[2], event.data[3]);
		});
		this.events.on(Events.POPULATE_HERO_DETAILS_FOR_BG).subscribe(async (event) => {
			this.computeHeroDetailsForBg(event.data[0]);
		});
	}

	public async retrieveReviewPostMatchStats(reviewId: string): Promise<void> {
		const resultFromS3 = await this.apiRunner.callGetApi<IBgsPostMatchStats>(
			`https://bgs-post-match-stats.firestoneapp.com/${reviewId}.gz.json`,
		);
		console.debug('[bgs-run-stats] post-match results for review', reviewId, resultFromS3);
		if (!!resultFromS3) {
			this.eventHandler?.onShowMatchStats(reviewId, resultFromS3);
			return;
		}
	}

	private async computeHeroDetailsForBg(heroCardId: string) {
		const lastHeroPostMatchStats = await this.retrieveLastBgsRunStats(heroCardId);
		this.eventHandler?.onHeroDetails(lastHeroPostMatchStats, heroCardId);
	}

	private async retrieveLastBgsRunStats(
		heroCardId: string,
		numberOfStats?: number,
	): Promise<readonly BgsPostMatchStatsForReview[]> {
		const reviewIds: readonly string[] = await this.retrieveReviewIds(heroCardId, numberOfStats);
		const resultsFromS3 = await Promise.all(
			reviewIds.map((reviewId) =>
				this.apiRunner.callGetApi<IBgsPostMatchStats>(
					`https://bgs-post-match-stats.firestoneapp.com/${reviewId}.gz.json`,
				),
			),
		);
		const results: readonly BgsPostMatchStatsForReview[] = reviewIds
			.map((reviewId, index) => {
				const stats = resultsFromS3[index];
				if (!stats) return null;
				return { reviewId, stats } as BgsPostMatchStatsForReview;
			})
			.filter((r): r is BgsPostMatchStatsForReview => r != null);
		return results;
	}

	private async retrieveReviewIds(heroCardId: string, numberOfStats?: number): Promise<readonly string[]> {
		const allGames = await this.games.gameStats$$.getValueWithInit();
		if (!allGames) return [];
		const gamesForHero = allGames.filter(
			(game) =>
				normalizeHeroCardId(game.playerCardId, this.allCards) ===
				normalizeHeroCardId(heroCardId, this.allCards),
		);
		return gamesForHero.slice(0, numberOfStats).map((s) => s.reviewId);
	}

	private async computeRunStats(
		reviewId: string,
		currentGame: BgsGame,
		bestBgsUserStats: readonly BgsBestStat[],
		game: GameForUpload,
	) {
		const liveStats = currentGame.liveStats;
		const user = await this.userService.getCurrentUser();
		if (!user) {
			return;
		}
		const input = buildBgsRunStatsInput(
			reviewId,
			game,
			currentGame,
			user.userId ?? '',
			user.username,
		);

		const mainPlayerId = currentGame.getMainPlayer(true)?.playerId ?? -1;
		const [postMatchStats, newBestValues] = this.populateObject(
			liveStats,
			input,
			bestBgsUserStats || [],
			mainPlayerId,
		);
		console.debug('[bgs-run-stats] newBestVaues');
		await sleep(1000);
		this.eventHandler?.onPostMatchStatsComputed(reviewId, postMatchStats, newBestValues);
	}

	private populateObject(
		realTimeStatsState: RealTimeStatsState,
		input: BgsComputeRunStatsInput,
		existingBestStats: readonly BgsBestStat[],
		mainPlayerId: number,
	): [BgsPostMatchStats, readonly BgsBestStat[]] {
		const result: BgsPostMatchStats = BgsPostMatchStats.create({
			...realTimeStatsState,
			boardHistory: !!realTimeStatsState?.boardHistory?.length
				? realTimeStatsState?.boardHistory
				: input.mainPlayer?.boardHistory?.length
					? input.mainPlayer?.boardHistory
					: [],
			tripleTimings:
				input.mainPlayer && realTimeStatsState?.triplesPerHero[mainPlayerId]
					? new Array(realTimeStatsState.triplesPerHero[mainPlayerId])
					: [],
			playerIdToCardIdMapping: realTimeStatsState.playerIdToCardIdMapping,
			battleResultHistory: realTimeStatsState.battleResultHistory?.map((history) => ({
				...history,
				simulationResult: { ...history.simulationResult, outcomeSamples: undefined },
			})),
		});
		const newBestStats = buildNewStats(
			existingBestStats,
			result,
			{
				mainPlayer: input.mainPlayer,
				reviewId: input.reviewId,
				userId: input.userName || input.userId,
			} as any as BgsComputeRunStatsInput,
			`${new Date().toISOString().slice(0, 19).replace('T', ' ')}.${new Date().getMilliseconds()}`,
		);
		const finalStats = this.mergeStats(existingBestStats, newBestStats);

		return [result, finalStats];
	}

	private mergeStats(existingBestStats: readonly BgsBestStat[], newBestStats: readonly BgsBestStat[]) {
		const statsToKeep = existingBestStats.filter((existing) => !this.isStatIncluded(existing, newBestStats));
		return [...newBestStats, ...statsToKeep];
	}

	private isStatIncluded(toFind: BgsBestStat, list: readonly BgsBestStat[]) {
		return list.find((existing) => existing.statName === toFind.statName) != null;
	}
}
