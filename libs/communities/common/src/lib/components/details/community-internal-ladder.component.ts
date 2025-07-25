/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @angular-eslint/template/eqeqeq */
/* eslint-disable @angular-eslint/template/no-negated-async */
import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import {
	FriendlyBattle,
	FriendlyBattlePlayer,
	OPEN_SKILL_MEAN,
	OpenSkill,
	OpenSkillRating,
} from '@firestone-hs/communities';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { ILocalizationService, waitForReady } from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable, combineLatest, distinctUntilChanged, shareReplay, takeUntil, tap } from 'rxjs';
import { CommunityNavigationService } from '../../services/community-navigation.service';
import { PersonalCommunitiesService } from '../../services/personal-communities.service';
import { InternalFriendlyBattlePlayer } from './community-friendly-battle-player.component';
import { InternalFriendlyBattle } from './community-friendly-battle.component';
import { LadderEntry } from './community-internal-ladder-view.component';

@Component({
	standalone: false,
	selector: 'community-internal-ladder',
	styleUrls: [`./community-internal-ladder.component.scss`],
	template: `
		<div class="internal-ladder">
			<ul class="tabs">
				<div
					class="tab"
					*ngFor="let tab of tabs$ | async; trackBy: trackByTab"
					[ngClass]="{ selected: tab.selected }"
					(click)="selectTab(tab)"
				>
					<div class="text">{{ tab.name }}</div>
				</div>
			</ul>

			<div class="ladder-container">
				<div class="games">
					<community-friendly-battle
						class="game"
						*ngFor="let battle of friendlyBattles$ | async; trackBy: trackByBattle"
						[battle]="battle"
					></community-friendly-battle>
				</div>
				<div class="ladder">
					<community-internal-ladder-view [ladder]="ladder$ | async"></community-internal-ladder-view>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommunityInternalLadderComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	tabs$: Observable<readonly Tab[]>;
	friendlyBattles$: Observable<readonly InternalFriendlyBattle[]>;
	ladder$: Observable<readonly LadderEntry[]>;

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
		const selectedTab$ = this.selectedTab$$.pipe(
			distinctUntilChanged((a, b) => a === b),
			shareReplay(1),
			takeUntil(this.destroyed$),
		);

		const allTabs = ['standard', 'wild', 'twist'].map((tab) => ({
			id: tab,
			name: this.buildTabName(tab),
		}));
		this.tabs$ = selectedTab$.pipe(
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

		const battles$: Observable<readonly InternalFriendlyBattle[]> =
			this.personalCommunities.selectedCommunity$$.pipe(
				tap((info) => console.debug('building battles', info)),
				this.mapData(
					(community) =>
						community?.friendlyBattles?.battles?.map((battle) => this.buildFriendlyBattle(battle)) ?? [],
				),
			);
		this.friendlyBattles$ = combineLatest([battles$, selectedTab$]).pipe(
			this.mapData(([battles, selectedTab]) => {
				console.debug('battles', battles);
				return (battles ?? []).filter((battle) => this.isValidMode(battle, selectedTab));
			}),
			tap((info) => console.debug('built battles')),
		);
		this.ladder$ = combineLatest([this.personalCommunities.selectedCommunity$$, selectedTab$]).pipe(
			tap((info) => console.debug('building ladder', info)),
			this.mapData(([community, tab]) => {
				const rankings: {
					[battleTag: string]: OpenSkillRating;
				} = this.getRankings(community?.friendlyBattles.openSkill, tab);
				return this.buildLadder(rankings);
			}),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	trackByTab(index: number, item: Tab) {
		return item.id;
	}

	trackByBattle(index: number, item: InternalFriendlyBattle): number {
		return new Date(item.creationDate).getTime() ?? 0;
	}

	selectTab(tab: Tab) {
		this.selectedTab$$.next(tab.id);
	}

	private buildFriendlyBattle(battle: FriendlyBattle): InternalFriendlyBattle {
		const gameMode = 'ranked';
		const gameFormat = battle.gameFormat ?? 'standard';
		const result: InternalFriendlyBattle = {
			creationDate: battle.creationDate as any,
			gameFormat: gameFormat,
			gameMode: gameMode,
			player: this.buildFriendlyBattlePlayer(battle.players[0], gameMode, gameFormat, battle.winnerIndex === 0),
			opponent: this.buildFriendlyBattlePlayer(battle.players[1], gameMode, gameFormat, battle.winnerIndex === 1),
		};
		return result;
	}

	private buildFriendlyBattlePlayer(
		player: FriendlyBattlePlayer,
		gameMode: string,
		gameFormat: string,
		hasWon: boolean,
	): InternalFriendlyBattlePlayer {
		const result: InternalFriendlyBattlePlayer = {
			cardId: player.heroCardId,
			gameMode: gameMode,
			gameFormat: gameFormat,
			name: player.name,
			rank: player.rank,
			hasWon: hasWon,
		};
		return result;
	}

	private isValidMode(battle: InternalFriendlyBattle, selectedTab: string): boolean {
		switch (selectedTab) {
			case 'standard':
				return battle.gameFormat === 'standard';
			case 'wild':
				return battle.gameFormat === 'wild' || !battle.gameFormat;
			case 'twist':
				return battle.gameFormat === 'twist';
			default:
				return false;
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
			case 'arena':
				return this.i18n.translateString('global.game-mode.arena')!;
			default:
				return 'Unknown';
		}
	}

	private getRankings(openSkill: OpenSkill | undefined, tab: string): { [battleTag: string]: OpenSkillRating } {
		if (!openSkill) {
			return {};
		}
		switch (tab) {
			case 'wild':
				return openSkill.wild;
			case 'twist':
				return openSkill.twist;
			case 'standard':
			default:
				// Nackward-compatilibilty, mostly for tests
				return openSkill.standard ?? openSkill['ratings'];
		}
	}

	private buildLadder(rankings: { [battleTag: string]: OpenSkillRating }): readonly LadderEntry[] {
		return Object.keys(rankings)
			.map((battleTag) => {
				const internalRanking = rankings[battleTag];
				const ordinal = internalRanking.ordinal ?? internalRanking.sigma - 3 * internalRanking.mu;
				// Build a new skill centered around 25
				const ranking = (25 * (ordinal + OPEN_SKILL_MEAN)) / OPEN_SKILL_MEAN;
				const result: LadderEntry = {
					name: battleTag.split('#')[0],
					mu: internalRanking.mu,
					sigma: internalRanking.sigma,
					ordinal: ordinal,
					totalGames: internalRanking.totalGames,
					ranking: ranking,
				};
				return result;
			})
			.sort((a, b) => b.ranking - a.ranking);
	}
}

interface Tab {
	id: string;
	name: string;
	selected?: boolean;
}
