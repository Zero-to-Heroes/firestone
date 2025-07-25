/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { SimpleBarChartData } from '@firestone/shared/common/view';
import { ILocalizationService } from '@firestone/shared/framework/core';
import { ArenaClassInfo } from './model';

@Component({
	standalone: false,
	selector: 'arena-class-info',
	styleUrls: [`./arena-class-tier-list-columns.scss`, `./arena-class-info.component.scss`],
	template: `
		<div class="class-info">
			<div class="cell portrait">
				<img class="icon" [src]="icon" />
			</div>
			<div class="cell class-details">
				<div class="name">{{ className }}</div>
				<div class="data-points">
					<div class="global">
						{{ dataPoints }}
					</div>
				</div>
			</div>
			<div class="cell winrate">{{ winrate }}</div>
			<div class="cell placement">
				<basic-bar-chart-2
					class="placement-distribution"
					[data]="placementChartData"
					[id]="'placementDistribution' + className"
					[offsetValue]="0"
					[dataTextFormatter]="dataTextFormatter"
				></basic-bar-chart-2>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaClassInfoComponent {
	@Input() set stat(value: ArenaClassInfo) {
		this.icon = `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/deck/classes/${value.playerClass}.png`;
		this.className = this.i18n.translateString(`global.class.${value.playerClass}`);
		this.dataPoints = this.i18n.translateString('app.battlegrounds.tier-list.data-points', {
			value: value.dataPoints.toLocaleString(this.i18n.formatCurrentLocale() ?? 'en-US'),
		});
		this.winrate = (100 * value.winrate).toFixed(1) + '%';

		const globalPlacementChartData: SimpleBarChartData = {
			data: value.placementDistribution.map((p) => ({
				label: '' + p.wins,
				value: p.total,
			})),
		};
		this.placementChartData = [globalPlacementChartData];
		// console.debug('setting stat', value, this.placementChartData);
	}

	icon: string;
	className: string | null;
	dataPoints: string | null;
	winrate: string;
	placementChartData: SimpleBarChartData[];
	dataTextFormatter = (value: string) =>
		this.i18n.translateString('app.arena.class-tier-list.graph-placement-tooltip', { value: value })!;

	constructor(private readonly i18n: ILocalizationService) {}
}
