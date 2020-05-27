import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BgsGame } from '../../../models/battlegrounds/bgs-game';
import { BgsPostMatchStatsPanel } from '../../../models/battlegrounds/post-match/bgs-post-match-stats-panel';

declare let amplitude: any;

@Component({
	selector: 'bgs-post-match-stats-recap',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/battlegrounds/post-match/bgs-post-match-stats-recap.component.scss`,
		`../../../../css/global/scrollbar.scss`,
	],
	template: `
		<div class="stats-recap" scrollable>
			<div class="entry face-offs">
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
			<div class="entry cell">
				<div class="label">Total dmg dealt (minions)</div>
				<div class="value">{{ totalMinionsDamageDealt }}</div>
			</div>
			<div class="entry cell">
				<div class="label">Total dmg taken (minions)</div>
				<div class="value">{{ totalMinionsDamageTaken }}</div>
			</div>
			<div class="entry cell">
				<div class="label">Total dmg dealt (hero)</div>
				<div class="value">{{ totalHeroDamageDealt }}</div>
			</div>
			<div class="entry cell">
				<div class="label">Highest Win streak</div>
				<div class="value">{{ winStreak }}</div>
			</div>
			<div class="entry cell">
				<div class="label">Triples created</div>
				<div class="value">{{ triples }}</div>
			</div>
			<div class="entry cell">
				<div class="label">Coins wasted</div>
				<div class="value">{{ coinsWasted }}</div>
			</div>
			<div class="entry cell">
				<div class="label">Rerolls</div>
				<div class="value">{{ rerolls }}</div>
			</div>
			<div class="entry cell">
				<div class="label">Freezes</div>
				<div class="value">{{ freezes }}</div>
			</div>
			<!-- hero power: only show if not a passive one -->
			<div class="entry cell" *ngIf="heroPowers">
				<div class="label">Hero Power used</div>
				<div class="value">{{ heroPowers }}</div>
			</div>
			<div class="entry cell">
				<div class="label">Minions bought</div>
				<div class="value">{{ minionsBought }}</div>
			</div>
			<div class="entry cell">
				<div class="label">Minions sold</div>
				<div class="value">{{ minionsSold }}</div>
			</div>
			<div class="entry cell">
				<div class="label">Enemy Minions killed</div>
				<div class="value">{{ minionsKilled }}</div>
			</div>
			<div class="entry cell">
				<div class="label">Enemy Heroes killed</div>
				<div class="value">{{ heroesKilled }}</div>
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
	totalHeroDamageDealt: number;
	winStreak: number;
	triples: number;
	coinsWasted: number;
	rerolls: number;
	freezes: number;
	heroPowers: number;
	minionsBought: number;
	minionsSold: number;
	minionsKilled: number;
	heroesKilled: number;

	private _stats: BgsPostMatchStatsPanel;
	private _game: BgsGame;

	@Input() set stats(value: BgsPostMatchStatsPanel) {
		this._stats = value;
		this.updateStats();
	}

	@Input() set game(value: BgsGame) {
		this._game = value;
		this.updateStats();
	}

	private updateStats() {
		if (!this._stats?.player || !this._game) {
			return;
		}
		this.wins = this._game.faceOffs.filter(faceOff => faceOff.result === 'won').length || 0;
		this.losses = this._game.faceOffs.filter(faceOff => faceOff.result === 'lost').length || 0;
		this.ties = this._game.faceOffs.filter(faceOff => faceOff.result === 'tied').length || 0;
		this.winStreak = this._stats.player.highestWinStreak;
		this.totalMinionsDamageDealt = Object.keys(this._stats.stats.totalMinionsDamageDealt)
			.filter(cardId => cardId !== this._game.getMainPlayer().cardId)
			.map(cardId => this._stats.stats.totalMinionsDamageDealt[cardId])
			.reduce((a, b) => a + b, 0);
		this.totalMinionsDamageTaken = Object.keys(this._stats.stats.totalMinionsDamageTaken)
			.filter(cardId => cardId !== this._game.getMainPlayer().cardId)
			.map(cardId => this._stats.stats.totalMinionsDamageTaken[cardId])
			.reduce((a, b) => a + b, 0);
		this.totalHeroDamageDealt = Object.keys(this._stats.stats.totalMinionsDamageDealt)
			.filter(cardId => cardId === this._game.getMainPlayer().cardId)
			.map(cardId => this._stats.stats.totalMinionsDamageDealt[cardId])
			.reduce((a, b) => a + b, 0);
		this.triples = this._game.getMainPlayer().tripleHistory.length;
		this.coinsWasted = this._stats.stats.coinsWastedOverTurn.map(value => value.value).reduce((a, b) => a + b, 0);
		this.rerolls = this._stats.stats.rerollsOverTurn.map(value => value.value).reduce((a, b) => a + b, 0);
		this.freezes = this._stats.stats.freezesOverTurn.map(value => value.value).reduce((a, b) => a + b, 0);
		this.minionsBought = this._stats.stats.minionsBoughtOverTurn
			.map(value => value.value)
			.reduce((a, b) => a + b, 0);
		this.minionsSold = this._stats.stats.minionsSoldOverTurn.map(value => value.value).reduce((a, b) => a + b, 0);
		this.heroPowers = this._stats.stats.mainPlayerHeroPowersOverTurn
			.map(value => value.value)
			.reduce((a, b) => a + b, 0);
		this.minionsKilled = this._stats.stats.totalEnemyMinionsKilled;
		this.heroesKilled = this._stats.stats.totalEnemyHeroesKilled;
	}
}
