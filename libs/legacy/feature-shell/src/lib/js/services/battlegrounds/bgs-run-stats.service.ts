import { EventEmitter, Injectable } from '@angular/core';
import { BgsPostMatchStats as IBgsPostMatchStats } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { normalizeHeroCardId } from '@firestone-hs/reference-data';
import { BgsBestStat, Input as BgsComputeRunStatsInput, buildNewStats } from '@firestone-hs/user-bgs-post-match-stats';
import {
	BgsGame,
	BgsPostMatchStats,
	BgsPostMatchStatsForReview,
	RealTimeStatsState,
} from '@firestone/battlegrounds/core';
import { ApiRunner, CardsFacadeService, OverwolfService, UserService } from '@firestone/shared/framework/core';
import { GameForUpload } from '@firestone/stats/common';
import { Events } from '../events.service';
import { BgsPersonalStatsSelectHeroDetailsWithRemoteInfoEvent } from '../mainwindow/store/events/battlegrounds/bgs-personal-stats-select-hero-details-with-remote-info-event';
import { BgsPostMatchStatsComputedEvent } from '../mainwindow/store/events/battlegrounds/bgs-post-match-stats-computed-event';
import { MainWindowStoreEvent } from '../mainwindow/store/events/main-window-store-event';
import { ShowMatchStatsEvent } from '../mainwindow/store/events/replays/show-match-stats-event';
import { GameStatsProviderService } from '../stats/game/game-stats-provider.service';
import { sleep } from '../utils';
import { BattlegroundsStoreEvent } from './store/events/_battlegrounds-store-event';
import { BgsGameEndEvent } from './store/events/bgs-game-end-event';

@Injectable()
export class BgsRunStatsService {
	private bgsStateUpdater: EventEmitter<BattlegroundsStoreEvent>;
	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly apiRunner: ApiRunner,
		private readonly events: Events,
		private readonly ow: OverwolfService,
		private readonly userService: UserService,
		private readonly games: GameStatsProviderService,
		private readonly allCards: CardsFacadeService,
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
		setTimeout(() => {
			this.bgsStateUpdater = this.ow.getMainWindow().battlegroundsUpdater;
			this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
		});
	}

	public async retrieveReviewPostMatchStats(reviewId: string): Promise<void> {
		const resultFromS3 = await this.apiRunner.callGetApi<IBgsPostMatchStats>(
			`https://bgs-post-match-stats.firestoneapp.com/${reviewId}.gz.json`,
		);
		console.debug('[bgs-run-stats] post-match results for review', reviewId, resultFromS3);
		if (!!resultFromS3) {
			this.stateUpdater.next(new ShowMatchStatsEvent(reviewId, resultFromS3));
			return;
		}
	}

	private async computeHeroDetailsForBg(heroCardId: string) {
		const lastHeroPostMatchStats = await this.retrieveLastBgsRunStats(heroCardId);
		this.stateUpdater.next(
			new BgsPersonalStatsSelectHeroDetailsWithRemoteInfoEvent(lastHeroPostMatchStats, heroCardId),
		);
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
		const results: readonly BgsPostMatchStatsForReview[] = reviewIds.map((reviewId, index) => {
			const stat: BgsPostMatchStatsForReview = {
				reviewId: reviewId,
				stats: resultsFromS3[index],
			};
			return stat;
		});
		return results;
	}

	private async retrieveReviewIds(heroCardId: string, numberOfStats?: number): Promise<readonly string[]> {
		const allGames = await this.games.gameStats$$.getValueWithInit();
		const gamesForHero = allGames.filter(
			(game) =>
				normalizeHeroCardId(game.playerCardId, this.allCards) ===
				normalizeHeroCardId(heroCardId, this.allCards),
		);
		return gamesForHero.slice(0, numberOfStats).map((s) => s.reviewId);
	}

	public buildInput(
		reviewId: string,
		game: GameForUpload,
		currentGame: BgsGame,
		userId: string,
		userName: string,
	): BgsComputeRunStatsInput {
		const newMmr = parseInt(game.newPlayerRank);
		const input: BgsComputeRunStatsInput = {
			reviewId: reviewId,
			heroCardId: currentGame.getMainPlayer()?.cardId,
			userId: userId,
			userName: userName,
			battleResultHistory: currentGame.buildBattleResultHistory().map((history) => ({
				...history,
				simulationResult: { ...history.simulationResult, outcomeSamples: undefined },
			})),
			mainPlayer: currentGame.getMainPlayer(),
			faceOffs: currentGame.faceOffs.map((faceOff) => ({
				damage: faceOff.damage,
				opponentCardId: faceOff.opponentCardId,
				opponentPlayerId: faceOff.opponentPlayerId,
				playerCardId: faceOff.playerCardId,
				result: faceOff.result,
				turn: faceOff.turn,
			})),
			oldMmr: currentGame.mmrAtStart,
			newMmr: isNaN(newMmr) ? null : newMmr,
		};
		return input;
	}

	private async computeRunStats(
		reviewId: string,
		currentGame: BgsGame,
		bestBgsUserStats: readonly BgsBestStat[],
		game: GameForUpload,
	) {
		const liveStats = currentGame.liveStats;
		const user = await this.userService.getCurrentUser();
		const input = this.buildInput(reviewId, game, currentGame, user.userId, user.username);

		const [postMatchStats, newBestValues] = this.populateObject(
			liveStats,
			input,
			bestBgsUserStats || [],
			currentGame.getMainPlayer(true)?.playerId,
		);
		console.debug('[bgs-run-stats] newBestVaues');

		// Even if stats are computed locally, we still do it on the server so that we can
		// archive the data. However, this is non-blocking
		this.bgsStateUpdater.next(new BgsGameEndEvent(postMatchStats, newBestValues, reviewId));
		// Wait a bit, to be sure that the stats have been created
		await sleep(1000);
		this.stateUpdater.next(new BgsPostMatchStatsComputedEvent(reviewId, postMatchStats, newBestValues));
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
