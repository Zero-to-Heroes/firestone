import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, tap } from 'rxjs/operators';
import { BgsHeroStat } from '../../../../models/battlegrounds/stats/bgs-hero-stat';
import { BgsPersonalStatsSelectHeroDetailsEvent } from '../../../../services/mainwindow/store/events/battlegrounds/bgs-personal-stats-select-hero-details-event';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../../services/overwolf.service';
import { AppUiStoreService, cdLog } from '../../../../services/ui-store/app-ui-store.service';
import { areDeepEqual } from '../../../../services/utils';

@Component({
	selector: 'battlegrounds-personal-stats-heroes',
	styleUrls: [
		`../../../../../css/global/components-global.scss`,
		`../../../../../css/component/battlegrounds/desktop/categories/battlegrounds-personal-stats-heroes.component.scss`,
	],
	template: `
		<div class="battlegrounds-personal-stats-heroes">
			<battlegrounds-stats-hero-vignette
				*ngFor="let stat of stats$ | async; trackBy: trackByFn"
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

	constructor(
		private readonly ow: OverwolfService,
		private readonly store: AppUiStoreService,
		private readonly cdr: ChangeDetectorRef,
	) {
		this.stats$ = this.store.bgHeroStats$().pipe(
			filter((stats) => !!stats?.length),
			map((stats) => stats.filter((stat) => stat.id !== 'average')),
			// FIXME
			distinctUntilChanged((a, b) => {
				// console.debug('changed deep?', a, b, JSON.stringify(a), JSON.stringify(b));
				return areDeepEqual(a, b);
			}),
			// FIXME
			tap((filter) => setTimeout(() => this.cdr?.detectChanges(), 0)),
			tap((stats) => cdLog('emitting stats in ', this.constructor.name, stats)),
		);
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	trackByFn(index: number, stat: BgsHeroStat) {
		return stat.id;
	}

	seeDetailedHeroStats(statId: string) {
		this.stateUpdater.next(new BgsPersonalStatsSelectHeroDetailsEvent(statId));
	}
}
