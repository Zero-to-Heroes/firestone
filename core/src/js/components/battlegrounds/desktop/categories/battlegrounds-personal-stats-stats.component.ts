import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { BgsBestStat } from '@firestone-hs/user-bgs-post-match-stats';
import { Observable } from 'rxjs';
import { distinctUntilChanged, filter } from 'rxjs/operators';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { arraysEqual } from '../../../../services/utils';
import { AbstractSubscriptionComponent } from '../../../abstract-subscription.component';

@Component({
	selector: 'battlegrounds-personal-stats-stats',
	styleUrls: [
		`../../../../../css/global/components-global.scss`,
		`../../../../../css/component/battlegrounds/desktop/categories/battlegrounds-personal-stats-stats.component.scss`,
	],
	template: `
		<with-loading [isLoading]="!value.stat" *ngIf="{ stat: value$ | async } as value">
			<ng-container *ngIf="value.stat">
				<div class="header">
					<div class="label">
						<div class="record-icon">
							<svg class="svg-icon-fill">
								<use xlink:href="assets/svg/sprite.svg#new_record" />
							</svg>
						</div>
						{{ 'app.battlegrounds.personal-stats.records.columns.record' | owTranslate }}
					</div>
					<div class="filler"></div>
					<div class="hero" [owTranslate]="'app.battlegrounds.personal-stats.records.columns.hero'"></div>
					<div class="replay" [owTranslate]="'app.battlegrounds.personal-stats.records.columns.replay'"></div>
					<div class="value" [owTranslate]="'app.battlegrounds.personal-stats.records.columns.score'"></div>
				</div>
				<div class="stats-recap" scrollable>
					<stat-cell
						[label]="'app.battlegrounds.personal-stats.records.rows.total-dmg-dealt-minions' | owTranslate"
						[value]="value.stat.totalMinionsDamageDealt.value"
						[heroIcon]="value.stat.totalMinionsDamageDealt.hero"
						[reviewId]="value.stat.totalMinionsDamageDealt.reviewId"
					></stat-cell>
					<stat-cell
						[label]="'app.battlegrounds.personal-stats.records.rows.total-dmg-taken-minions' | owTranslate"
						[value]="value.stat.totalMinionsDamageTaken.value"
						[heroIcon]="value.stat.totalMinionsDamageTaken.hero"
						[reviewId]="value.stat.totalMinionsDamageTaken.reviewId"
					></stat-cell>
					<stat-cell
						[label]="'app.battlegrounds.personal-stats.records.rows.total-dmg-dealt-hero' | owTranslate"
						[tooltipText]="
							'app.battlegrounds.personal-stats.records.rows.total-dmg-dealt-hero-tooltip' | owTranslate
						"
						[value]="value.stat.totalHeroDamageDealt.value"
						[heroIcon]="value.stat.totalHeroDamageDealt.hero"
						[reviewId]="value.stat.totalHeroDamageDealt.reviewId"
					></stat-cell>
					<stat-cell
						[label]="'app.battlegrounds.personal-stats.records.rows.max-dmg-dealt-hero' | owTranslate"
						[tooltipText]="
							'app.battlegrounds.personal-stats.records.rows.max-dmg-dealt-hero-tooltip' | owTranslate
						"
						[value]="value.stat.maxSingleTurnHeroDamageDealt.value"
						[heroIcon]="value.stat.maxSingleTurnHeroDamageDealt.hero"
						[reviewId]="value.stat.maxSingleTurnHeroDamageDealt.reviewId"
					></stat-cell>
					<stat-cell
						[label]="'app.battlegrounds.personal-stats.records.rows.win-streak' | owTranslate"
						[value]="value.stat.winStreak.value"
						[heroIcon]="value.stat.winStreak.hero"
						[reviewId]="value.stat.winStreak.reviewId"
					></stat-cell>
					<stat-cell
						[label]="'app.battlegrounds.personal-stats.records.rows.triples' | owTranslate"
						[value]="value.stat.triples.value"
						[heroIcon]="value.stat.triples.hero"
						[reviewId]="value.stat.triples.reviewId"
					></stat-cell>
					<stat-cell
						[label]="'app.battlegrounds.personal-stats.records.rows.board-stats' | owTranslate"
						[value]="value.stat.maxBoardStats.value"
						[heroIcon]="value.stat.maxBoardStats.hero"
						[reviewId]="value.stat.maxBoardStats.reviewId"
						tooltipText="The maximum total stats (attack + health) of your board at the beginning of a battle"
					></stat-cell>
					<stat-cell
						[label]="'app.battlegrounds.personal-stats.records.rows.coins-wasted' | owTranslate"
						[value]="value.stat.coinsWasted.value"
						[heroIcon]="value.stat.coinsWasted.hero"
						[reviewId]="value.stat.coinsWasted.reviewId"
					></stat-cell>
					<stat-cell
						[label]="'app.battlegrounds.personal-stats.records.rows.rerolls' | owTranslate"
						[value]="value.stat.rerolls.value"
						[heroIcon]="value.stat.rerolls.hero"
						[reviewId]="value.stat.rerolls.reviewId"
					></stat-cell>
					<stat-cell
						[label]="'app.battlegrounds.personal-stats.records.rows.freezes' | owTranslate"
						[value]="value.stat.freezes.value"
						[heroIcon]="value.stat.freezes.hero"
						[reviewId]="value.stat.freezes.reviewId"
					></stat-cell>
					<stat-cell
						[label]="'app.battlegrounds.personal-stats.records.rows.hero-power' | owTranslate"
						[value]="value.stat.heroPowers.value"
						[heroIcon]="value.stat.heroPowers.hero"
						[reviewId]="value.stat.heroPowers.reviewId"
					></stat-cell>
					<stat-cell
						[label]="'app.battlegrounds.personal-stats.records.rows.minions-bought' | owTranslate"
						[value]="value.stat.minionsBought.value"
						[heroIcon]="value.stat.minionsBought.hero"
						[reviewId]="value.stat.minionsBought.reviewId"
					></stat-cell>
					<stat-cell
						[label]="'app.battlegrounds.personal-stats.records.rows.minions-sold' | owTranslate"
						[value]="value.stat.minionsSold.value"
						[heroIcon]="value.stat.minionsSold.hero"
						[reviewId]="value.stat.minionsSold.reviewId"
					></stat-cell>
					<stat-cell
						[label]="'app.battlegrounds.personal-stats.records.rows.enemy-minions-killed' | owTranslate"
						[value]="value.stat.minionsKilled.value"
						[heroIcon]="value.stat.minionsKilled.hero"
						[reviewId]="value.stat.minionsKilled.reviewId"
					></stat-cell>
					<stat-cell
						[label]="'app.battlegrounds.personal-stats.records.rows.enemy-heroes-killed' | owTranslate"
						[value]="value.stat.heroesKilled.value"
						[heroIcon]="value.stat.heroesKilled.hero"
						[reviewId]="value.stat.heroesKilled.reviewId"
					></stat-cell>
					<stat-cell
						[label]="'app.battlegrounds.personal-stats.records.rows.battles-going-first' | owTranslate"
						[value]="value.stat.percentageOfBattlesGoingFirst.value?.toFixed(1) + '%'"
						[heroIcon]="value.stat.percentageOfBattlesGoingFirst.hero"
						[reviewId]="value.stat.percentageOfBattlesGoingFirst.reviewId"
					></stat-cell>
					<stat-cell
						[label]="'app.battlegrounds.personal-stats.records.rows.battle-luck' | owTranslate"
						[value]="value.stat.battleLuck.value?.toFixed(1) + '%'"
						[heroIcon]="value.stat.battleLuck.hero"
						[reviewId]="value.stat.battleLuck.reviewId"
					></stat-cell>
					<stat-cell
						[label]="'app.battlegrounds.personal-stats.records.rows.negative-battle-luck' | owTranslate"
						[value]="value.stat.negativeBattleLuck.value?.toFixed(1) + '%'"
						[heroIcon]="value.stat.negativeBattleLuck.hero"
						[reviewId]="value.stat.negativeBattleLuck.reviewId"
					></stat-cell>
				</div>
			</ng-container>
		</with-loading>
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
			.listen$(([main, nav]) => main.stats.getBestBgsUserStats())
			.pipe(
				filter(([stats]) => !!stats?.length),
				distinctUntilChanged((a, b) => arraysEqual(a, b)),
				this.mapData(([stats]) => this.buildValue(stats)),
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
