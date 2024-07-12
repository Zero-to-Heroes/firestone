/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @angular-eslint/template/eqeqeq */
/* eslint-disable @angular-eslint/template/no-negated-async */
import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { ILocalizationService, waitForReady } from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable, distinctUntilChanged, shareReplay, takeUntil, tap } from 'rxjs';
import { CommunityNavigationService } from '../services/community-navigation.service';
import { PersonalCommunitiesService } from '../services/personal-communities.service';

@Component({
	selector: 'community-details',
	styleUrls: [`./community-details.component.scss`],
	template: `
		<div class="community-details">
			<nav class="internal-navigation">
				<div
					class="tab"
					*ngFor="let tab of tabs$ | async; trackBy: trackByTab"
					[ngClass]="{ selected: tab.selected }"
					(click)="selectTab(tab)"
				>
					<div class="text" [helpTooltip]="tab.tooltip">{{ tab.name }}</div>
				</div>
				<div class="guild-name">{{ communityName$ | async }}</div>
			</nav>

			<ng-container *ngIf="{ selectedTab: selectedTab$ | async } as value">
				<community-overview *ngIf="value.selectedTab === 'overview'"></community-overview>
				<community-leaderboards *ngIf="value.selectedTab === 'leaderboards'"></community-leaderboards>
				<community-internal-ladder *ngIf="value.selectedTab === 'friendly-battles'"></community-internal-ladder>
			</ng-container>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommunityDetailsComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	communityName$: Observable<string>;
	tabs$: Observable<readonly Tab[]>;
	selectedTab$: Observable<string>;

	private selectedTab$$ = new BehaviorSubject<string>('overview');

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly nav: CommunityNavigationService,
		private readonly personalCommunities: PersonalCommunitiesService,
		private readonly i18n: ILocalizationService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.personalCommunities, this.nav);

		this.communityName$ = this.personalCommunities.selectedCommunity$$.pipe(
			this.mapData((community) => community?.name ?? ''),
		);
		this.selectedTab$ = this.selectedTab$$.pipe(
			distinctUntilChanged((a, b) => a === b),
			tap((tab) => console.debug('selected tab', tab)),
			shareReplay(1),
			takeUntil(this.destroyed$),
		);

		const allTabs = ['overview', 'leaderboards', 'friendly-battles'].map((tab) => {
			const tooltip = this.i18n.translateString(`app.communities.details.menu.${tab}-tooltip`)!;
			return {
				id: tab,
				name: this.i18n.translateString(`app.communities.details.menu.${tab}`)!,
				tooltip: tooltip === `app.communities.details.menu.${tab}-tooltip` ? null : tooltip,
			};
		});
		this.tabs$ = this.selectedTab$.pipe(
			this.mapData((selectedTab) =>
				allTabs.map((tab) =>
					tab.id === selectedTab
						? {
								...tab,
								selected: tab.id === selectedTab,
						  }
						: tab,
				),
			),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	trackByTab(index: number, item: Tab) {
		return item.id;
	}

	selectTab(tab: Tab) {
		this.selectedTab$$.next(tab.id);
	}
}

interface Tab {
	id: string;
	name: string;
	tooltip: string | null;
	selected?: boolean;
}
