import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { StatName } from '@firestone-hs/compute-bgs-run-stats/dist/model/stat-name.type';
import { CardIds } from '@firestone-hs/reference-data';
import { BgsGame } from '../../../models/battlegrounds/bgs-game';
import { BgsPostMatchStatsPanel } from '../../../models/battlegrounds/post-match/bgs-post-match-stats-panel';

@Component({
	selector: 'bgs-post-match-stats-recap',
	styleUrls: [
		`../../../../css/global/reset-styles.scss`,
		`../../../../css/component/battlegrounds/post-match/bgs-post-match-stats-recap.component.scss`,
		`../../../../css/global/scrollbar.scss`,
	],
	template: `
		<div class="stats-recap" scrollable>
			<div class="entry face-offs" *ngIf="wins || losses || ties">
				<div class="cell">
					<div class="label">Won</div>
					<div class="value">{{ wins }}</div>
				</div>
				<div class="cell">
					<div class="label">Lost</div>
					<div class="value">{{ losses }}</div>
				</div>
				<div class="cell">
					<div class="label">Tied</div>
					<div class="value">{{ ties }}</div>
				</div>
			</div>
			<stat-cell
				label="Total dmg dealt (minions)"
				[value]="totalMinionsDamageDealt"
				[isNewRecord]="isNewRecord('totalDamageDealtToMinions')"
			></stat-cell>
			<stat-cell
				label="Total dmg taken (minions)"
				[value]="totalMinionsDamageTaken"
				[isNewRecord]="isNewRecord('totalDamageTakenByMinions')"
			></stat-cell>
			<stat-cell
				label="Total dmg dealt (hero)"
				helpTooltip="Doesn't include fights against the ghost"
				[value]="totalHeroDamageDealt"
				[isNewRecord]="isNewRecord('totalDamageDealtToHeroes')"
			></stat-cell>
			<stat-cell
				label="Max dmg dealt (hero)"
				helpTooltip="Doesn't include fights against the ghost"
				[value]="maxSingleTurnHeroDamageDealt"
				[isNewRecord]="isNewRecord('maxDamageDealtToHero')"
			></stat-cell>
			<stat-cell
				label="Highest Win streak"
				[value]="winStreak"
				[isNewRecord]="isNewRecord('highestWinStreak')"
			></stat-cell>
			<stat-cell
				label="Triples created"
				[value]="triples"
				[isNewRecord]="isNewRecord('triplesCreated')"
			></stat-cell>
			<stat-cell
				label="Max board stats"
				[value]="maxBoardStats"
				[isNewRecord]="isNewRecord('maxBoardStats')"
				tooltipText="The maximum total stats (attack + health) of your board at the beginning of a battle"
			></stat-cell>
			<stat-cell
				label="Coins wasted"
				[value]="coinsWasted"
				[isNewRecord]="isNewRecord('coinsWasted')"
			></stat-cell>
			<stat-cell label="Rerolls" [value]="rerolls" [isNewRecord]="isNewRecord('rerolls')"></stat-cell>
			<stat-cell label="Freezes" [value]="freezes" [isNewRecord]="isNewRecord('freezes')"></stat-cell>
			<!-- hero power: only show if not a passive one -->
			<stat-cell
				*ngIf="heroPowers"
				label="Hero Power used"
				[value]="heroPowers"
				[isNewRecord]="isNewRecord('heroPowerUsed')"
			></stat-cell>
			<stat-cell
				label="Minions bought"
				[value]="minionsBought"
				[isNewRecord]="isNewRecord('minionsBought')"
			></stat-cell>
			<stat-cell
				label="Minions sold"
				[value]="minionsSold"
				[isNewRecord]="isNewRecord('minionsSold')"
			></stat-cell>
			<stat-cell
				label="Enemy Minions killed"
				[value]="minionsKilled"
				[isNewRecord]="isNewRecord('enemyMinionsKilled')"
			></stat-cell>
			<stat-cell
				label="Enemy Heroes killed"
				[value]="heroesKilled"
				[isNewRecord]="isNewRecord('enemyHeroesKilled')"
			></stat-cell>
			<stat-cell
				label="Battles going first"
				[value]="percentageOfBattlesGoingFirst?.toFixed(1) + '%'"
				[isNewRecord]="isNewRecord('percentageOfBattlesGoingFirst')"
			></stat-cell>
			<div class="entry cell battle-luck" [ngClass]="{ 'new-record': isNewRecord('battleLuck') }">
				<div class="record-icon">
					<svg class="svg-icon-fill">
						<use xlink:href="assets/svg/sprite.svg#new_record" />
					</svg>
				</div>
				<div class="label">
					Battle luck
					<a
						class="explain-link"
						href="https://github.com/Zero-to-Heroes/firestone/wiki/Battlegrounds-Battle-Luck-stat"
						helpTooltip="An indicator that tells you how lucky you were in your battles during the run. Click for more info"
						target="_blank"
						>What is this?</a
					>
				</div>
				<div class="value">{{ luckFactor?.toFixed(1) }}%</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsPostMatchStatsRecapComponent {
	wins: number;
	losses: number;
	ties: number;

	totalMinionsDamageDealt: number;
	totalMinionsDamageTaken: number;
	totalHeroDamageDealt = 0;
	maxSingleTurnHeroDamageDealt = 0;
	winStreak: number;
	triples: number;
	maxBoardStats: number;
	coinsWasted: number;
	rerolls: number;
	freezes: number;
	heroPowers: number;
	minionsBought: number;
	minionsSold: number;
	minionsKilled: number;
	heroesKilled: number;
	percentageOfBattlesGoingFirst: number;
	luckFactor: number;

	private _stats: BgsPostMatchStatsPanel;
	private _game: BgsGame;

	@Input() set stats(value: BgsPostMatchStatsPanel) {
		//console.log('triples 1', this.triples, value);
		if (value === this._stats) {
			//console.log('same value, returning');
			return;
		}
		this._stats = value;
		this.updateStats();
	}

	@Input() set game(value: BgsGame) {
		if (value === this._game) {
			return;
		}
		this._game = value;
		this.updateStats();
	}

	isNewRecord(statName: StatName): boolean {
		const isNewRecord =
			this?._stats?.newBestUserStats &&
			this?._game?.reviewId &&
			this?._stats?.newBestUserStats.find((stat) => stat.statName === statName) != null &&
			this?._stats?.newBestUserStats.find((stat) => stat.statName === statName).reviewId === this._game.reviewId;
		// console.log('isNewRecord', statName, isNewRecord, this._stats);
		return isNewRecord;
	}

	// When adding stats here, also add them to the api-compute-bgs-single-run-stats lambda
	private updateStats() {
		if (!this._stats?.player || !this._stats?.stats) {
			// console.warn('[stats-recap] missing player', this._stats?.player, this._stats?.stats);
			this.reset();
			return;
		}
		this.wins = this._game?.faceOffs?.filter((faceOff) => faceOff.result === 'won')?.length || 0;
		this.losses = this._game?.faceOffs?.filter((faceOff) => faceOff.result === 'lost')?.length || 0;
		this.ties = this._game?.faceOffs?.filter((faceOff) => faceOff.result === 'tied')?.length || 0;

		this.winStreak = this._stats.player.highestWinStreak;
		this.totalMinionsDamageDealt = Object.keys(this._stats.stats.totalMinionsDamageDealt)
			.filter((cardId) => cardId !== this._stats.player.cardId)
			.map((cardId) => this._stats.stats.totalMinionsDamageDealt[cardId])
			.reduce((a, b) => a + b, 0);
		this.totalMinionsDamageTaken = Object.keys(this._stats.stats.totalMinionsDamageTaken)
			.filter((cardId) => cardId !== this._stats.player.cardId)
			.map((cardId) => this._stats.stats.totalMinionsDamageTaken[cardId])
			.reduce((a, b) => a + b, 0);
		if (this._stats.stats.damageToEnemyHeroOverTurn) {
			const damageDealtToHero = this._stats.stats.damageToEnemyHeroOverTurn
				.filter((info) => info.value.enemyHeroCardId !== CardIds.NonCollectible.Neutral.KelthuzadTavernBrawl2)
				.map((info) => (info.value.value != null ? info.value.value : ((info.value as any) as number))); // For backward compatibilitymap(info => info.value);
			this.maxSingleTurnHeroDamageDealt = Math.max(...damageDealtToHero, this.maxSingleTurnHeroDamageDealt);
			this.totalHeroDamageDealt = damageDealtToHero.reduce((a, b) => a + b, 0);
		}
		this.triples = this._stats.stats.tripleTimings?.length;
		//console.log('triples2', this.triples, this._stats);
		// console.error('should reactivated coins wasted');
		this.coinsWasted = this._stats.stats.coinsWastedOverTurn.map((value) => value.value).reduce((a, b) => a + b, 0);
		this.freezes = this._stats.stats.freezesOverTurn.map((value) => value.value).reduce((a, b) => a + b, 0);
		this.minionsBought = this._stats.stats.minionsBoughtOverTurn
			.map((value) => value.value)
			.reduce((a, b) => a + b, 0);
		this.minionsSold = this._stats.stats.minionsSoldOverTurn.map((value) => value.value).reduce((a, b) => a + b, 0);
		this.heroPowers = this._stats.stats.mainPlayerHeroPowersOverTurn
			.map((value) => value.value)
			.reduce((a, b) => a + b, 0);
		this.maxBoardStats = Math.max(0, Math.max(...this._stats.stats.totalStatsOverTurn.map((stat) => stat.value)));
		// Hack for Toki, to avoid counting the hero power as a refresh (even though it technically
		// is a refresh)
		const rerolls = this._stats.stats.rerollsOverTurn.map((value) => value.value).reduce((a, b) => a + b, 0);
		this.rerolls =
			this._stats.player.cardId === CardIds.NonCollectible.Neutral.InfiniteTokiTavernBrawl
				? rerolls - this.heroPowers
				: rerolls;
		this.minionsKilled = this._stats.stats.totalEnemyMinionsKilled;
		this.heroesKilled = this._stats.stats.totalEnemyHeroesKilled;
		const battlesGoingFirst = this._stats.stats.wentFirstInBattleOverTurn.filter((value) => value.value === true)
			.length;
		const battlesGoingSecond = this._stats.stats.wentFirstInBattleOverTurn.filter((value) => value.value === false)
			.length;
		this.percentageOfBattlesGoingFirst =
			this._stats.stats.wentFirstInBattleOverTurn.length === 0
				? 0
				: (100 * battlesGoingFirst) / (battlesGoingFirst + battlesGoingSecond);
		this.luckFactor = 100 * this._stats.stats.luckFactor;
	}

	private reset() {
		this.wins = undefined;
		this.losses = undefined;
		this.ties = undefined;
		this.totalMinionsDamageDealt = undefined;
		this.totalMinionsDamageTaken = undefined;
		this.totalHeroDamageDealt = undefined;
		this.winStreak = undefined;
		this.triples = undefined;
		this.maxBoardStats = undefined;
		this.coinsWasted = undefined;
		this.rerolls = undefined;
		this.freezes = undefined;
		this.heroPowers = undefined;
		this.minionsBought = undefined;
		this.minionsSold = undefined;
		this.minionsKilled = undefined;
		this.heroesKilled = undefined;
		this.percentageOfBattlesGoingFirst = undefined;
		this.luckFactor = undefined;
	}
}
