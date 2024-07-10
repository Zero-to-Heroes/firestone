/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @angular-eslint/template/eqeqeq */
/* eslint-disable @angular-eslint/template/no-negated-async */
import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { CommunityInfo, LeaderboardEntry, LeaderboardEntryArena } from '@firestone-hs/communities';
import { StatGameFormatType, StatGameModeType } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent, deepEqual } from '@firestone/shared/framework/common';
import { ILocalizationService, waitForReady } from '@firestone/shared/framework/core';
import { GameStat } from '@firestone/stats/data-access';
import { BehaviorSubject, Observable, combineLatest, distinctUntilChanged, filter, tap } from 'rxjs';
import { CommunityNavigationService } from '../services/community-navigation.service';
import { PersonalCommunitiesService } from '../services/personal-communities.service';

@Component({
	selector: 'community-details',
	styleUrls: [`./community-details.component.scss`],
	template: `
		<div class="community-details">
			<div class="overview">
				<div class="overview-cartouche">
					<div class="community-name">{{ communityName$ | async }}</div>
					<div class="community-description">{{ communityDescription$ | async }}</div>
					<div class="total-members">
						<span class="value">{{ totalMembersStr$ | async }}</span>
						<span class="label" [fsTranslate]="'app.communities.details.total-members'"></span>
					</div>
					<div class="recent-games">
						<span class="value">{{ totalGamesLastWeekStr$ | async }}</span>
						<span class="label">{{ gamesPlayedLabel }}</span>
					</div>
				</div>
				<div
					class="leave-community-button"
					[fsTranslate]="'app.communities.leave-community-button'"
					(click)="leaveCommunity()"
				></div>
			</div>
			<div class="leaderboards">
				<div class="header" [fsTranslate]="'app.communities.details.leaderboards.header'"></div>
				<ul class="tabs">
					<div class="tab" *ngFor="let tab of tabs$ | async" [ngClass]="{ selected: tab.selected }">
						<div class="text" (click)="selectTab(tab)">{{ tab.name }}</div>
					</div>
				</ul>
				<div class="leaderboard" *ngIf="leaderboard$ | async as leaderboard">
					<div class="leaderboard-header">
						<div class="cell rank" [fsTranslate]="'app.communities.details.leaderboards.rank-header'"></div>
						<div
							class="cell player-rank"
							[fsTranslate]="'app.communities.details.leaderboards.rating-header'"
						></div>
						<div
							class="cell runs-completed"
							[fsTranslate]="'app.communities.details.leaderboards.runs-completed-header'"
							*ngIf="showRunsCompleted$ | async"
						></div>
						<div
							class="cell player-name"
							[fsTranslate]="'app.communities.details.leaderboards.name-header'"
						></div>
					</div>
					<div class="leaderboard-entry" *ngFor="let entry of leaderboard">
						<div class="cell rank">{{ entry.rank }}</div>
						<rank-image class="cell player-rank" [stat]="entry.playerRank"></rank-image>
						<div class="cell runs-completed" *ngIf="showRunsCompleted$ | async">
							{{ entry.runsCompleted }}
						</div>
						<div class="cell player-name">{{ entry.playerName }}</div>
					</div>
				</div>
				<div
					class="leaderboard empty"
					*ngIf="!(leaderboard$ | async)?.length"
					[fsTranslate]="'app.communities.details.leaderboards.empty-leaderboard'"
				></div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommunityDetailsComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	communityName$: Observable<string>;
	communityDescription$: Observable<string>;
	totalMembersStr$: Observable<string>;
	totalGamesLastWeekStr$: Observable<string>;
	showRunsCompleted$: Observable<boolean>;
	tabs$: Observable<readonly Tab[]>;
	leaderboard$: Observable<readonly InternalLeaderboardEntry[] | null>;

	gamesPlayedLabel = this.i18n.translateString('app.communities.details.games-played', { value: 7 })!;

	private communityId: string | undefined;
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
		this.totalGamesLastWeekStr$ = this.personalCommunities.selectedCommunity$$.pipe(
			this.mapData(
				(community) =>
					`${(community?.gamesInLastSevenDays ?? 0).toLocaleString(this.i18n.formatCurrentLocale()!)}`,
			),
		);
		const selectedTab$ = this.selectedTab$$.pipe(this.mapData((selectedTab) => selectedTab));
		this.leaderboard$ = combineLatest([selectedTab$, this.personalCommunities.selectedCommunity$$]).pipe(
			distinctUntilChanged((a, b) => deepEqual(a, b)),
			tap(([selectedTab, community]) => console.debug('selectedTab', selectedTab, 'community', community)),
			filter(([selectedTab, community]) => !!community),
			this.mapData(([selectedTab, community]) => {
				const sourceLeaderboard = this.getSourceLeaderboard(selectedTab, community!);
				console.debug('sourceLeaderboard', sourceLeaderboard);
				const displayedLeaderboard = this.buildLeaderboard(sourceLeaderboard, selectedTab);
				console.debug('displayedLeaderboard', displayedLeaderboard);
				return !!displayedLeaderboard?.length ? displayedLeaderboard : null;
			}),
		);

		const allTabs = ['standard', 'wild', 'twist', 'battlegrounds', 'battlegrounds-duo', 'arena'];
		this.tabs$ = selectedTab$.pipe(
			this.mapData((selectedTab) =>
				allTabs.map((tab) => ({
					id: tab,
					name: this.buildTabName(tab),
					selected: tab === selectedTab,
				})),
			),
		);
		this.showRunsCompleted$ = selectedTab$.pipe(this.mapData((selectedTab) => selectedTab === 'arena'));
		this.personalCommunities.selectedCommunity$$
			.pipe(this.mapData((c) => c?.id))
			.subscribe((id) => (this.communityId = id));

		// this.personalCommunities.refreshCurrentCommunity();

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	selectTab(tab: Tab) {
		this.selectedTab$$.next(tab.id);
	}

	leaveCommunity() {
		this.personalCommunities.leaveCommunity(this.communityId!);
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
			case 'arena':
				return this.i18n.translateString('global.game-mode.arena')!;
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
		return sourceLeaderboard.map((entry, index) => {
			const rankStat: GameStat = {
				playerRank: gameMode === 'arena' ? parseFloat(entry.currentRank).toFixed(2) : entry.currentRank,
				gameMode: gameMode,
				gameFormat: gameFormat,
			} as GameStat;
			const runsCompleted = !!(entry as LeaderboardEntryArena)?.runsPerDay
				? Object.values((entry as LeaderboardEntryArena).runsPerDay).flatMap((runs) => runs).length
				: null;
			return {
				rank: index + 1,
				playerName: entry.displayName,
				playerRank: rankStat,
				runsCompleted: runsCompleted,
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
			case 'arena':
				return 'arena';
			default:
				return selectedTab as StatGameModeType;
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
			case 'arena':
				return community.arenaInfo?.leaderboard;
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
	rank: number;
	playerName: string;
	playerRank: GameStat;
	runsCompleted?: number | null;
}
