import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { GameStat } from '@firestone/stats/data-access';
import { BgsPerfectGamesService } from '@legacy-import/src/lib/js/services/battlegrounds/bgs-perfect-games.service';
import { Observable, combineLatest } from 'rxjs';
import { filter, tap } from 'rxjs/operators';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { getMmrThreshold } from '../../../../services/ui-store/bgs-ui-helper';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';

@Component({
	selector: 'battlegrounds-perfect-games',
	styleUrls: [
		`../../../../../css/component/battlegrounds/desktop/categories/battlegrounds-perfect-games.component.scss`,
	],
	template: `
		<div class="battlegrounds-perfect-games" *ngIf="{ replays: replays$ | async } as value">
			<with-loading [isLoading]="value.replays == null">
				<replays-list-view [replays]="value.replays"></replays-list-view>
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

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly perfectGames: BgsPerfectGamesService,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		await this.perfectGames.isReady();

		this.replays$ = combineLatest([
			this.perfectGames.perfectGames$$,
			this.store.listen$(
				([main, nav]) => main.battlegrounds.getMetaHeroStats()?.mmrPercentiles,
				([main, nav, prefs]) => prefs.bgsActiveRankFilter,
				([main, nav, prefs]) => prefs.bgsActiveHeroFilter,
			),
		]).pipe(
			filter(
				([perfectGames, [mmrPercentiles, rankFilter, heroFilter]]) =>
					!!perfectGames?.length && !!mmrPercentiles?.length,
			),
			this.mapData(([perfectGames, [mmrPercentiles, rankFilter, heroFilter]]) => {
				const mmrThreshold = getMmrThreshold(rankFilter, mmrPercentiles);
				return this.applyFilters(perfectGames ?? [], mmrThreshold, heroFilter);
			}),
			tap((filteredReplays) => console.debug('[perfect-games] filtered replays', filteredReplays)),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
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
