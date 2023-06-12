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

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly store: Store<WebsiteProfileState>,
	) {
		super(cdr);
	}

	ngAfterContentInit(): void {
		this.heroStats$ = this.store
			.select(getBgsHeroStats)
			.pipe(this.mapData((stats) => [...stats].sort(sortByProperties((stat) => [stat.heroName]))));
	}
}
