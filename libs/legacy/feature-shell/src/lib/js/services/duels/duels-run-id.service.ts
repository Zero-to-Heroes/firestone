import { Injectable } from '@angular/core';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameStat } from '@firestone/stats/data-access';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { distinctUntilChanged, filter, map, startWith, tap } from 'rxjs/operators';
import { DuelsRun } from '../../models/duels/duels-run';
import { DuelsInfo } from '../../models/memory/memory-duels';
import { DuelsStateBuilderService } from '../duels/duels-state-builder.service';
import { isDuels, isSignatureTreasure } from '../duels/duels-utils';
import { AppUiStoreFacadeService } from '../ui-store/app-ui-store-facade.service';
import { uuid } from '../utils';

@Injectable()
export class DuelsRunIdService {
	public duelsRunId$ = new BehaviorSubject<string>(null);
	public lastDuelsGame$ = new BehaviorSubject<GameStat>(null);

	constructor(
		private readonly allCards: CardsFacadeService,
		private readonly duelsState: DuelsStateBuilderService,
		private readonly store: AppUiStoreFacadeService,
	) {
		this.initDuelsRunIdObservable();
	}

	private async initDuelsRunIdObservable() {
		await this.store.initComplete();

		this.store
			.gameStats$()
			.pipe(
				filter((stats) => !!stats?.length),
				map((stats) => stats?.filter((s) => isDuels(s.gameMode)) ?? []),
				map((stats) => stats[0]),
				filter((latestDuelsMatch) => !!latestDuelsMatch),
				distinctUntilChanged(),
				startWith(null),
			)
			.subscribe(this.lastDuelsGame$);
		const currentRun$ = combineLatest([this.lastDuelsGame$, this.store.duelsRuns$()]).pipe(
			map(([lastDuelsGame, runs]) => {
				const info = lastDuelsGame?.reviewId
					? runs?.find((run) => run.steps.some((s) => (s as GameStat).reviewId === lastDuelsGame?.reviewId))
					: null;
				console.debug(
					'[duels-run] currentRun',
					lastDuelsGame?.reviewId,
					info?.id,
					info?.heroCardId,
					info?.heroPowerCardId,
					info?.wins,
					info?.losses,
				);
				return info;
			}),
			// After the first game, a run is always created
			filter((run) => !!run),
			startWith(null),
		);
		const duelsInfo$ = this.duelsState.duelsInfo$$.asObservable().pipe(
			filter((info) => !!info),
			// Only things that are caracteristic of a new run are of interest here
			// We ignore the decklist because it evolves during a single run
			distinctUntilChanged((a, b) => {
				return (
					a.HeroCardId === b.HeroCardId &&
					a.Rating === b.Rating &&
					a.PaidRating === b.PaidRating &&
					a.Wins === b.Wins &&
					a.Losses === b.Losses &&
					a.StartingHeroPower === b.StartingHeroPower &&
					a.StartingHeroPowerCardId === b.StartingHeroPowerCardId &&
					a.PlayerClass === b.PlayerClass
				);
			}),
		);

		combineLatest(duelsInfo$, currentRun$, this.lastDuelsGame$)
			.pipe(
				filter(([duelsInfo, currentRun, latestDuelsMatch]) => !!duelsInfo),
				map(([duelsInfo, currentRun, latestDuelsMatch]) => {
					console.debug('[duels-run] defining new run id?', duelsInfo, currentRun, latestDuelsMatch);
					if (!latestDuelsMatch) {
						console.log('[duels-run] no last duels match, assigning new run ID');
						return uuid();
					}
					if (isNewRun(duelsInfo, currentRun, latestDuelsMatch, this.allCards)) {
						console.log('[duels-run] new run');
						console.debug('[duels-run] new run', duelsInfo, currentRun, latestDuelsMatch);
						return uuid();
					}
					if (!isMatchInRun(latestDuelsMatch.additionalResult, latestDuelsMatch.result)) {
						return uuid();
					}

					console.log('[duels-run] default keeping the old run');
					console.debug('[duels-run] default keeping the old run', duelsInfo, currentRun, latestDuelsMatch);
					return latestDuelsMatch.runId;
				}),
				startWith(uuid()),
				distinctUntilChanged(),
				tap((info) => console.debug('[duels-run] emitting runId', info)),
			)
			.subscribe(this.duelsRunId$);
	}
}

