import { Injectable } from '@angular/core';
import { Picks } from '@firestone-hs/arena-draft-pick';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { AbstractFacadeService, ApiRunner, AppInjector, WindowManagerService } from '@firestone/shared/framework/core';
import { GAME_STATS_PROVIDER_SERVICE_TOKEN, IGameStatsProviderService } from '@firestone/stats/common';
import { distinctUntilChanged, filter, withLatestFrom } from 'rxjs';
import { ArenaDeckDetails } from '../models/arena-deck-details';
import { ArenaNavigationService } from './arena-navigation.service';

const ARENA_DECK_DETAILS_URL = `https://znumiwhsu7lx2chawhhgzhjol40ygaro.lambda-url.us-west-2.on.aws/%runId%`;

@Injectable()
export class ArenDeckDetailsService extends AbstractFacadeService<ArenDeckDetailsService> {
	// null = no data, undefined = loading
	public deckDetails$$: SubscriberAwareBehaviorSubject<ArenaDeckDetails | null | undefined>;

	private nav: ArenaNavigationService;
	private gameStats: IGameStatsProviderService;
	private api: ApiRunner;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'ArenDeckDetailsService', () => !!this.deckDetails$$);
	}

	protected override assignSubjects() {
		this.deckDetails$$ = this.mainInstance.deckDetails$$;
	}

	protected async init() {
		this.deckDetails$$ = new SubscriberAwareBehaviorSubject<ArenaDeckDetails | null | undefined>(null);
		this.nav = AppInjector.get(ArenaNavigationService);
		this.api = AppInjector.get(ApiRunner);
		this.gameStats = AppInjector.get(GAME_STATS_PROVIDER_SERVICE_TOKEN);

		this.deckDetails$$.onFirstSubscribe(() => {
			this.nav.selectedPersonalDeckstring$$
				.pipe(
					filter((deckstring) => !!deckstring),
					distinctUntilChanged(),
					withLatestFrom(this.gameStats.gameStats$),
				)
				.subscribe(async ([deckstring, gameStats]) => {
					console.debug('[arena-deck-details] received deckstring', deckstring);
					this.deckDetails$$.next(undefined);
					if (!deckstring) {
						this.deckDetails$$.next(null);
						console.warn('[arena-deck-details] received empty deckstring');
						return;
					}
					const runId = gameStats?.find(
						(s) => s.gameMode === 'arena' && s.playerDecklist === deckstring,
					)?.runId;
					if (!runId) {
						this.deckDetails$$.next(null);
						console.warn('[arena-deck-details] could not find runId for deckstring', deckstring);
						return;
					}
					const picks = await this.api.callGetApi<Picks>(ARENA_DECK_DETAILS_URL.replace('%runId%', runId));
					const pickInfo = picks?.picks;
					if (!pickInfo) {
						this.deckDetails$$.next(null);
						console.warn('[arena-deck-details] no valid picks', picks);
						return;
					}
					console.debug('[arena-deck-details] received picks', picks);
					const deckDetails: ArenaDeckDetails = {
						deckstring: deckstring,
						runId: runId,
						picks: picks.picks,
					};
					this.deckDetails$$.next(deckDetails);
				});
		});
	}
}
