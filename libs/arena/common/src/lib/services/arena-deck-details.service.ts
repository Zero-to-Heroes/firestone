/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Injectable } from '@angular/core';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import {
	AbstractFacadeService,
	AppInjector,
	waitForReady,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { distinctUntilChanged, filter, switchMap } from 'rxjs';
import { ArenaDeckDetails, ArenaDeckOverview } from '../models/arena-deck-details';
import { ArenaRun } from '../models/arena-run';
import { ArenaDraftManagerService } from './arena-draft-manager.service';
import { ArenaNavigationService } from './arena-navigation.service';
import { ArenaRunsService } from './arena-runs.service';

@Injectable()
export class ArenDeckDetailsService extends AbstractFacadeService<ArenDeckDetailsService> {
	// null = no data, undefined = loading
	public deckDetails$$: SubscriberAwareBehaviorSubject<ArenaDeckDetails | null | undefined>;

	private nav: ArenaNavigationService;
	private draftManager: ArenaDraftManagerService;
	private arenaRuns: ArenaRunsService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'ArenDeckDetailsService', () => !!this.deckDetails$$);
	}

	protected override assignSubjects() {
		this.deckDetails$$ = this.mainInstance.deckDetails$$;
	}

	protected async init() {
		this.deckDetails$$ = new SubscriberAwareBehaviorSubject<ArenaDeckDetails | null | undefined>(null);
		this.nav = AppInjector.get(ArenaNavigationService);
		this.arenaRuns = AppInjector.get(ArenaRunsService);
		this.draftManager = AppInjector.get(ArenaDraftManagerService);

		await waitForReady(this.draftManager);

		this.deckDetails$$.onFirstSubscribe(() => {
			const run$ = this.nav.selectedPersonalRunId$$.pipe(
				filter((runId) => !!runId),
				distinctUntilChanged(),
				switchMap((runId) => this.arenaRuns.getArenaRun$(runId!)),
			);

			run$.subscribe(async (run) => {
				console.debug('[arena-deck-details] received run', run);
				if (!run) {
					this.deckDetails$$.next(null);
					console.warn('[arena-deck-details] received empty run');
					return;
				}

				const overview = this.buildOverview(run);
				this.deckDetails$$.next({
					deckstring: run.initialDeckList,
					runId: run.id,
					overview: overview,
				} as ArenaDeckDetails);

				const pickInfo = await this.draftManager.getPicksForRun(run.id);
				if (!pickInfo) {
					this.deckDetails$$.next(null);
					console.warn('[arena-deck-details] no valid picks', pickInfo);
					return;
				}
				console.debug('[arena-deck-details] received picks', pickInfo);
				const deckDetails: ArenaDeckDetails = {
					deckstring: run.initialDeckList,
					runId: run.id,
					picks: pickInfo,
					overview: overview,
				};
				this.deckDetails$$.next(deckDetails);
			});
		});
	}

	private buildOverview(run: ArenaRun): ArenaDeckOverview {
		const result: ArenaDeckOverview = {
			wins: run.wins,
			losses: run.losses,
			playerCardId: run.heroCardId,
			playerClassImage: run.heroCardId
				? `https://static.zerotoheroes.com/hearthstone/cardart/256x/${run.heroCardId}.jpg`
				: null,
			rewards: run.rewards,
			steps: run.steps,
			draftStat: run.draftStat,
		};
		return result;
	}
}
