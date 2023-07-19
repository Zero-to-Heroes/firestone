import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { WebsiteProfileState } from '../+state/website/profile.models';
import { getStatsForModes } from '../+state/website/profile.selectors';

@Component({
	selector: 'website-profile-arena-overviews',
	styleUrls: [`./website-profile-arena-overviews.component.scss`],
	template: `
		<website-profile-mode-overview
			class="card item"
			[mode]="'arena'"
			[wins]="wins$ | async"
			[losses]="losses$ | async"
		>
		</website-profile-mode-overview>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebsiteProfileArenaOverviewsComponent extends AbstractSubscriptionComponent implements AfterContentInit {
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
			.pipe(this.mapData((stats) => stats.find((s) => s.mode === 'arena')?.wins ?? 0));
		this.losses$ = this.store
			.select(getStatsForModes)
			.pipe(this.mapData((stats) => stats.find((s) => s.mode === 'arena')?.losses ?? 0));
	}
}
