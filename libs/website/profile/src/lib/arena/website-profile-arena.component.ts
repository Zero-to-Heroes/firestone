import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { WebsiteProfileState } from '../+state/website/profile.models';
import { getClassStats } from '../+state/website/profile.selectors';
import { ProfileClassStat } from '../modes/profile-class-stat';

@Component({
	selector: 'website-profile-arena',
	styleUrls: [`./website-profile-arena.component.scss`],
	template: `
		<website-profile>
			<div class="overview">
				<website-profile-arena-overviews></website-profile-arena-overviews>
			</div>
			<section class="class-stats">
				<website-profile-class-stats [classStats]="classStats$ | async"></website-profile-class-stats>
			</section>
		</website-profile>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebsiteProfileArenaComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	classStats$: Observable<readonly ProfileClassStat[]>;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly store: Store<WebsiteProfileState>,
	) {
		super(cdr);
	}

	ngAfterContentInit(): void {
		this.classStats$ = this.store.select(getClassStats).pipe(
			this.mapData((stats) =>
				stats.map((stat) => {
					const winsForMode = stat.winsForModes.find((s) => s.mode === 'arena');
					const result: ProfileClassStat = {
						gameMode: 'arena',
						playerClass: stat.playerClass,
						wins: winsForMode?.wins ?? 0,
						losses: winsForMode?.losses ?? 0,
						ties: winsForMode?.ties ?? 0,
					};
					return result;
				}),
			),
		);
	}
}
