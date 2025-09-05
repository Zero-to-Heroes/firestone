/* eslint-disable no-mixed-spaces-and-tabs */
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ILocalizationService } from '@firestone/shared/framework/core';
import { ConstructedCardStat } from '../services/constructed-discover.service';

@Component({
	standalone: false,
	selector: 'constructed-card-option-view',
	styleUrls: ['./constructed-card-option-view.component.scss'],
	template: `
		<div class="info-container scalable">
			<div class="stats impact">
				<div class="stat winrate discover" *ngIf="impact !== '-'" [helpTooltip]="tooltip">
					<span
						class="label"
						[fsTranslate]="'app.decktracker.meta.details.cards.discovered-winrate-impact-header'"
					></span>
					<span class="value {{ winrateClass }}" [ngClass]="{ 'low-data': lowData }">
						{{ impact }}
						<div class="warning" inlineSVG="assets/svg/attention.svg"></div>
					</span>
				</div>
				<div class="stat winrate discover" *ngIf="impact === '-'">
					<span class="value" [helpTooltip]="'decktracker.overlay.mulligan.no-mulligan-data' | fsTranslate"
						>-</span
					>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConstructedCardOptionViewComponent {
	@Input() set card(value: ConstructedCardStat | null) {
		this.impact = value?.discoverImpact == null ? '-' : (100 * value.discoverImpact).toFixed(2);
		this.winrateClass = value?.discoverImpact == null ? '' : value.discoverImpact > 0 ? 'positive' : 'negative';
		this.lowData = value?.dataPoints == null || value.dataPoints < 100;
		this.tooltip = this.lowData
			? this.i18n.translateString(
					'app.decktracker.meta.details.cards.discovered-winrate-impact-tooltip-low-data',
					{
						value: value?.dataPoints ?? 0,
					},
				)
			: this.i18n.translateString('app.decktracker.meta.details.cards.discovered-winrate-impact-tooltip-data', {
					value: value?.dataPoints ?? 0,
				});
	}

	impact: string;
	winrateClass: string;
	tooltip: string | null;
	lowData: boolean;

	constructor(private readonly i18n: ILocalizationService) {}
}
