import { Injectable } from '@angular/core';
import { isArena } from '@firestone-hs/reference-data';
import { GameStat } from '@firestone/stats/data-access';
import { BehaviorSubject, distinctUntilChanged, filter, map, startWith } from 'rxjs';
import { GameStatsProviderService } from '../stats/game/game-stats-provider.service';

// Not used yet, and not plugged in
@Injectable()
export class ArenaLastMatchService {
	public lastArenaGame$$ = new BehaviorSubject<GameStat>(null);

	constructor(private readonly gameStats: GameStatsProviderService) {
		this.listForLastArenaMatch();
	}

	private async listForLastArenaMatch() {
		this.gameStats.gameStats$$
			.pipe(
				filter((stats) => !!stats?.length),
				map((stats) => stats?.filter((s) => isArena(s.gameMode))),
				map((stats) => stats[0]),
				filter((lastArenaMatch) => !!lastArenaMatch),
				distinctUntilChanged(),
				startWith(null),
			)
			.subscribe(this.lastArenaGame$$);
	}
}
