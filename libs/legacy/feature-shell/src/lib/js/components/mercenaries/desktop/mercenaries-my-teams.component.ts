import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { isMercenariesPvP, normalizeMercenariesCardId } from '@firestone/mercenaries/common';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { GameStat } from '@firestone/stats/data-access';
import { GameStatsProviderService } from '@firestone/stats/services';
import { Observable, combineLatest } from 'rxjs';
import { groupByFunction } from '../../../services/utils';
import { MercenaryPersonalTeamInfo } from './mercenary-info';

@Component({
	standalone: false,
	selector: 'mercenaries-my-teams',
	styleUrls: [`../../../../css/component/mercenaries/desktop/mercenaries-my-teams.component.scss`],
	template: `
		<div class="mercenaries-my-teams" scrollable>
			<ng-container *ngIf="teams$ | async as teams; else emptyState">
				<ul class="teams-list" scrollable>
					<mercenaries-personal-team-summary
						class="team"
						*ngFor="let team of teams"
						[team]="team"
					></mercenaries-personal-team-summary>
				</ul>
			</ng-container>
			<ng-template #emptyState> <mercenaries-empty-state></mercenaries-empty-state></ng-template>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercenariesMyTeamsComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	teams$: Observable<readonly MercenaryPersonalTeamInfo[]>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly perfs: PreferencesService,
		private readonly gameStats: GameStatsProviderService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.gameStats, this.perfs);

		this.teams$ = combineLatest([
			this.gameStats.gameStats$$,
			this.perfs.preferences$$.pipe(this.mapData((prefs) => prefs.mercenariesActivePvpMmrFilter)),
			this.perfs.preferences$$.pipe(this.mapData((prefs) => prefs.mercenariesHiddenTeamIds)),
			this.perfs.preferences$$.pipe(this.mapData((prefs) => prefs.mercenariesShowHiddenTeams)),
		]).pipe(
			this.mapData(([gameStats, mmrFilter, hiddenTeamIds, showHiddenTeams]) => {
				const mmrThreshold = 0;
				const relevantStats = gameStats
					// Include the AI games here, as otherwise this is confusing
					?.filter((stat) => isMercenariesPvP(stat.gameMode))
					.filter((stat) => (mmrThreshold === 0 ? true : stat.playerRank && +stat.playerRank >= mmrThreshold))
					.filter((stat) => !!stat.mercHeroTimings?.length);
				const groupedByTeam = groupByFunction((stat: GameStat) =>
					this.normalizeMercDecklist(stat.mercHeroTimings),
				)(relevantStats);
				const teams = Object.keys(groupedByTeam)
					.map((mercIds) => {
						const gamesForTeam = groupedByTeam[mercIds];
						const mercenariesCardIds = mercIds.split(',');
						return {
							id: mercIds,
							hidden: hiddenTeamIds.includes(mercIds),
							mercenariesCardIds: mercenariesCardIds,
							games: gamesForTeam,
						} as MercenaryPersonalTeamInfo;
					})
					.filter((team) => showHiddenTeams || !team.hidden);
				return teams.length === 0 ? null : teams;
			}),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}

	trackByFn(index: number, item: MercenaryPersonalTeamInfo) {
		return item.id;
	}

	private normalizeMercDecklist(
		timings: readonly {
			cardId: string;
			turnInPlay: number;
		}[],
	): string {
		return timings
			.map((info) => info.cardId)
			.map((cardId) => normalizeMercenariesCardId(cardId))
			.sort()
			.join(',');
	}
}
