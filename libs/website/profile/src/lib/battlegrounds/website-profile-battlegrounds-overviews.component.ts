import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { AbstractSubscriptionComponent, sortByProperties } from '@firestone/shared/framework/common';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { WebsiteProfileState } from '../+state/website/profile.models';
import { getBgsHeroStats } from '../+state/website/profile.selectors';

@Component({
	selector: 'website-profile-battlegrounds-overviews',
	styleUrls: [`./website-profile-battlegrounds-overviews.component.scss`],
	template: `
		<website-profile-battlegrounds-overview
			class="card item"
			[showBgTitle]="showBgTitle"
			[mode]="'top-1'"
			[value]="top1$ | async"
		>
		</website-profile-battlegrounds-overview>
		<website-profile-battlegrounds-overview
			class="card item"
			[showBgTitle]="showBgTitle"
			[mode]="'top-4'"
			[value]="top4$ | async"
		>
		</website-profile-battlegrounds-overview>
		<website-profile-battlegrounds-overview
			class="card item"
			[showBgTitle]="showBgTitle"
			[mode]="'games-played'"
			[value]="gamesPlayed$ | async"
		>
		</website-profile-battlegrounds-overview>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebsiteProfileBattlegroundsOverviewsComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit
{
	gamesPlayed$: Observable<number>;
	top4$: Observable<number>;
	top1$: Observable<number>;

	@Input() showBgTitle: boolean;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly store: Store<WebsiteProfileState>,
	) {
		super(cdr);
	}

	ngAfterContentInit(): void {
		const heroStats$ = this.store
			.select(getBgsHeroStats)
			.pipe(this.mapData((stats) => [...stats].sort(sortByProperties((stat) => [-stat.gamesPlayed]))));
		this.gamesPlayed$ = heroStats$.pipe(
			this.mapData((stats) => stats.map((stat) => stat.gamesPlayed).reduce((a, b) => a + b, 0)),
		);
		this.top4$ = heroStats$.pipe(
			this.mapData((stats) => stats.map((stat) => stat.top4).reduce((a, b) => a + b, 0)),
		);
		this.top1$ = heroStats$.pipe(
			this.mapData((stats) => stats.map((stat) => stat.top1).reduce((a, b) => a + b, 0)),
		);
	}
}
