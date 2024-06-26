/* eslint-disable @angular-eslint/template/eqeqeq */
/* eslint-disable @angular-eslint/template/no-negated-async */
import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { CommunityInfo } from '@firestone-hs/communities';
import { SortCriteria, SortDirection, invertDirection } from '@firestone/shared/common/view';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable, combineLatest, startWith, takeUntil } from 'rxjs';
import { CommunityNavigationService } from '../services/community-navigation.service';
import { PersonalCommunitiesService } from '../services/personal-communities.service';

@Component({
	selector: 'my-communities',
	styleUrls: [`./my-communities-columns.scss`, `./my-communities.component.scss`],
	template: `
		<div class="my-communities" *ngIf="{ hasCommunities: hasCommunities$ | async } as value">
			<with-loading [isLoading]="loading$ | async">
				<ng-container *ngIf="value.hasCommunities">
					<div class="header" *ngIf="sortCriteria$ | async as sort">
						<div class="cell image"></div>
						<sortable-table-label
							class="cell name"
							[name]="'Name'"
							[sort]="sort"
							[criteria]="'name'"
							(sortClick)="onSortClick($event)"
						>
						</sortable-table-label>
						<div class="cell description">Description</div>
						<sortable-table-label
							class="cell members"
							[name]="'Members'"
							[sort]="sort"
							[criteria]="'members'"
							(sortClick)="onSortClick($event)"
						>
						</sortable-table-label>
						<sortable-table-label
							class="cell games-last-week"
							[name]="'Games Last Week'"
							[sort]="sort"
							[criteria]="'games-last-week'"
							(sortClick)="onSortClick($event)"
						>
						</sortable-table-label>
					</div>
					<ul class="communities-list">
						<div
							class="community"
							(click)="goIntoCommunity(community)"
							*ngFor="let community of communities$ | async"
						>
							<div class="cell image"></div>
							<div class="cell name">{{ community.name }}</div>
							<div class="cell description">{{ community.description }}</div>
							<div class="cell members">{{ community.numberOfMembers }}</div>
							<div class="cell games-last-week">{{ community.gamesInLastSevenDays }}</div>
						</div>
					</ul>
				</ng-container>
				<div *ngIf="!value.hasCommunities" class="no-communities">You are not part of any guild yet</div>
			</with-loading>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyCommunitiesComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	loading$: Observable<boolean>;
	hasCommunities$: Observable<boolean>;
	communities$: Observable<readonly CommunityInfo[]>;
	sortCriteria$: Observable<SortCriteria<ColumnSortType>>;

	private sortCriteria$$ = new BehaviorSubject<SortCriteria<ColumnSortType>>({
		criteria: 'name',
		direction: 'desc',
	});

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly nav: CommunityNavigationService,
		private readonly personalCommunities: PersonalCommunitiesService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.personalCommunities);

		this.sortCriteria$ = this.sortCriteria$$;
		this.loading$ = this.personalCommunities.communities$$.pipe(this.mapData((communities) => communities == null));
		this.hasCommunities$ = this.personalCommunities.communities$$.pipe(
			this.mapData((communities) => !!communities?.length),
			startWith(true),
			takeUntil(this.destroyed$),
		);
		this.communities$ = combineLatest([this.sortCriteria$, this.personalCommunities.communities$$]).pipe(
			this.mapData(([sortCriteria, communities]) =>
				[...(communities ?? [])].sort((a, b) => this.sortCommunities(a, b, sortCriteria)),
			),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	goIntoCommunity(community: CommunityInfo) {
		this.nav.selectedCommunity$$.next(community.id);
		this.nav.changeCategory('community-details');
	}

	onSortClick(rawCriteria: string) {
		const criteria: ColumnSortType = rawCriteria as ColumnSortType;
		this.sortCriteria$$.next({
			criteria: criteria,
			direction:
				criteria === this.sortCriteria$$.value?.criteria
					? invertDirection(this.sortCriteria$$.value.direction)
					: 'desc',
		});
	}

	private sortCommunities(a: CommunityInfo, b: CommunityInfo, sortCriteria: SortCriteria<ColumnSortType>): number {
		switch (sortCriteria?.criteria) {
			case 'name':
				return this.sortByName(a, b, sortCriteria.direction);
			case 'members':
				return this.sortByMembers(a, b, sortCriteria.direction);
			case 'games-last-week':
				return this.sortByGamesLastWeek(a, b, sortCriteria.direction);
			default:
				return 0;
		}
	}

	private sortByName(a: CommunityInfo, b: CommunityInfo, direction: SortDirection): number {
		const aData = a?.name ?? '';
		const bData = b?.name ?? '';
		return direction === 'asc' ? aData.localeCompare(bData) : bData.localeCompare(aData);
	}

	private sortByMembers(a: CommunityInfo, b: CommunityInfo, direction: SortDirection): number {
		const aData = a?.numberOfMembers ?? 0;
		const bData = b?.numberOfMembers ?? 0;
		return direction === 'asc' ? aData - bData : bData - aData;
	}

	private sortByGamesLastWeek(a: CommunityInfo, b: CommunityInfo, direction: SortDirection): number {
		const aData = a?.gamesInLastSevenDays ?? 0;
		const bData = b?.gamesInLastSevenDays ?? 0;
		return direction === 'asc' ? aData - bData : bData - aData;
	}
}

type ColumnSortType = 'name' | 'members' | 'games-last-week';
