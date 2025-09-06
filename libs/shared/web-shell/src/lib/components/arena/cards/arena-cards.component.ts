import { CommonModule } from '@angular/common';
import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { ArenaClassStatsService, ArenaCommonModule } from '@firestone/arena/common';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { filter, tap } from 'rxjs';
import { WebArenaFiltersComponent } from '../filters/_web-arena-filters.component';
import { WebArenaModeFilterDropdownComponent } from '../filters/web-arena-mode-filter-dropdown.component';
import { WebArenaTimeFilterDropdownComponent } from '../filters/web-arena-time-filter-dropdown.component';

@Component({
	standalone: true,
	selector: 'arena-cards',
	templateUrl: './arena-cards.component.html',
	styleUrls: ['./arena-cards.component.scss'],
	imports: [
		CommonModule,

		ArenaCommonModule,

		WebArenaFiltersComponent,
		WebArenaModeFilterDropdownComponent,
		WebArenaTimeFilterDropdownComponent,
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaCardsComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly prefs: PreferencesService,
		private readonly arenaClassStats: ArenaClassStatsService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs, this.arenaClassStats);
		console.debug('[arena-classes] after content init', this.prefs);

		this.arenaClassStats.classStats$$
			.pipe(
				tap((stats) => console.debug('[arena-classes] class stats 0', stats)),
				filter((stats) => !!stats?.stats),
				this.mapData((stats) => {
					console.debug('[arena-classes] class stats', stats);
				}),
			)
			.subscribe();

		this.cdr.detectChanges();
	}
}
