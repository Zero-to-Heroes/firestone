import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CardIds } from '@firestone-hs/reference-data';
import { StatName } from '@firestone-hs/user-bgs-post-match-stats';
import { BgsFaceOffWithSimulation } from '../../../models/battlegrounds/bgs-face-off-with-simulation';
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
					<div class="label" [owTranslate]="'battlegrounds.in-game.face-offs.header.won'"></div>
					<div class="value">{{ wins }}</div>
				</div>
				<div class="cell">
					<div class="label" [owTranslate]="'battlegrounds.in-game.face-offs.header.lost'"></div>
					<div class="value">{{ losses }}</div>
				</div>
				<div class="cell">
					<div class="label" [owTranslate]="'battlegrounds.in-game.face-offs.header.tied'"></div>
					<div class="value">{{ ties }}</div>
				</div>
			</div>
			<stat-cell
				[label]="'app.battlegrounds.personal-stats.records.rows.total-dmg-dealt-minions' | owTranslate"
				[value]="totalMinionsDamageDealt"
				[isNewRecord]="isNewRecord('totalDamageDealtToMinions')"
			></stat-cell>
			<stat-cell
				[label]="'app.battlegrounds.personal-stats.records.rows.total-dmg-taken-minions' | owTranslate"
				[value]="totalMinionsDamageTaken"
				[isNewRecord]="isNewRecord('totalDamageTakenByMinions')"
			></stat-cell>
			<stat-cell
				[label]="'app.battlegrounds.personal-stats.records.rows.total-dmg-dealt-hero' | owTranslate"
				[tooltipText]="
					'app.battlegrounds.personal-stats.records.rows.total-dmg-dealt-hero-tooltip' | owTranslate
				"
				[value]="totalHeroDamageDealt"
				[isNewRecord]="isNewRecord('totalDamageDealtToHeroes')"
			></stat-cell>
			<stat-cell
				[label]="'app.battlegrounds.personal-stats.records.rows.max-dmg-dealt-hero' | owTranslate"
				[tooltipText]="'app.battlegrounds.personal-stats.records.rows.max-dmg-dealt-hero-tooltip' | owTranslate"
				[value]="maxSingleTurnHeroDamageDealt"
				[isNewRecord]="isNewRecord('maxDamageDealtToHero')"
			></stat-cell>
			<stat-cell
				[label]="'app.battlegrounds.personal-stats.records.rows.win-streak' | owTranslate"
				[value]="winStreak"
				[isNewRecord]="isNewRecord('highestWinStreak')"
			></stat-cell>
			<stat-cell
				[label]="'app.battlegrounds.personal-stats.records.rows.triples' | owTranslate"
				[value]="triples"
				[isNewRecord]="isNewRecord('triplesCreated')"
			></stat-cell>
			<stat-cell
				[label]="'app.battlegrounds.personal-stats.records.rows.board-stats' | owTranslate"
				[value]="maxBoardStats"
				[isNewRecord]="isNewRecord('maxBoardStats')"
				tooltipText="The maximum total stats (attack + health) of your board at the beginning of a battle"
			></stat-cell>
			<stat-cell
				[label]="'app.battlegrounds.personal-stats.records.rows.coins-wasted' | owTranslate"
				[value]="coinsWasted"
				[isNewRecord]="isNewRecord('coinsWasted')"
			></stat-cell>
			<stat-cell
				[label]="'app.battlegrounds.personal-stats.records.rows.rerolls' | owTranslate"
				[value]="rerolls"
				[isNewRecord]="isNewRecord('rerolls')"
			></stat-cell>
			<stat-cell
				[label]="'app.battlegrounds.personal-stats.records.rows.freezes' | owTranslate"
				[value]="freezes"
				[isNewRecord]="isNewRecord('freezes')"
			></stat-cell>
			<!-- hero power: only show if not a passive one -->
			<stat-cell
				*ngIf="heroPowers"
				[label]="'app.battlegrounds.personal-stats.records.rows.hero-power' | owTranslate"
				[value]="heroPowers"
				[isNewRecord]="isNewRecord('heroPowerUsed')"
			></stat-cell>
			<stat-cell
				[label]="'app.battlegrounds.personal-stats.records.rows.minions-bought' | owTranslate"
				[value]="minionsBought"
				[isNewRecord]="isNewRecord('minionsBought')"
			></stat-cell>
			<stat-cell
				[label]="'app.battlegrounds.personal-stats.records.rows.minions-sold' | owTranslate"
				[value]="minionsSold"
				[isNewRecord]="isNewRecord('minionsSold')"
			></stat-cell>
			<stat-cell
				[label]="'app.battlegrounds.personal-stats.records.rows.enemy-minions-killed' | owTranslate"
				[value]="minionsKilled"
				[isNewRecord]="isNewRecord('enemyMinionsKilled')"
			></stat-cell>
			<stat-cell
				[label]="'app.battlegrounds.personal-stats.records.rows.enemy-heroes-killed' | owTranslate"
				[value]="heroesKilled"
				[isNewRecord]="isNewRecord('enemyHeroesKilled')"
			></stat-cell>
			<stat-cell
				[label]="'app.battlegrounds.personal-stats.records.rows.battles-going-first' | owTranslate"
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
					{{ 'app.battlegrounds.personal-stats.records.rows.battle-luck' | owTranslate }}
					<a
						class="explain-link"
						href="https://github.com/Zero-to-Heroes/firestone/wiki/Battlegrounds-Battle-Luck-stat"
						[helpTooltip]="
							'app.battlegrounds.personal-stats.records.rows.battle-luck-explain-link-tooltip'
								| owTranslate
						"
						[owTranslate]="'app.battlegrounds.personal-stats.records.rows.battle-luck-explain-link'"
						target="_blank"
					></a>
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
	private _reviewId: string;
	private _faceOffs: readonly BgsFaceOffWithSimulation[];

	@Input() set stats(value: BgsPostMatchStatsPanel) {
		if (value === this._stats) {
			return;
		}
		this._stats = value;
		this.updateStats();
	}

	@Input() set reviewId(value: string) {
		this._reviewId = value;
		this.updateStats();
	}

	@Input() set faceOffs(value: readonly BgsFaceOffWithSimulation[]) {
		this._faceOffs = value;
		this.updateStats();
	}

	isNewRecord(statName: StatName): boolean {
		const isNewRecord =
			this?._stats?.newBestUserStats &&
			this?._reviewId &&
			this?._stats?.newBestUserStats.find((stat) => stat.statName === statName) != null &&
			this?._stats?.newBestUserStats.find((stat) => stat.statName === statName).reviewId === this._reviewId;

		return isNewRecord;
	}

	// When adding stats here, also add them to the api-compute-bgs-single-run-stats lambda
	private updateStats() {
		if (!this._stats?.player || !this._stats?.stats) {
			this.reset();
			return;
		}
		this.wins = this._faceOffs?.filter((faceOff) => faceOff.result === 'won')?.length || 0;
		this.losses = this._faceOffs?.filter((faceOff) => faceOff.result === 'lost')?.length || 0;
		this.ties = this._faceOffs?.filter((faceOff) => faceOff.result === 'tied')?.length || 0;

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
				.filter((info) => info.value.enemyHeroCardId !== CardIds.KelthuzadBattlegrounds)
				.map((info) => (info.value.value != null ? info.value.value : ((info.value as any) as number))); // For backward compatibilitymap(info => info.value);
			this.maxSingleTurnHeroDamageDealt = Math.max(...damageDealtToHero, this.maxSingleTurnHeroDamageDealt);
			this.totalHeroDamageDealt = damageDealtToHero.reduce((a, b) => a + b, 0);
		}
		this.triples = this._stats.stats.tripleTimings?.length;
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
			this._stats.player.cardId === CardIds.InfiniteTokiBattlegrounds ? rerolls - this.heroPowers : rerolls;
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
