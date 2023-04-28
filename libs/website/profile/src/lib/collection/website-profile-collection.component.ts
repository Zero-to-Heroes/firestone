import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { sets as allSets, standardSets } from '@firestone-hs/reference-data';
import { AbstractSubscriptionComponent, sortByProperties } from '@firestone/shared/framework/common';
import { WebsiteCoreState, getPremium } from '@firestone/website/core';
import { Store } from '@ngrx/store';
import { Observable, filter, tap } from 'rxjs';
import { initOwnProfileData } from '../+state/website/pofile.actions';
import { ExtendedProfileSet, WebsiteProfileState } from '../+state/website/profile.models';
import { getLoaded, getSets } from '../+state/website/profile.selectors';

@Component({
	selector: 'website-profile-collection',
	styleUrls: [`./website-profile-collection.component.scss`],
	template: `
		<with-loading [isLoading]="isLoading$ | async">
			<section class="sets">
				<website-profile-sets [sets]="standardSets$ | async" [header]="'Standard'"></website-profile-sets>
				<website-profile-sets [sets]="wildSets$ | async" [header]="'Wild'"></website-profile-sets>
			</section>
		</with-loading>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebsiteProfileCollectionComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	isLoading$: Observable<boolean>;
	standardSets$: Observable<readonly ExtendedProfileSet[]>;
	wildSets$: Observable<readonly ExtendedProfileSet[]>;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly store: Store<WebsiteProfileState>,
		private readonly coreStore: Store<WebsiteCoreState>,
	) {
		super(cdr);
	}

	ngAfterContentInit(): void {
		console.debug('after content init', 'ggaaaaa');
		this.isLoading$ = this.store.select(getLoaded).pipe(this.mapData((loaded) => !loaded));
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
		console.debug('core premium', this.coreStore, this.coreStore.select(getPremium));
		// TODO: return the nickname in the endpoint
		this.coreStore
			.select(getPremium)
			.pipe(
				tap((premium) => console.debug('retrieved premiummm', premium)),
				filter((premium) => !!premium),
				this.mapData((premium) => premium),
			)
			.subscribe((premium) => {
				// TODO: pass the current jwt token as well?
				console.debug('will init profile data');
				const action = initOwnProfileData();
				this.store.dispatch(action);
			});

		return;
	}
}
