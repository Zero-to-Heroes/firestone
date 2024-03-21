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
			<div class="cell deck-winrate">{{ deckWinrate }}</div>
			<div class="cell drawn-winrate">{{ drawnWinrate }}</div>
			<div class="cell mulligan-winrate">{{ mulliganWinrate }}</div>
			<div class="cell pickrate">{{ pickrateTotal }}</div>
			<div class="cell pickrate-high-wins">{{ pickrateHighWins }}</div>
			<div class="cell drawn-total">{{ drawTotal }}</div>
			<div class="cell deck-total">{{ deckTotal }}</div>
			<div class="cell offered-total">{{ offeredTotal }}</div>
			<div class="cell pickrate-impact">{{ pickrateImpact }}</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaCardStatItemComponent {
	@Input() set card(value: ArenaCardStatInfo) {
		this.cardId = value.cardId;
		this.drawTotal =
			value.drawnTotal == null ? '-' : value.drawnTotal.toLocaleString(this.i18n.formatCurrentLocale() ?? 'enUS');
		this.deckTotal =
			value.deckTotal == null ? '-' : value.deckTotal.toLocaleString(this.i18n.formatCurrentLocale() ?? 'enUS');
		this.drawnWinrate = value.drawWinrate == null ? '-' : (100 * value.drawWinrate).toFixed(1) + '%';
		this.deckWinrate = value.deckWinrate == null ? '-' : (100 * value.deckWinrate).toFixed(1) + '%';
		this.mulliganWinrate = value.mulliganWinrate == null ? '-' : (100 * value.mulliganWinrate).toFixed(1) + '%';
		this.pickrateImpact = value.pickRateImpact == null ? '-' : (100 * value.pickRateImpact).toFixed(1) + '%';
		this.offeredTotal =
			value.totalOffered == null
				? '0'
				: value.totalOffered.toLocaleString(this.i18n.formatCurrentLocale() ?? 'enUS');
		this.pickrateTotal = value.pickRate == null ? '-' : (100 * value.pickRate).toFixed(1) + '%';
		this.pickrateHighWins = value.pickRateHighWins == null ? '-' : (100 * value.pickRateHighWins).toFixed(1) + '%';
	}

	cardId: string;
	drawTotal: string;
	deckTotal: string;
	drawnWinrate: string;
	deckWinrate: string;
	mulliganWinrate: string;
	pickrateImpact: string;
	offeredTotal: string;
	pickrateTotal: string;
	pickrateHighWins: string;

	constructor(private readonly i18n: ILocalizationService) {}
}
