import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { ScenarioId } from '@firestone-hs/reference-data';
import { Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, takeUntil, tap } from 'rxjs/operators';
import { GameStat } from '../../../models/mainwindow/stats/game-stat';
import { MercenariesReferenceData } from '../../../services/mercenaries/mercenaries-state-builder.service';
import { normalizeMercenariesCardId } from '../../../services/mercenaries/mercenaries-utils';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { cdLog } from '../../../services/ui-store/app-ui-store.service';
import { arraysEqual, groupByFunction } from '../../../services/utils';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';
import { MercenaryPersonalTeamInfo } from './mercenary-info';

@Component({
	selector: 'mercenaries-my-teams',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/mercenaries/desktop/mercenaries-my-teams.component.scss`,
	],
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

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.teams$ = this.store
			.listen$(
				([main, nav]) => main.mercenaries.referenceData,
				([main, nav]) => main.mercenaries.getGlobalStats(),
				([main, nav]) => main.stats.gameStats,
				([main, nav, prefs]) => prefs.mercenariesActivePvpMmrFilter,
				([main, nav, prefs]) => prefs.mercenariesHiddenTeamIds,
				([main, nav, prefs]) => prefs.mercenariesShowHiddenTeams,
			)
			.pipe(
				filter(
					([referenceData, globalStats, gameStats, mmrFilter, hiddenTeamIds, showHiddenTeams]) =>
						!!referenceData?.mercenaries?.length && !!gameStats?.stats,
				),
				map(([referenceData, globalStats, gameStats, mmrFilter, hiddenTeamIds, showHiddenTeams]) => {
					const mmrThreshold =
						globalStats?.pvp?.mmrPercentiles?.find((percentile) => percentile.percentile === mmrFilter)
							?.mmr ?? 0;
					return [
						referenceData,
						gameStats.stats
							.filter((stat) => stat.scenarioId === ScenarioId.LETTUCE_PVP)
							.filter((stat) =>
								mmrThreshold === 0 ? true : stat.playerRank && +stat.playerRank >= mmrThreshold,
							)
							.filter((stat) => !!stat.mercHeroTimings?.length),
						hiddenTeamIds ?? [],
						showHiddenTeams,
					] as [MercenariesReferenceData, readonly GameStat[], readonly string[], boolean];
				}),
				distinctUntilChanged((a, b) => arraysEqual(a, b)),
				map(([referenceData, gameStats, hiddenTeamIds, showHiddenTeams]) => {
					const groupedByTeam = groupByFunction((stat: GameStat) =>
						this.normalizeMercDecklist(stat.mercHeroTimings, referenceData),
					)(gameStats);
					return Object.keys(groupedByTeam)
						.map((mercIds) => {
							// console.debug('building team for', mercIds, groupedByTeam);
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
				}),
				map((teams) => (teams.length === 0 ? null : teams)),
				tap((filter) =>
					setTimeout(() => {
						if (!(this.cdr as ViewRef)?.destroyed) {
							this.cdr.detectChanges();
						}
					}, 0),
				),
				tap((info) => cdLog('emitting stats in ', this.constructor.name, info)),
				takeUntil(this.destroyed$),
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
		referenceData: MercenariesReferenceData,
	): string {
		return timings
			.map((info) => info.cardId)
			.map((cardId) => normalizeMercenariesCardId(cardId))
			.sort()
			.join(',');
	}
}
