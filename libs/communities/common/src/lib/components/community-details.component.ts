/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @angular-eslint/template/eqeqeq */
/* eslint-disable @angular-eslint/template/no-negated-async */
import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { CommunityInfo, LeaderboardEntry } from '@firestone-hs/communities';
import { StatGameFormatType, StatGameModeType } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { ILocalizationService, waitForReady } from '@firestone/shared/framework/core';
import { GameStat } from '@firestone/stats/data-access';
import { BehaviorSubject, Observable, combineLatest, filter, tap } from 'rxjs';
import { CommunityNavigationService } from '../services/community-navigation.service';
import { PersonalCommunitiesService } from '../services/personal-communities.service';

@Component({
	selector: 'community-details',
	styleUrls: [`./community-details.component.scss`],
	template: `
		<div class="community-details">
			<div class="overview">
				<div class="community-name">{{ communityName$ | async }}</div>
				<div class="community-description">{{ communityDescription$ | async }}</div>
				<div class="total-members">
					<span class="value">{{ totalMembersStr$ | async }}</span>
					<span class="label">members</span>
				</div>
				TODO: add "games played last week", or maybe "time played last week"
			</div>
			<div class="leaderboards">
				<div class="header">Leaderboards</div>
				<ul class="tabs">
					<div class="tab" *ngFor="let tab of tabs$ | async" [ngClass]="{ selected: tab.selected }">
						<div class="text">{{ tab.name }}</div>
					</div>
				</ul>
				<div class="leaderboard" *ngIf="leaderboard$ | async as leaderboard">
					<div class="leaderboard-entry" *ngFor="let entry of leaderboard">
						<rank-image class="player-rank" [stat]="entry.playerRank"></rank-image>
						<div class="player-name">{{ entry.playerName }}</div>
					</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommunityDetailsComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	communityName$: Observable<string>;
	communityDescription$: Observable<string>;
	totalMembersStr$: Observable<string>;
	tabs$: Observable<readonly Tab[]>;
	leaderboard$: Observable<readonly InternalLeaderboardEntry[]>;

	private selectedTab$$ = new BehaviorSubject<string>('standard');

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
		this.communityDescription$ = this.personalCommunities.selectedCommunity$$.pipe(
			this.mapData((community) => `${community?.description ?? ''}`),
		);
		this.totalMembersStr$ = this.personalCommunities.selectedCommunity$$.pipe(
			this.mapData(
				(community) => `${(community?.numberOfMembers ?? 0).toLocaleString(this.i18n.formatCurrentLocale()!)}`,
			),
		);
		this.leaderboard$ = combineLatest([this.selectedTab$$, this.personalCommunities.selectedCommunity$$]).pipe(
			tap(([selectedTab, community]) => console.debug('selectedTab', selectedTab, 'community', community)),
			filter(([selectedTab, community]) => !!community),
			this.mapData(([selectedTab, community]) => {
				const sourceLeaderboard = this.getSourceLeaderboard(selectedTab, community!);
				console.debug('sourceLeaderboard', sourceLeaderboard);
				const displayedLeaderboard = this.buildLeaderboard(sourceLeaderboard, selectedTab);
				console.debug('displayedLeaderboard', displayedLeaderboard);
				return displayedLeaderboard;
			}),
		);

		const allTabs = ['standard', 'wild', 'twist', 'battlegrounds', 'battlegrounds-duo'];
		this.tabs$ = this.selectedTab$$.pipe(
			this.mapData((selectedTab) =>
				allTabs.map((tab) => ({
					id: tab,
					name: this.buildTabName(tab),
					selected: tab === selectedTab,
				})),
			),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	private buildTabName(tab: string): string {
		switch (tab) {
			case 'standard':
				return this.i18n.translateString('global.format.standard')!;
			case 'wild':
				return this.i18n.translateString('global.format.wild')!;
			case 'twist':
				return this.i18n.translateString('global.format.twist')!;
			case 'battlegrounds':
				return this.i18n.translateString('global.game-mode.battlegrounds')!;
			case 'battlegrounds-duo':
				return this.i18n.translateString('global.game-mode.battlegrounds-duo')!;
			default:
				return 'Unknown';
		}
	}

	private buildLeaderboard(
		sourceLeaderboard: readonly LeaderboardEntry[] | null,
		selectedTab: string,
	): readonly InternalLeaderboardEntry[] {
		if (!sourceLeaderboard?.length) {
			return [];
		}

		const gameMode: StatGameModeType = this.toGameMode(selectedTab);
		const gameFormat: StatGameFormatType = this.toGameFormat(selectedTab);
		return sourceLeaderboard.map((entry) => {
			const rankStat: GameStat = {
				playerRank: entry.currentRank,
				gameMode: gameMode,
				gameFormat: gameFormat,
			} as GameStat;
			return {
				playerName: entry.displayName,
				playerRank: rankStat,
			};
		});
	}

	private toGameMode(selectedTab: string): StatGameModeType {
		switch (selectedTab) {
			case 'standard':
			case 'wild':
			case 'twist':
				return 'ranked';
			case 'battlegrounds':
				return 'battlegrounds';
			case 'battlegrounds-duo':
				return 'battlegrounds-duo';
			default:
				return 'ranked';
		}
	}

	private toGameFormat(selectedTab: string): StatGameFormatType {
		switch (selectedTab) {
			case 'standard':
				return 'standard';
			case 'wild':
				return 'wild';
			case 'twist':
				return 'standard';
			default:
				return 'wild';
		}
	}

	private getSourceLeaderboard(selectedTab: string, community: CommunityInfo): readonly LeaderboardEntry[] | null {
		switch (selectedTab) {
			case 'standard':
				return community.standardInfo?.leaderboard;
			case 'wild':
				return community.wildInfo?.leaderboard;
			case 'twist':
				return community.twistInfo?.leaderboard;
			case 'battlegrounds':
				return community.battlegroundsInfo?.leaderboard;
			case 'battlegrounds-duo':
				return community.battlegroundsDuoInfo?.leaderboard;
			default:
				return null;
		}
	}
}

interface Tab {
	id: string;
	name: string;
	selected?: boolean;
}

interface InternalLeaderboardEntry {
	playerName: string;
	playerRank: GameStat;
}
