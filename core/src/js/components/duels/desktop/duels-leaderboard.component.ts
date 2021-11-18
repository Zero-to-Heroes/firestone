import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { DuelsLeaderboardEntry } from '@firestone-hs/duels-leaderboard';
import { Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, takeUntil, tap } from 'rxjs/operators';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { cdLog } from '../../../services/ui-store/app-ui-store.service';
import { arraysEqual } from '../../../services/utils';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';

@Component({
	selector: 'duels-leaderboard',
	styleUrls: [`../../../../css/component/duels/desktop/duels-leaderboard.component.scss`],
	template: `
		<div class="duels-leaderboard">
			<div class="duels-leaderboard-entry-container">
				<li class="duels-leaderboard-entry header">
					<div class="rank">Rank</div>
					<div class="rating">Rating</div>
					<div class="name">Name</div>
				</li>
				<ul class="entries" scrollable>
					<li
						class="duels-leaderboard-entry"
						[ngClass]="{ 'your': value.isPlayer, 'top-3': value.rank <= 3, 'top-10': value.rank <= 10 }"
						*ngFor="let value of values$ | async; trackBy: trackValue"
					>
						<div class="rank">{{ value.rank }}</div>
						<div class="rating">{{ value.rating }}</div>
						<div class="name">{{ value.playerName }} {{ value.isPlayer ? ' (You)' : '' }}</div>
					</li>
				</ul>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsLeaderboardComponent extends AbstractSubscriptionComponent {
	values$: Observable<readonly DuelsLeaderboardEntry[]>;

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
		super(store, cdr);
		this.values$ = this.store
			.listen$(
				([main, nav]) => main.duels.leaderboard,
				([main, nav, prefs]) => prefs.duelsActiveLeaderboardModeFilter,
			)
			.pipe(
				filter(([stats, filter]) => !!stats && !!filter),
				map(([stats, filter]) => (filter === 'paid-duels' ? stats.heroic : stats.casual)),
				distinctUntilChanged((a, b) => arraysEqual(a, b)),
				// FIXME
				tap((filter) => setTimeout(() => this.cdr?.detectChanges(), 0)),
				tap((stat) => cdLog('emitting leaderboard in ', this.constructor.name, stat)),
				takeUntil(this.destroyed$),
			);
	}

	trackValue(index: number, entry: DuelsLeaderboardEntry) {
		return entry.playerName;
	}
}
