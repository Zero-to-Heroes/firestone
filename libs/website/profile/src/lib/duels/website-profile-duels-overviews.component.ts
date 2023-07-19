import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { WebsiteProfileState } from '../+state/website/profile.models';
import { getStatsForModes } from '../+state/website/profile.selectors';

@Component({
	selector: 'website-profile-duels-overviews',
	styleUrls: [`./website-profile-duels-overviews.component.scss`],
	template: `
		<website-profile-mode-overview
			class="card item"
			[mode]="'duels'"
			[wins]="wins$ | async"
			[losses]="losses$ | async"
		>
		</website-profile-mode-overview>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebsiteProfileDuelsOverviewsComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	wins$: Observable<number>;
	losses$: Observable<number>;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly store: Store<WebsiteProfileState>,
	) {
		super(cdr);
	}

	ngAfterContentInit(): void {
		this.wins$ = this.store
			.select(getStatsForModes)
			.pipe(this.mapData((stats) => stats.find((s) => s.mode === 'duels')?.wins ?? 0));
		this.losses$ = this.store
			.select(getStatsForModes)
			.pipe(this.mapData((stats) => stats.find((s) => s.mode === 'duels')?.losses ?? 0));
	}
}
