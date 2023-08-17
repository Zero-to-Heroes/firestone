import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { GameStat } from '@firestone/stats/data-access';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { getMmrThreshold } from '../../../../services/ui-store/bgs-ui-helper';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';

@Component({
	selector: 'battlegrounds-perfect-games',
	styleUrls: [
		`../../../../../css/component/battlegrounds/desktop/categories/battlegrounds-perfect-games.component.scss`,
	],
	template: `
		<div class="battlegrounds-perfect-games" *ngIf="replays$ | async as replays">
			<with-loading [isLoading]="!replays?.length">
				<replays-list-view [replays]="replays"></replays-list-view>
			</with-loading>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsPerfectGamesComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit, OnDestroy
{
	replays$: Observable<readonly GameStat[]>;

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.replays$ = this.store
			.listen$(
				([main, nav]) => main.battlegrounds.getPerfectGames(),
				([main, nav]) => main.battlegrounds.getMetaHeroStats()?.mmrPercentiles,
				([main, nav, prefs]) => prefs.bgsActiveRankFilter,
				([main, nav, prefs]) => prefs.bgsActiveHeroFilter,
			)
			.pipe(
				filter(([perfectGames, mmrPercentiles, rankFilter, heroFilter]) => !!perfectGames?.length),
				this.mapData(([perfectGames, mmrPercentiles, rankFilter, heroFilter]) => {
					const mmrThreshold = getMmrThreshold(rankFilter, mmrPercentiles);
					return this.applyFilters(perfectGames ?? [], mmrThreshold, heroFilter);
				}),
			);
	}

	private applyFilters(replays: readonly GameStat[], rankFilter: number, heroFilter: string): readonly GameStat[] {
		return replays
			.filter((replay) => this.rankFilter(replay, rankFilter))
			.filter((replay) => this.heroFilter(replay, heroFilter));
	}

	private rankFilter(stat: GameStat, rankFilter: number) {
		if (!rankFilter) {
			return true;
		}
		return stat.playerRank && parseInt(stat.playerRank) >= rankFilter;
	}

	private heroFilter(stat: GameStat, heroFilter: string) {
		if (!heroFilter) {
			return true;
		}

		switch (heroFilter) {
			case 'all':
			case null:
				return true;
			default:
				return stat.playerCardId === heroFilter;
		}
	}
}
