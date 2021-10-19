import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { BgsHeroStat } from '../../../models/battlegrounds/stats/bgs-hero-stat';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { arraysEqual, sumOnArray } from '../../../services/utils';
import { SimpleBarChartData } from '../../common/chart/simple-bar-chart-data';

@Component({
	selector: 'bgs-hero-stats',
	styleUrls: [
		`../../../../css/global/reset-styles.scss`,
		`../../../../css/component/battlegrounds/hero-selection/bgs-hero-selection-layout.component.scss`,
		`../../../../css/component/battlegrounds/hero-selection/bgs-hero-stats.component.scss`,
	],
	template: `
		<div class="stats">
			<div class="title">Finishes</div>
			<basic-bar-chart-2
				class="placement-distribution"
				[data]="placementChartData$ | async"
				[id]="'placementDistribution' + cardId"
				[midLineValue]="100 / 8"
			></basic-bar-chart-2>
			<div class="entry">
				<div class="label" helpTooltip="Average final position">Avg position:</div>
				<div class="global-value" helpTooltip="Global value">
					{{ buildValue(averagePosition) }}
				</div>
				<div class="player-value" helpTooltip="Your value">({{ buildValue(playerAveragePosition) }})</div>
			</div>
			<div class="winrate">
				<div
					class="title"
					[helpTooltip]="
						'Battle winrate per turn (it gives you an indication of when this hero is the strongest)'
					"
				>
					Winrate per turn
				</div>
				<bgs-winrate-chart [heroStat]="_hero" [showYAxis]="false"></bgs-winrate-chart>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsHeroStatsComponent {
	placementChartData$: Observable<SimpleBarChartData[]>;
	averagePosition: number;
	playerAveragePosition: number;
	cardId: string;
	_hero: BgsHeroStat;

	private placementDistribution$: BehaviorSubject<readonly PlacementDistribution[]> = new BehaviorSubject(null);
	private playerPlacementDistribution$: BehaviorSubject<readonly PlacementDistribution[]> = new BehaviorSubject(null);

	@Input() set hero(value: BgsHeroStat) {
		if (!value) {
			return;
		}
		this.cardId = value.id;
		this._hero = value;
		this.averagePosition = value.averagePosition;
		this.playerAveragePosition = value.playerAveragePosition;
		this.placementDistribution$.next(value.placementDistribution);
		this.playerPlacementDistribution$.next(value.playerPlacementDistribution);
	}

	constructor(private readonly cdr: ChangeDetectorRef, private readonly store: AppUiStoreFacadeService) {
		this.placementChartData$ = combineLatest(
			this.placementDistribution$.asObservable(),
			this.playerPlacementDistribution$.asObservable(),
			this.store.bgHeroStats$(),
		).pipe(
			map(
				([global, player, globalStats]) =>
					[
						global,
						player,
						Math.max(
							...globalStats
								.map((stat) => {
									const totalStatMatches = sumOnArray(
										stat.placementDistribution,
										(info) => info.totalMatches,
									);
									const highestStatValue = Math.max(
										...stat.placementDistribution.map(
											(info) => info.totalMatches / totalStatMatches,
										),
									);
									return highestStatValue;
								})
								.reduce((a, b) => a.concat(b), []),
						),
					] as [readonly PlacementDistribution[], readonly PlacementDistribution[], number],
			),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
			map(([global, player, maxGlobalValue]) => {
				const totalGlobalMatches = sumOnArray(global, (info) => info.totalMatches);
				const globalChartData: SimpleBarChartData = {
					data: global.map((info) => ({
						label: '' + info.rank,
						value: (100 * info.totalMatches) / totalGlobalMatches,
						rawValue: info.totalMatches,
					})),
				};
				const totalPlayerMatches = sumOnArray(player, (info) => info.totalMatches);
				const playerChartData: SimpleBarChartData = {
					data: player.map((info) => ({
						label: '' + info.rank,
						value: totalPlayerMatches ? (100 * info.totalMatches) / totalPlayerMatches : 0,
						rawValue: info.totalMatches,
					})),
				};
				return [globalChartData, playerChartData];
			}),
		);
	}

	getIcon(tribe: string): string {
		let referenceCardId: string;
		switch (tribe) {
			case 'Mech':
				referenceCardId = 'GVG_027';
				break;
			case 'Beast':
				referenceCardId = 'BGS_021';
				break;
			case 'Demon':
				referenceCardId = 'TB_BaconUps_060';
				break;
			case 'Dragon':
				referenceCardId = 'BGS_036';
				break;
			case 'Murloc':
				referenceCardId = 'BGS_030';
				break;
			case 'Pirate':
				referenceCardId = 'BGS_080';
				break;
			default:
				referenceCardId = 'BGS_009';
				break;
		}
		return `https://static.zerotoheroes.com/hearthstone/cardart/256x/${referenceCardId}.jpg`;
	}

	buildPercents(value: number): string {
		return value == null || isNaN(value) ? '-' : value.toFixed(1) + '%';
	}

	buildValue(value: number): string {
		return value == null || isNaN(value) ? '-' : value.toFixed(2);
	}
}

interface PlacementDistribution {
	readonly rank: number;
	readonly totalMatches: number;
}
