import { ComponentType } from '@angular/cdk/portal';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Entity } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { getTribeIcon } from '@firestone-hs/reference-data';
import { BgsBoard, BgsPlayer, QuestReward } from '@firestone/game-state';
import {
	TwitchBgsBoard,
	TwitchBgsHeroOverviewComponent,
	TwitchBgsPlayer,
	TwitchBgsStateConfig,
	TwitchOpponentOverviewInput,
} from '@firestone/twitch/common';
import { fromJS } from 'immutable';

@Component({
	standalone: false,
	selector: 'leaderboard-empty-card',
	styleUrls: ['../../../../../css/component/decktracker/overlay/twitch/leaderboard-empty-card.component.scss'],
	template: `
		<div
			class="card"
			componentTooltip
			[componentType]="componentType"
			[componentInput]="_bgsPlayer"
			[componentTooltipPosition]="position"
		>
			<!-- transparent image with 1:1 intrinsic aspect ratio -->
			<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" />

			<bgs-hero-short-recap
				class="short-recap"
				[ngClass]="{ active: _showLiveInfo }"
				[tavernTier]="tavernTier"
				[triples]="triples"
				[winStreak]="winStreak"
				[tribeImage]="tribeImage"
				[tribeCount]="tribeCount"
				[damage]="damage"
				[questRewards]="questRewards"
				[buddiesEnabled]="_config?.hasBuddies"
				[buddyImage]="buddyImage"
				[buddyClass]="buddyClass"
				[lesserTrinket]="lesserTrinket"
				[greaterTrinket]="greaterTrinket"
			></bgs-hero-short-recap>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeaderboardEmptyCardComponent {
	componentType: ComponentType<any> = TwitchBgsHeroOverviewComponent;

	@Input() position: 'global-top-center' | 'right' = 'right';
	@Input() set showLiveInfo(value: boolean) {
		// console.log('shiwing live info?', value);
		this._showLiveInfo = value;
	}

	@Input() set currentTurn(value: number) {
		if (this._currentTurn === value) {
			return;
		}
		this._currentTurn = value;
		this.updateInfo();
	}

	@Input() set bgsPlayer(value: TwitchBgsPlayer | BgsPlayer) {
		if (this._previousPlayer === value) {
			return;
		}
		this._previousPlayer = value;
		this.updateInfo();
	}

	@Input() set config(value: TwitchBgsStateConfig) {
		this._config = value;
		this.updateInfo();
	}

	_bgsPlayer: TwitchOpponentOverviewInput;

	_previousPlayer: TwitchBgsPlayer | BgsPlayer;
	_currentTurn: number;
	_showLiveInfo: boolean;
	_config: TwitchBgsStateConfig;
	tavernTier: number;
	triples: number;
	winStreak: number;
	tribeImage: string;
	tribeCount: number;
	damage: number;
	questRewards: readonly QuestReward[];

	buddyImage: string;
	buddyClass: string;
	lesserTrinket: string;
	greaterTrinket: string;

	private updateInfo() {
		if (!this._previousPlayer) {
			return;
		}
		const boardHistory = this.extractBoardHistory();
		this._bgsPlayer = {
			player: BgsPlayer.create({
				cardId: this._previousPlayer.cardId,
				heroPowerCardId: this._previousPlayer.heroPowerCardId,
				initialHealth: this._previousPlayer.initialHealth,
				damageTaken: this._previousPlayer.damageTaken,
				isMainPlayer: this._previousPlayer.isMainPlayer,
				name: this._previousPlayer.name,
				leaderboardPlace: this._previousPlayer.leaderboardPlace,
				tavernUpgradeHistory: this._previousPlayer.tavernUpgradeHistory,
				tripleHistory: this._previousPlayer.tripleHistory,
				boardHistory: boardHistory,
				questRewards: this._previousPlayer.questRewards,
				buddyTurns: this._previousPlayer.buddyTurns,
				lesserTrinket: this._previousPlayer.lesserTrinket,
				greaterTrinket: this._previousPlayer.greaterTrinket,
			} as BgsPlayer),
			config: {
				hasBuddies: this._config?.hasBuddies,
			},
			currentTurn: this._currentTurn,
			showLogo: false,
		};
		console.debug('showing player', this._bgsPlayer);
		this.questRewards = this._bgsPlayer.player.questRewards;
		this.tavernTier = [...(this._previousPlayer.tavernUpgradeHistory ?? [])].pop()?.tavernTier ?? 1;
		this.triples = (this._previousPlayer.tripleHistory ?? []).length;
		this.winStreak = this._previousPlayer.currentWinStreak;
		const lastKnownComposition = (this._previousPlayer as BgsPlayer).getLastKnownComposition
			? (this._previousPlayer as BgsPlayer).getLastKnownComposition()
			: (this._previousPlayer as TwitchBgsPlayer).lastKnownComposition;
		const tribe = lastKnownComposition?.tribe;
		// The game doesn't show any count when it's mixed minions
		this.tribeCount = tribe === 'mixed' ? null : lastKnownComposition?.count ?? 0;
		this.tribeImage = getTribeIcon(tribe);
		const lastKnownBattleHistory = (this._previousPlayer as BgsPlayer).getLastKnownBattleHistory
			? (this._previousPlayer as BgsPlayer).getLastKnownBattleHistory()
			: (this._previousPlayer as TwitchBgsPlayer).lastKnownBattleHistory;
		this.damage = lastKnownBattleHistory?.damage ?? 0;
		if (this.winStreak === 0 && this.damage > 0) {
			this.damage = -this.damage;
		}

		const buddyImageRoot = `https://static.zerotoheroes.com/hearthstone/asset/firestone/images`;
		this.buddyImage =
			this._previousPlayer.buddyTurns?.length > 1
				? `${buddyImageRoot}/bgs_buddies_meter_frame_golden.png`
				: `${buddyImageRoot}/bgs_buddies_meter_frame.png`;
		this.buddyClass = this._previousPlayer.buddyTurns?.length === 0 ? 'missing' : '';
		this.lesserTrinket = this._previousPlayer.lesserTrinket;
		this.greaterTrinket = this._previousPlayer.greaterTrinket;
	}

	private extractBoardHistory(): readonly BgsBoard[] {
		if ((this._previousPlayer as TwitchBgsPlayer).lastBoard) {
			return this.buildBoardHistory((this._previousPlayer as TwitchBgsPlayer).lastBoard);
		}
		if ((this._previousPlayer as BgsPlayer).boardHistory?.length) {
			return (this._previousPlayer as BgsPlayer).boardHistory;
		}
		return [];
	}

	private buildBoardHistory(lastBoard: TwitchBgsBoard): readonly BgsBoard[] {
		if (!lastBoard) {
			return [];
		}
		return [
			{
				turn: lastBoard.turn,
				board: lastBoard.board.map(
					(entity) =>
						({
							id: entity.id,
							cardID: entity.cardID,
							tags: fromJS(entity.tags),
						} as Entity),
				),
			} as BgsBoard,
		];
	}
}
