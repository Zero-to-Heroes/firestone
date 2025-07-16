/* eslint-disable no-mixed-spaces-and-tabs */
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BgsMetaCompStatTierItem } from '@firestone/battlegrounds/data-access';

import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';

@Component({
	selector: 'battlegrounds-meta-stats-comps-info',
	styleUrls: [
		`./battlegrounds-meta-stats-comps-columns.scss`,
		`./battlegrounds-meta-stats-comps-info.component.scss`,
	],
	template: `
		<div class="info">
			<div class="cell name">
				<div class="text">{{ compName }}</div>
				<div class="data-points">
					{{ dataPoints }}
				</div>
			</div>
			<div class="cell average-placement">{{ averagePlacement }}</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsMetaStatsCompInfoComponent {
	@Input() set stat(value: BgsMetaCompStatTierItem) {
		this.compId = value.compId;
		this.compName = value.name;
		this.dataPoints = this.i18n.translateString('app.battlegrounds.tier-list.data-points', {
			value: value.dataPoints.toLocaleString(this.i18n.formatCurrentLocale() ?? 'enUS'),
		});
		this.averagePlacement = this.buildValue(value.averagePlacement);
	}

	compId: string;
	compName: string;
	dataPoints: string;

	impactValue: number;
	impact: string;
	averagePlacement: string;
	averagePlacementHighMmr: string;
	pickRate: string;
	pickRateHighMmr: string;

	constructor(private readonly allCards: CardsFacadeService, private readonly i18n: ILocalizationService) {}

	buildValue(value: number): string {
		return value == null
			? '-'
			: value === 0
			? '0'
			: value.toLocaleString(this.i18n.formatCurrentLocale() ?? 'enUS', {
					minimumFractionDigits: 2,
					maximumFractionDigits: 2,
			  });
	}
}
