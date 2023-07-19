import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { sets as allSets, standardSets } from '@firestone-hs/reference-data';
import { AbstractSubscriptionComponent, sortByProperties } from '@firestone/shared/framework/common';
import { Store } from '@ngrx/store';
import { Observable, tap } from 'rxjs';
import { ExtendedProfileSet, WebsiteProfileState } from '../+state/website/profile.models';
import { getSets } from '../+state/website/profile.selectors';

@Component({
	selector: 'website-profile-overview',
	styleUrls: [`./website-profile-overview.component.scss`],
	template: `
		<website-profile>
			<div class="overview">
				<website-profile-ranked-overviews></website-profile-ranked-overviews>
				<website-profile-duels-overviews></website-profile-duels-overviews>
				<website-profile-arena-overviews></website-profile-arena-overviews>
				<website-profile-battlegrounds-overviews [showBgTitle]="true"></website-profile-battlegrounds-overviews>
				<!-- <website-profile-class-recap></website-profile-class-recap> -->
				<div class="card collection standard">
					<website-profile-collection-overview
						class="mode standard"
						[mode]="'standard'"
						[title]="'Standard cards'"
						[sets]="standardSets$ | async"
					>
					</website-profile-collection-overview>
				</div>
				<div class="card collection wild">
					<website-profile-collection-overview
						class="mode wild"
						[mode]="'wild'"
						[title]="'Wild cards'"
						[sets]="wildSets$ | async"
					>
					</website-profile-collection-overview>
				</div>
				<website-profile-packs-overview class="card overview"></website-profile-packs-overview>
				<website-profile-achievements-overview></website-profile-achievements-overview>
			</div>
		</website-profile>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebsiteProfileOverviewComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	standardSets$: Observable<readonly ExtendedProfileSet[]>;
	wildSets$: Observable<readonly ExtendedProfileSet[]>;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly store: Store<WebsiteProfileState>,
	) {
		super(cdr);
	}

	ngAfterContentInit(): void {
		const sets$ = this.store.select(getSets);
		const allSetsSorted = [...allSets].sort(sortByProperties((s) => [-s.launchDate]));
		this.standardSets$ = sets$.pipe(
			tap((info) => console.debug('profile sets', info)),
			this.mapData(
				(sets) =>
					allSetsSorted
						.filter((set) => standardSets.includes(set.id))
						.map((ref) => sets.find((s) => s.id === ref.id))
						.filter((s) => !!s) as readonly ExtendedProfileSet[],
			),
			tap((info) => console.debug('standard sets', info)),
		);
		this.wildSets$ = sets$.pipe(
			this.mapData(
				(sets) =>
					allSetsSorted
						.filter((set) => !standardSets.includes(set.id))
						.map((ref) => sets.find((s) => s.id === ref.id))
						.filter((s) => !!s) as readonly ExtendedProfileSet[],
			),
		);
	}
}
