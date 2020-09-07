import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	EventEmitter,
	Input,
} from '@angular/core';
import { BgsBestStat } from '@firestone-hs/compute-bgs-run-stats/dist/model/bgs-best-stat';
import { BattlegroundsPersonalStatsCategory } from '../../../../models/mainwindow/battlegrounds/categories/battlegrounds-personal-stats-category';
import { MainWindowState } from '../../../../models/mainwindow/main-window-state';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../../services/overwolf.service';

@Component({
	selector: 'battlegrounds-personal-stats-stats',
	styleUrls: [
		`../../../../../css/component/battlegrounds/desktop/categories/battlegrounds-personal-stats-stats.component.scss`,
		`../../../../../css/global/components-global.scss`,
	],
	template: `
		<div class="stats-recap" scrollable>
			<stat-cell label="Total dmg dealt (minions)" [value]="totalMinionsDamageDealt"></stat-cell>
			<stat-cell label="Total dmg taken (minions)" [value]="totalMinionsDamageTaken"></stat-cell>
			<stat-cell
				label="Total dmg dealt (hero)"
				helpTooltip="Doesn't include fights against the ghost"
				[value]="totalHeroDamageDealt"
			></stat-cell>
			<stat-cell
				label="Max dmg dealt (hero)"
				helpTooltip="Doesn't include fights against the ghost"
				[value]="maxSingleTurnHeroDamageDealt"
			></stat-cell>
			<stat-cell label="Highest Win streak" [value]="winStreak"></stat-cell>
			<stat-cell label="Triples created" [value]="triples"></stat-cell>
			<stat-cell
				label="Max board stats"
				[value]="maxBoardStats"
				tooltipText="The maximum total stats (attack + health) of your board at the beginning of a battle"
			></stat-cell>
			<stat-cell label="Coins wasted" [value]="coinsWasted"></stat-cell>
			<stat-cell label="Rerolls" [value]="rerolls"></stat-cell>
			<stat-cell label="Freezes" [value]="freezes"></stat-cell>
			<stat-cell label="Hero Power used" [value]="heroPowers"></stat-cell>
			<stat-cell label="Minions bought" [value]="minionsBought"></stat-cell>
			<stat-cell label="Minions sold" [value]="minionsSold"></stat-cell>
			<stat-cell label="Enemy Minions killed" [value]="minionsKilled"></stat-cell>
			<stat-cell label="Enemy Heroes killed" [value]="heroesKilled"></stat-cell>
			<stat-cell
				label="Battles going first"
				[value]="percentageOfBattlesGoingFirst?.toFixed(1) + '%'"
			></stat-cell>
			<div class="entry cell battle-luck">
				<div class="record-icon">
					<svg class="svg-icon-fill">
						<use xlink:href="/Files/assets/svg/sprite.svg#new_record" />
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
				<div class="value">{{ battleLuck?.toFixed(1) }}%</div>
			</div>
			<div class="entry cell battle-luck">
				<div class="record-icon">
					<svg class="svg-icon-fill">
						<use xlink:href="/Files/assets/svg/sprite.svg#new_record" />
					</svg>
				</div>
				<div class="label">
					Negative Battle luck
					<a
						class="explain-link"
						href="https://github.com/Zero-to-Heroes/firestone/wiki/Battlegrounds-Battle-Luck-stat"
						helpTooltip="An indicator that tells you how lucky you were in your battles during the run. Click for more info"
						target="_blank"
						>What is this?</a
					>
				</div>
				<div class="value">{{ negativeBattleLuck?.toFixed(1) }}%</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsPersonalStatsStatsComponent implements AfterViewInit {
	_category: BattlegroundsPersonalStatsCategory;
	_state: MainWindowState;

	totalMinionsDamageDealt: number;
	totalMinionsDamageTaken: number;
	totalHeroDamageDealt: number;
	maxSingleTurnHeroDamageDealt: number;
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
	battleLuck: number;
	negativeBattleLuck: number;

	@Input() set category(value: BattlegroundsPersonalStatsCategory) {
		if (value === this._category) {
			return;
		}
		this._category = value;
		this.updateValues();
	}

	@Input() set state(value: MainWindowState) {
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

		this.totalMinionsDamageDealt = this.getStat('totalDamageDealtToMinions')?.value || 0;
		this.totalMinionsDamageTaken = this.getStat('totalDamageTakenByMinions')?.value || 0;
		this.totalHeroDamageDealt = this.getStat('totalDamageDealtToHeroes')?.value || 0;
		this.maxSingleTurnHeroDamageDealt = this.getStat('maxDamageDealtToHero')?.value || 0;
		this.winStreak = this.getStat('highestWinStreak')?.value || 0;
		this.triples = this.getStat('triplesCreated')?.value || 0;
		this.maxBoardStats = this.getStat('maxBoardStats')?.value || 0;
		this.coinsWasted = this.getStat('coinsWasted')?.value || 0;
		this.rerolls = this.getStat('rerolls')?.value || 0;
		this.freezes = this.getStat('freezes')?.value || 0;
		this.heroPowers = this.getStat('heroPowerUsed')?.value || 0;
		this.minionsBought = this.getStat('minionsBought')?.value || 0;
		this.minionsSold = this.getStat('minionsSold')?.value || 0;
		this.minionsKilled = this.getStat('enemyMinionsKilled')?.value || 0;
		this.heroesKilled = this.getStat('enemyHeroesKilled')?.value || 0;
		this.percentageOfBattlesGoingFirst = this.getStat('percentageOfBattlesGoingFirst')?.value || 0;
		this.battleLuck = this.getStat('battleLuck')?.value || 0;
		this.negativeBattleLuck = this.getStat('negativeBattleLuck')?.value || 0;
	}

	private getStat(statName: string): BgsBestStat {
		return this._state.stats.bestBgsUserStats.find(stat => stat.statName === statName);
	}
}
