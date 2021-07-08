import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, tap } from 'rxjs/operators';
import { BgsHeroStat } from '../../../../models/battlegrounds/stats/bgs-hero-stat';
import { AppUiStoreService, cdLog } from '../../../../services/app-ui-store.service';
import { BgsPersonalStatsSelectHeroDetailsEvent } from '../../../../services/mainwindow/store/events/battlegrounds/bgs-personal-stats-select-hero-details-event';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../../services/overwolf.service';
import { arraysEqual } from '../../../../services/utils';

@Component({
	selector: 'battlegrounds-personal-stats-heroes',
	styleUrls: [
		`../../../../../css/global/components-global.scss`,
		`../../../../../css/component/battlegrounds/desktop/categories/battlegrounds-personal-stats-heroes.component.scss`,
	],
	template: `
		<div class="battlegrounds-personal-stats-heroes">
			<battlegrounds-stats-hero-vignette
				*ngFor="let stat of stats$ | async"
				[stat]="stat"
				(click)="seeDetailedHeroStats(stat.id)"
			></battlegrounds-stats-hero-vignette>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsPersonalStatsHeroesComponent implements AfterViewInit {
	stats$: Observable<readonly BgsHeroStat[]>;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private readonly ow: OverwolfService, private readonly store: AppUiStoreService) {
		this.stats$ = this.store
			.listen$(
				([main, nav]) => main.battlegrounds.stats.heroStats,
			)
			.pipe(
				filter(([stats]) => !!stats?.length),
				distinctUntilChanged((a, b) => arraysEqual(a, b)),
				map(([stats]) => stats.filter((stat) => stat.id !== 'average')),
				tap((stats) => cdLog('emitting stats in ', this.constructor.name, stats)),
			);
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	seeDetailedHeroStats(statId: string) {
		this.stateUpdater.next(new BgsPersonalStatsSelectHeroDetailsEvent(statId));
	}
}
