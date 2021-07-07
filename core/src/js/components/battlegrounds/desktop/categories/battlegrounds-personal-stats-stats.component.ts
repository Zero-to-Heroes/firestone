import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	EventEmitter,
	Input,
} from '@angular/core';
import { BattlegroundsPersonalStatsCategory } from '../../../../models/mainwindow/battlegrounds/categories/battlegrounds-personal-stats-category';
import { StatsState } from '../../../../models/mainwindow/stats/stats-state';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../../services/overwolf.service';

@Component({
	selector: 'battlegrounds-personal-stats-stats',
	styleUrls: [
		`../../../../../css/global/components-global.scss`,
		`../../../../../css/component/battlegrounds/desktop/categories/battlegrounds-personal-stats-stats.component.scss`,
	],
	template: `
		<div class="header">
			<div class="label">
				<div class="record-icon">
					<svg class="svg-icon-fill">
						<use xlink:href="assets/svg/sprite.svg#new_record" />
					</svg>
				</div>
				Record
			</div>
			<div class="filler"></div>
			<div class="hero">Hero</div>
			<div class="replay">Replay</div>
			<div class="value">Score</div>
		</div>
		<div class="stats-recap" scrollable>
			<stat-cell
				label="Total dmg dealt (minions)"
				[value]="totalMinionsDamageDealt.value"
				[heroIcon]="totalMinionsDamageDealt.hero"
				[reviewId]="totalMinionsDamageDealt.reviewId"
			></stat-cell>
			<stat-cell
				label="Total dmg taken (minions)"
				[value]="totalMinionsDamageTaken.value"
				[heroIcon]="totalMinionsDamageTaken.hero"
				[reviewId]="totalMinionsDamageTaken.reviewId"
			></stat-cell>
			<stat-cell
				label="Total dmg dealt (hero)"
				tooltipText="Doesn't include fights against the ghost"
				[value]="totalHeroDamageDealt.value"
				[heroIcon]="totalHeroDamageDealt.hero"
				[reviewId]="totalHeroDamageDealt.reviewId"
			></stat-cell>
			<stat-cell
				label="Max dmg dealt (hero)"
				tooltipText="Doesn't include fights against the ghost"
				[value]="maxSingleTurnHeroDamageDealt.value"
				[heroIcon]="maxSingleTurnHeroDamageDealt.hero"
				[reviewId]="maxSingleTurnHeroDamageDealt.reviewId"
			></stat-cell>
			<stat-cell
				label="Highest Win streak"
				[value]="winStreak.value"
				[heroIcon]="winStreak.hero"
				[reviewId]="winStreak.reviewId"
			></stat-cell>
			<stat-cell
				label="Triples created"
				[value]="triples.value"
				[heroIcon]="triples.hero"
				[reviewId]="triples.reviewId"
			></stat-cell>
			<stat-cell
				label="Max board stats"
				[value]="maxBoardStats.value"
				[heroIcon]="maxBoardStats.hero"
				[reviewId]="maxBoardStats.reviewId"
				tooltipText="The maximum total stats (attack + health) of your board at the beginning of a battle"
			></stat-cell>
			<stat-cell
				label="Coins wasted"
				[value]="coinsWasted.value"
				[heroIcon]="coinsWasted.hero"
				[reviewId]="coinsWasted.reviewId"
			></stat-cell>
			<stat-cell
				label="Rerolls"
				[value]="rerolls.value"
				[heroIcon]="rerolls.hero"
				[reviewId]="rerolls.reviewId"
			></stat-cell>
			<stat-cell
				label="Freezes"
				[value]="freezes.value"
				[heroIcon]="freezes.hero"
				[reviewId]="freezes.reviewId"
			></stat-cell>
			<stat-cell
				label="Hero Power used"
				[value]="heroPowers.value"
				[heroIcon]="heroPowers.hero"
				[reviewId]="heroPowers.reviewId"
			></stat-cell>
			<stat-cell
				label="Minions bought"
				[value]="minionsBought.value"
				[heroIcon]="minionsBought.hero"
				[reviewId]="minionsBought.reviewId"
			></stat-cell>
			<stat-cell
				label="Minions sold"
				[value]="minionsSold.value"
				[heroIcon]="minionsSold.hero"
				[reviewId]="minionsSold.reviewId"
			></stat-cell>
			<stat-cell
				label="Enemy Minions killed"
				[value]="minionsKilled.value"
				[heroIcon]="minionsKilled.hero"
				[reviewId]="minionsKilled.reviewId"
			></stat-cell>
			<stat-cell
				label="Enemy Heroes killed"
				[value]="heroesKilled.value"
				[heroIcon]="heroesKilled.hero"
				[reviewId]="heroesKilled.reviewId"
			></stat-cell>
			<stat-cell
				label="Battles going first"
				[value]="percentageOfBattlesGoingFirst.value?.toFixed(1) + '%'"
				[heroIcon]="percentageOfBattlesGoingFirst.hero"
				[reviewId]="percentageOfBattlesGoingFirst.reviewId"
			></stat-cell>
			<stat-cell
				label="Battle luck"
				[value]="battleLuck.value?.toFixed(1) + '%'"
				[heroIcon]="battleLuck.hero"
				[reviewId]="battleLuck.reviewId"
			></stat-cell>
			<stat-cell
				label="Negative Battle luck"
				[value]="negativeBattleLuck.value?.toFixed(1) + '%'"
				[heroIcon]="negativeBattleLuck.hero"
				[reviewId]="negativeBattleLuck.reviewId"
			></stat-cell>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsPersonalStatsStatsComponent implements AfterViewInit {
	_category: BattlegroundsPersonalStatsCategory;
	_state: StatsState;

	totalMinionsDamageDealt: NumberValue = {} as NumberValue;
	totalMinionsDamageTaken: NumberValue = {} as NumberValue;
	totalHeroDamageDealt: NumberValue = {} as NumberValue;
	maxSingleTurnHeroDamageDealt: NumberValue = {} as NumberValue;
	winStreak: NumberValue = {} as NumberValue;
	triples: NumberValue = {} as NumberValue;
	maxBoardStats: NumberValue = {} as NumberValue;
	coinsWasted: NumberValue = {} as NumberValue;
	rerolls: NumberValue = {} as NumberValue;
	freezes: NumberValue = {} as NumberValue;
	heroPowers: NumberValue = {} as NumberValue;
	minionsBought: NumberValue = {} as NumberValue;
	minionsSold: NumberValue = {} as NumberValue;
	minionsKilled: NumberValue = {} as NumberValue;
	heroesKilled: NumberValue = {} as NumberValue;
	percentageOfBattlesGoingFirst: NumberValue = {} as NumberValue;
	battleLuck: NumberValue = {} as NumberValue;
	negativeBattleLuck: NumberValue = {} as NumberValue;

	@Input() set category(value: BattlegroundsPersonalStatsCategory) {
		if (value === this._category) {
			return;
		}
		this._category = value;
		this.updateValues();
	}

	@Input() set state(value: StatsState) {
		if (value === this._state) {
			return;
		}
		this._state = value;
		this.updateValues();
	}

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly ow: OverwolfService,
		private readonly el: ElementRef,
		private readonly cdr: ChangeDetectorRef,
	) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	private updateValues() {
		if (!this._state || !this._category) {
			return;
		}
		console.debug('top stats', this._state.bestBgsUserStats);
		this.totalMinionsDamageDealt = this.getStat('totalDamageDealtToMinions');
		this.totalMinionsDamageTaken = this.getStat('totalDamageTakenByMinions');
		this.totalHeroDamageDealt = this.getStat('totalDamageDealtToHeroes');
		this.maxSingleTurnHeroDamageDealt = this.getStat('maxDamageDealtToHero');
		this.winStreak = this.getStat('highestWinStreak');
		this.triples = this.getStat('triplesCreated');
		this.maxBoardStats = this.getStat('maxBoardStats');
		this.coinsWasted = this.getStat('coinsWasted');
		this.rerolls = this.getStat('rerolls');
		this.freezes = this.getStat('freezes');
		this.heroPowers = this.getStat('heroPowerUsed');
		this.minionsBought = this.getStat('minionsBought');
		this.minionsSold = this.getStat('minionsSold');
		this.minionsKilled = this.getStat('enemyMinionsKilled');
		this.heroesKilled = this.getStat('enemyHeroesKilled');
		this.percentageOfBattlesGoingFirst = this.getStat('percentageOfBattlesGoingFirst');
		this.battleLuck = this.getStat('battleLuck');
		const negativeBattleLuckStat = this.getStat('negativeBattleLuck');
		this.negativeBattleLuck = {
			value: Math.max(negativeBattleLuckStat.value, 0),
			hero: negativeBattleLuckStat.hero,
			reviewId: negativeBattleLuckStat.reviewId,
		};
	}

	private getStat(statName: string): NumberValue {
		const stat = this._state.bestBgsUserStats?.find((stat) => stat.statName === statName);
		const result = {
			value: stat?.value || 0,
			hero: stat?.heroCardId,
			reviewId: stat?.reviewId,
		};
		// console.log('getting stat', statName, this._state.stats.bestBgsUserStats);
		return result;
	}
}

interface NumberValue {
	value: number;
	hero: string;
	reviewId: string;
}
