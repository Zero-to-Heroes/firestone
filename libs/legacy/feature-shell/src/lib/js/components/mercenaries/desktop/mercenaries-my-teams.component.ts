import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { GameStat } from '@firestone/stats/data-access';
import { Observable, combineLatest } from 'rxjs';
import { isMercenariesPvP, normalizeMercenariesCardId } from '../../../services/mercenaries/mercenaries-utils';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { groupByFunction } from '../../../services/utils';
import { AbstractSubscriptionStoreComponent } from '../../abstract-subscription-store.component';
import { MercenaryPersonalTeamInfo } from './mercenary-info';

@Component({
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
export class MercenariesMyTeamsComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	teams$: Observable<readonly MercenaryPersonalTeamInfo[]>;

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		this.teams$ = combineLatest([
			this.store.gameStats$(),
			this.store.listen$(
				([main, nav, prefs]) => prefs.mercenariesActivePvpMmrFilter,
				([main, nav, prefs]) => prefs.mercenariesHiddenTeamIds,
				([main, nav, prefs]) => prefs.mercenariesShowHiddenTeams,
			),
		]).pipe(
			this.mapData(([gameStats, [mmrFilter, hiddenTeamIds, showHiddenTeams]]) => {
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
