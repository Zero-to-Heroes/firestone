import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { AbstractSubscriptionComponent, sortByProperties } from '@firestone/shared/framework/common';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { ExtendedProfileBgHeroStat, WebsiteProfileState } from '../+state/website/profile.models';
import { getBgsHeroStats } from '../+state/website/profile.selectors';

@Component({
	selector: 'website-profile-battlegrounds',
	styleUrls: [`./website-profile-battlegrounds.component.scss`],
	template: `
		<website-profile>
			<div class="overview">
				<website-profile-battlegrounds-overview class="item" [mode]="'top-1'" [value]="top1$ | async">
				</website-profile-battlegrounds-overview>
				<website-profile-battlegrounds-overview class="item" [mode]="'top-4'" [value]="top4$ | async">
				</website-profile-battlegrounds-overview>
				<website-profile-battlegrounds-overview
					class="item"
					[mode]="'games-played'"
					[value]="gamesPlayed$ | async"
				>
				</website-profile-battlegrounds-overview>
			</div>
			<section class="hero-stats">
				<website-profile-battlegrounds-hero-stat-vignette *ngFor="let stat of heroStats$ | async" [stat]="stat">
				</website-profile-battlegrounds-hero-stat-vignette>
			</section>
		</website-profile>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebsiteProfileBattlegroundsComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	heroStats$: Observable<readonly ExtendedProfileBgHeroStat[]>;
	gamesPlayed$: Observable<number>;
	top4$: Observable<number>;
	top1$: Observable<number>;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly store: Store<WebsiteProfileState>,
	) {
		super(cdr);
	}

	ngAfterContentInit(): void {
		this.heroStats$ = this.store
			.select(getBgsHeroStats)
			.pipe(this.mapData((stats) => [...stats].sort(sortByProperties((stat) => [-stat.gamesPlayed]))));
		this.gamesPlayed$ = this.heroStats$.pipe(
			this.mapData((stats) => stats.map((stat) => stat.gamesPlayed).reduce((a, b) => a + b, 0)),
		);
		this.top4$ = this.heroStats$.pipe(
			this.mapData((stats) => stats.map((stat) => stat.top4).reduce((a, b) => a + b, 0)),
		);
		this.top1$ = this.heroStats$.pipe(
			this.mapData((stats) => stats.map((stat) => stat.top1).reduce((a, b) => a + b, 0)),
		);
	}
}
