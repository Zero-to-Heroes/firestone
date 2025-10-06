import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ILocalizationService } from '@firestone/shared/framework/core';
import { ARENA_DRAFT_CARD_HIGH_WINS_THRESHOLD } from '../../services/arena-card-stats.service';
import { ArenaCardOption } from './model';

@Component({
	standalone: false,
	selector: 'arena-card-option-view',
	styleUrls: ['./arena-card-option-view.component.scss'],
	template: `
		<div class="info-container scalable">
			<div class="stats impact">
				<div class="stat winrate draw">
					<span class="label" [fsTranslate]="'app.arena.draft.card-drawn-impact'"></span>
					<span class="value {{ drawWinrateClass }}" [helpTooltip]="drawnImpactTooltip">{{
						drawImpact
					}}</span>
				</div>
				<div class="stat winrate deck">
					<span class="label" [fsTranslate]="'app.arena.draft.card-deck-impact'"></span>
					<span class="value {{ deckWinrateClass }}" [helpTooltip]="deckImpactTooltip">{{ deckImpact }}</span>
				</div>
			</div>
			<!-- Putting it at the top messes the layout because of the first-child selector -->
			<div class="low-data-icon" *ngIf="lowData" [helpTooltip]="lowDataTooltip">
				<div inlineSVG="assets/svg/attention.svg"></div>
			</div>
			<div class="stats pick">
				<div class="stat pickrate">
					<span class="label" [fsTranslate]="'app.arena.card-stats.header-pickrate'"></span>
					<span class="value">{{ pickrate }}</span>
				</div>
				<div class="stat pickrate-delta">
					<span class="label" [helpTooltip]="pickRateImpactTooltip">{{ pickRateHighWinsLabel }}</span>
					<span class="value">{{ pickRateHighWins }}</span>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaCardOptionViewComponent {
	@Input() set card(value: ArenaCardOption | null) {
		this.drawnWinrate = value?.drawnWinrate == null ? '-' : (100 * value.drawnWinrate).toFixed(1) + '%';
		this.deckWinrate = value?.deckWinrate == null ? '-' : (100 * value.deckWinrate).toFixed(1) + '%';
		this.drawImpact = value?.drawnImpact == null ? '-' : (100 * value.drawnImpact).toFixed(2);
		this.deckImpact = value?.deckImpact == null ? '-' : (100 * value.deckImpact).toFixed(2);
		this.drawWinrateClass = value?.drawnImpact == null ? '' : value.drawnImpact > 0 ? 'positive' : 'negative';
		this.deckWinrateClass = value?.deckImpact == null ? '' : value.deckImpact > 0 ? 'positive' : 'negative';
		this.pickrate = value?.pickRate == null ? '-' : (100 * value.pickRate).toFixed(1) + '%';
		this.pickRateHighWins = value?.pickRateHighWins == null ? '-' : (100 * value.pickRateHighWins).toFixed(1) + '%';
		this.drawnImpactTooltip = this.i18n.translateString(`app.arena.draft.card-drawn-impact-tooltip`, {
			drawWinrate: this.drawnWinrate,
		});
		this.deckImpactTooltip = this.i18n.translateString(`app.arena.draft.card-deck-impact-tooltip`, {
			deckWinrate: this.deckWinrate,
		});
		this.lowData = value?.dataPoints == null || value.dataPoints < 1000;
		this.lowDataTooltip = this.i18n.translateString('app.arena.card-stats.low-data-text', {
			value: value?.dataPoints ?? 0,
		});
	}

	drawnWinrate: string;
	deckWinrate: string;
	drawImpact: string;
	deckImpact: string;
	drawWinrateClass: string;
	deckWinrateClass: string;
	pickrate: string;
	pickRateHighWins: string;
	drawnImpactTooltip: string | null;
	deckImpactTooltip: string | null;
	lowData: boolean;
	lowDataTooltip: string;

	pickRateHighWinsLabel = this.i18n.translateString(`app.arena.card-stats.header-pickrate-high-wins-short`, {
		value: ARENA_DRAFT_CARD_HIGH_WINS_THRESHOLD,
	});
	pickRateImpactTooltip = this.i18n.translateString(`app.arena.card-stats.header-pickrate-high-wins-tooltip`, {
		value: ARENA_DRAFT_CARD_HIGH_WINS_THRESHOLD,
	});

	constructor(private readonly i18n: ILocalizationService) {}
}