const isNewRun = (
	duelsInfo: DuelsInfo,
	currentRun: DuelsRun,
	lastDuelsMatch: GameStat,
	allCards: CardsFacadeService,
): boolean => {
	if (!duelsInfo || !lastDuelsMatch || !currentRun) {
		return true;
	}

	const [currentDuelsWins, currentDuelsLosses] = lastDuelsMatch.additionalResult
		?.split('-')
		.map((info) => parseInt(info)) ?? [0, 0];
	if (duelsInfo?.Wins === 0 && duelsInfo?.Losses === 0) {
		// In case of ties for the first match, we don't want to start a new run
		if (lastDuelsMatch?.result === 'tied' && currentDuelsWins === 0 && currentDuelsLosses === 0) {
			console.log('[duels-run] had a tie on the first round, not starting a new run');
		} else {
			console.log('[duels-run] wins and losses are 0, starting new run', duelsInfo);
			return true;
		}
	}

	if (
		(currentDuelsWins != null && duelsInfo.Wins < currentDuelsWins) ||
		(currentDuelsLosses != null && duelsInfo.Losses < currentDuelsLosses)
	) {
		console.log(
			'[duels-run] wins or losses less than previous info, starting new run',
			duelsInfo,
			currentDuelsWins,
			currentDuelsLosses,
		);
		return true;
	}

	if (lastDuelsMatch?.additionalResult) {
		const [wins, losses] = lastDuelsMatch.additionalResult.split('-').map((info) => parseInt(info));
		if (duelsInfo.Wins < wins || duelsInfo.Losses < losses) {
			console.log(
				'[duels-run] wins or losses less than previous info, starting new run',
				duelsInfo,
				lastDuelsMatch.additionalResult,
				lastDuelsMatch,
			);
			return true;
		}
	}

	if (
		currentRun.heroPowerCardId &&
		allCards.getCard(currentRun.heroPowerCardId).dbfId !== duelsInfo.StartingHeroPower
	) {
		console.log('[duels-run] different hero power, starting new run', duelsInfo, currentRun.heroPowerCardId);
		console.debug(
			'[duels-run] different hero power, starting new run',
			duelsInfo,
			currentRun.heroPowerCardId,
			currentRun,
		);
		return true;
	}
	if (duelsInfo.LastRatingChange > 0) {
		console.log('[duels-run] rating changed, starting new run', duelsInfo.LastRatingChange);
		return true;
	}
	const signatureTreasure: string = findSignatureTreasure(duelsInfo.DeckList, allCards);
	if (currentRun.signatureTreasureCardId && signatureTreasure !== currentRun.signatureTreasureCardId) {
		console.log(
			'[duels-run] different signature treasure, starting new run',
			signatureTreasure,
			currentRun.signatureTreasureCardId,
		);
	}
};

export const findSignatureTreasure = (deckList: readonly (string | number)[], allCards: CardsFacadeService): string => {
	return deckList.map((cardId) => allCards.getCard(cardId)).find((card) => isSignatureTreasure(card?.id, allCards))
		?.id;
};

const isMatchInRun = (additionalResult: string, result: 'won' | 'lost' | 'tied'): boolean => {
	if (!additionalResult) {
		console.log('[duels-run] isLastMatchInRun', 'no additional result', additionalResult, result);
		// This can happen when quitting HS and restarting it during a match
		// Because of the Brann bug this is can happen pretty frequently
		// The solution might be to allow users to themselves decide to merge runs together
		return false;
	}

	const [wins, losses] = additionalResult.split('-').map((info) => parseInt(info));
	console.log('[duels-run] isLastMatchInRun', 'wins, losses', wins, losses);
	if (wins === 11 && result === 'won') {
		console.log(
			'[duels-run] last duels match was the last win of the run, not forwarding run id',
			additionalResult,
			result,
		);
		return false;
	}
	if (losses === 2 && result === 'lost') {
		console.log(
			'[duels-run] last duels match was the last loss of the run, not forwarding run id',
			additionalResult,
			result,
		);
		return false;
	}
	return true;
};
