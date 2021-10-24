import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { ScenarioId } from '@firestone-hs/reference-data';
import { Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, takeUntil, tap } from 'rxjs/operators';
import { GameStat } from '../../../models/mainwindow/stats/game-stat';
import { MercenariesPvpMmrFilterType } from '../../../models/mercenaries/mercenaries-pvp-mmr-filter.type';
import { CardsFacadeService } from '../../../services/cards-facade.service';
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
export class MercenariesMyTeamsComponent extends AbstractSubscriptionComponent {
	teams$: Observable<readonly MercenaryPersonalTeamInfo[]>;

	constructor(
		private readonly store: AppUiStoreFacadeService,
		private readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
	) {
		super();
		this.teams$ = this.store
			.listen$(
				([main, nav]) => main.mercenaries.referenceData,
				([main, nav]) => main.stats.gameStats,
				([main, nav, prefs]) => prefs.mercenariesActivePvpMmrFilter,
			)
			.pipe(
				filter(
					([referenceData, gameStats, mmrFilter]) =>
						!!referenceData?.mercenaries?.length && !!gameStats?.stats,
				),
				map(
					([referenceData, gameStats, mmrFilter]) =>
						[
							referenceData,
							gameStats.stats
								.filter((stat) => stat.scenarioId === ScenarioId.LETTUCE_PVP)
								.filter((stat) => !!stat.mercHeroTimings?.length),
							mmrFilter,
						] as [MercenariesReferenceData, readonly GameStat[], MercenariesPvpMmrFilterType],
				),
				distinctUntilChanged((a, b) => arraysEqual(a, b)),
				map(([referenceData, gameStats, mmrFilter]) => {
					const groupedByTeam = groupByFunction((stat: GameStat) =>
						this.normalizeMercDecklist(stat.mercHeroTimings, referenceData),
					)(gameStats);
					return Object.keys(groupedByTeam).map((mercIds) => {
						// console.debug('building team for', mercIds, groupedByTeam);
						const gamesForTeam = groupedByTeam[mercIds];
						const mercenariesCardIds = mercIds.split(',');
						return {
							id: mercIds,
							mercenariesCardIds: mercenariesCardIds,
							games: gamesForTeam,
						} as MercenaryPersonalTeamInfo;
					});
				}),
				tap((filter) => setTimeout(() => this.cdr?.detectChanges(), 0)),
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
