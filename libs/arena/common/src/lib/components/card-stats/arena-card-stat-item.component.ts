import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ILocalizationService } from '@firestone/shared/framework/core';
import { ArenaCardStatInfo } from './model';

@Component({
	selector: 'arena-card-stat-item',
	styleUrls: [`./arena-card-stats-columns.scss`, `./arena-card-stat-item.component.scss`],
	template: `
		<div class="card-info">
			<div class="cell card-details">
				<card-tile [cardId]="cardId"></card-tile>
			</div>
			<div class="cell drawn-total">{{ drawTotal }}</div>
			<div class="cell drawn-winrate">{{ drawnWinrate }}</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaCardStatItemComponent {
	@Input() set card(value: ArenaCardStatInfo) {
		this.cardId = value.cardId;
		this.drawTotal =
			value.drawnTotal == null ? '-' : value.drawnTotal.toLocaleString(this.i18n.formatCurrentLocale() ?? 'enUS');
		this.drawnWinrate = value.drawWinrate == null ? '-' : (100 * value.drawWinrate).toFixed(1) + '%';
		console.debug('setting stat', value);
	}

	cardId: string;
	drawTotal: string;
	drawnWinrate: string;

	constructor(private readonly i18n: ILocalizationService) {}
}
