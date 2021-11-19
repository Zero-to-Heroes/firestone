import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { BgsBestStat } from '@firestone-hs/user-bgs-post-match-stats';
import { Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, takeUntil, tap } from 'rxjs/operators';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { cdLog } from '../../../../services/ui-store/app-ui-store.service';
import { arraysEqual } from '../../../../services/utils';
import { AbstractSubscriptionComponent } from '../../../abstract-subscription.component';

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
		<div class="stats-recap" scrollable *ngIf="value$ | async as stat">
			<stat-cell
				label="Total dmg dealt (minions)"
				[value]="stat.totalMinionsDamageDealt.value"
				[heroIcon]="stat.totalMinionsDamageDealt.hero"
				[reviewId]="stat.totalMinionsDamageDealt.reviewId"
			></stat-cell>
			<stat-cell
				label="Total dmg taken (minions)"
				[value]="stat.totalMinionsDamageTaken.value"
				[heroIcon]="stat.totalMinionsDamageTaken.hero"
				[reviewId]="stat.totalMinionsDamageTaken.reviewId"
			></stat-cell>
			<stat-cell
				label="Total dmg dealt (hero)"
				tooltipText="Doesn't include fights against the ghost"
				[value]="stat.totalHeroDamageDealt.value"
				[heroIcon]="stat.totalHeroDamageDealt.hero"
				[reviewId]="stat.totalHeroDamageDealt.reviewId"
			></stat-cell>
			<stat-cell
				label="Max dmg dealt (hero)"
				tooltipText="Doesn't include fights against the ghost"
				[value]="stat.maxSingleTurnHeroDamageDealt.value"
				[heroIcon]="stat.maxSingleTurnHeroDamageDealt.hero"
				[reviewId]="stat.maxSingleTurnHeroDamageDealt.reviewId"
			></stat-cell>
			<stat-cell
				label="Highest Win streak"
				[value]="stat.winStreak.value"
				[heroIcon]="stat.winStreak.hero"
				[reviewId]="stat.winStreak.reviewId"
			></stat-cell>
			<stat-cell
				label="Triples created"
				[value]="stat.triples.value"
				[heroIcon]="stat.triples.hero"
				[reviewId]="stat.triples.reviewId"
			></stat-cell>
			<stat-cell
				label="Max board stats"
				[value]="stat.maxBoardStats.value"
				[heroIcon]="stat.maxBoardStats.hero"
				[reviewId]="stat.maxBoardStats.reviewId"
				tooltipText="The maximum total stats (attack + health) of your board at the beginning of a battle"
			></stat-cell>
			<stat-cell
				label="Coins wasted"
				[value]="stat.coinsWasted.value"
				[heroIcon]="stat.coinsWasted.hero"
				[reviewId]="stat.coinsWasted.reviewId"
			></stat-cell>
			<stat-cell
				label="Rerolls"
				[value]="stat.rerolls.value"
				[heroIcon]="stat.rerolls.hero"
				[reviewId]="stat.rerolls.reviewId"
			></stat-cell>
			<stat-cell
				label="Freezes"
				[value]="stat.freezes.value"
				[heroIcon]="stat.freezes.hero"
				[reviewId]="stat.freezes.reviewId"
			></stat-cell>
			<stat-cell
				label="Hero Power used"
				[value]="stat.heroPowers.value"
				[heroIcon]="stat.heroPowers.hero"
				[reviewId]="stat.heroPowers.reviewId"
			></stat-cell>
			<stat-cell
				label="Minions bought"
				[value]="stat.minionsBought.value"
				[heroIcon]="stat.minionsBought.hero"
				[reviewId]="stat.minionsBought.reviewId"
			></stat-cell>
			<stat-cell
				label="Minions sold"
				[value]="stat.minionsSold.value"
				[heroIcon]="stat.minionsSold.hero"
				[reviewId]="stat.minionsSold.reviewId"
			></stat-cell>
			<stat-cell
				label="Enemy Minions killed"
				[value]="stat.minionsKilled.value"
				[heroIcon]="stat.minionsKilled.hero"
				[reviewId]="stat.minionsKilled.reviewId"
			></stat-cell>
			<stat-cell
				label="Enemy Heroes killed"
				[value]="stat.heroesKilled.value"
				[heroIcon]="stat.heroesKilled.hero"
				[reviewId]="stat.heroesKilled.reviewId"
			></stat-cell>
			<stat-cell
				label="Battles going first"
				[value]="stat.percentageOfBattlesGoingFirst.value?.toFixed(1) + '%'"
				[heroIcon]="stat.percentageOfBattlesGoingFirst.hero"
				[reviewId]="stat.percentageOfBattlesGoingFirst.reviewId"
			></stat-cell>
			<stat-cell
				label="Battle luck"
				[value]="stat.battleLuck.value?.toFixed(1) + '%'"
				[heroIcon]="stat.battleLuck.hero"
				[reviewId]="stat.battleLuck.reviewId"
			></stat-cell>
			<stat-cell
				label="Negative Battle luck"
				[value]="stat.negativeBattleLuck.value?.toFixed(1) + '%'"
				[heroIcon]="stat.negativeBattleLuck.hero"
				[reviewId]="stat.negativeBattleLuck.reviewId"
			></stat-cell>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsPersonalStatsStatsComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit {
	value$: Observable<Value>;

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
		super(store, cdr);
	}

	ngAfterContentInit(): void {
		this.value$ = this.store
			.listen$(([main, nav]) => main.stats.bestBgsUserStats)
			.pipe(
				filter(([stats]) => !!stats?.length),
				distinctUntilChanged((a, b) => arraysEqual(a, b)),
				map(([stats]) => this.buildValue(stats)),
				tap((stat) => cdLog('emitting stat in ', this.constructor.name, stat)),
				takeUntil(this.destroyed$),
			);
	}

	private buildValue(stats: readonly BgsBestStat[]): Value {
		const negativeBattleLuckStat = this.getStat(stats, 'negativeBattleLuck');
		return {
			totalMinionsDamageDealt: this.getStat(stats, 'totalDamageDealtToMinions'),
			totalMinionsDamageTaken: this.getStat(stats, 'totalDamageTakenByMinions'),
			totalHeroDamageDealt: this.getStat(stats, 'totalDamageDealtToHeroes'),
			maxSingleTurnHeroDamageDealt: this.getStat(stats, 'maxDamageDealtToHero'),
			winStreak: this.getStat(stats, 'highestWinStreak'),
			triples: this.getStat(stats, 'triplesCreated'),
			maxBoardStats: this.getStat(stats, 'maxBoardStats'),
			coinsWasted: this.getStat(stats, 'coinsWasted'),
			rerolls: this.getStat(stats, 'rerolls'),
			freezes: this.getStat(stats, 'freezes'),
			heroPowers: this.getStat(stats, 'heroPowerUsed'),
			minionsBought: this.getStat(stats, 'minionsBought'),
			minionsSold: this.getStat(stats, 'minionsSold'),
			minionsKilled: this.getStat(stats, 'enemyMinionsKilled'),
			heroesKilled: this.getStat(stats, 'enemyHeroesKilled'),
			percentageOfBattlesGoingFirst: this.getStat(stats, 'percentageOfBattlesGoingFirst'),
			battleLuck: this.getStat(stats, 'battleLuck'),
			negativeBattleLuck: {
				value: Math.max(negativeBattleLuckStat.value, 0),
				hero: negativeBattleLuckStat.hero,
				reviewId: negativeBattleLuckStat.reviewId,
			},
		};
	}

	private getStat(stats: readonly BgsBestStat[], statName: string): NumberValue {
		const stat = stats.find((stat) => stat.statName === statName);
		const result = {
			value: stat?.value || 0,
			hero: stat?.heroCardId,
			reviewId: stat?.reviewId,
		};

		return result;
	}
}

interface NumberValue {
	value: number;
	hero: string;
	reviewId: string;
}

interface Value {
	readonly totalMinionsDamageDealt: NumberValue;
	readonly totalMinionsDamageTaken: NumberValue;
	readonly totalHeroDamageDealt: NumberValue;
	readonly maxSingleTurnHeroDamageDealt: NumberValue;
	readonly winStreak: NumberValue;
	readonly triples: NumberValue;
	readonly maxBoardStats: NumberValue;
	readonly coinsWasted: NumberValue;
	readonly rerolls: NumberValue;
	readonly freezes: NumberValue;
	readonly heroPowers: NumberValue;
	readonly minionsBought: NumberValue;
	readonly minionsSold: NumberValue;
	readonly minionsKilled: NumberValue;
	readonly heroesKilled: NumberValue;
	readonly percentageOfBattlesGoingFirst: NumberValue;
	readonly battleLuck: NumberValue;
	readonly negativeBattleLuck: NumberValue;
}
