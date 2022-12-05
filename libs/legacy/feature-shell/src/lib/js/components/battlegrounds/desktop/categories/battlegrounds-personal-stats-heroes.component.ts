import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
} from '@angular/core';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { BgsHeroStat } from '../../../../models/battlegrounds/stats/bgs-hero-stat';
import { BgsPersonalStatsSelectHeroDetailsEvent } from '../../../../services/mainwindow/store/events/battlegrounds/bgs-personal-stats-select-hero-details-event';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../../services/overwolf.service';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../../abstract-subscription.component';

@Component({
	selector: 'battlegrounds-personal-stats-heroes',
	styleUrls: [
		`../../../../../css/component/battlegrounds/desktop/categories/battlegrounds-personal-stats-heroes.component.scss`,
	],
	template: `
		<section
			class="battlegrounds-personal-stats-heroes"
			[attr.aria-label]="'Battlegrounds personal hero stats'"
			role="list"
		>
			<battlegrounds-stats-hero-vignette
				*ngFor="let stat of stats$ | async; trackBy: trackByFn"
				role="listitem"
				[stat]="stat"
				(click)="seeDetailedHeroStats(stat.id)"
			></battlegrounds-stats-hero-vignette>
		</section>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsPersonalStatsHeroesComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit, AfterViewInit
{
	stats$: Observable<readonly BgsHeroStat[]>;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly ow: OverwolfService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.stats$ = this.store.bgHeroStats$().pipe(
			filter((stats) => !!stats?.length),
			this.mapData((stats) => stats.filter((stat) => stat.id !== 'average')),
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
