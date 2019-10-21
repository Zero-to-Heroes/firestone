import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { DeckSummary } from '../../../models/mainwindow/decktracker/deck-summary';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../services/overwolf.service';

@Component({
	selector: 'decktracker-deck-summary',
	styleUrls: [
		`../../../../css/global/menu.scss`,
		`../../../../css/component/decktracker/main/decktracker-deck-summary.component.scss`,
	],
	template: `
		<div
			class="decktracker-deck-summary"
			helpTooltip="Detailed deck stats coming soon, stay tuned!"
			helpTooltipPosition="right"
		>
			<div class="deck-name">{{ deckName }}</div>
			<div class="deck-image" helpTooltipTarget>
				<img class="skin" [src]="skin" />
				<img class="frame" src="/Files/assets/images/deck/hero_frame.png" />
			</div>
			<div class="stats">
				<div class="text total-games">{{ totalGames }} games</div>
				<div class="text win-rate">{{ winRatePercentage }}% win rate</div>
				<div class="last-used">Last used: {{ lastUsed }}</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DecktrackerDeckSummaryComponent implements AfterViewInit {
	_deck: DeckSummary;
	deckName: string;
	totalGames: number;
	winRatePercentage: number;
	lastUsed: string;
	skin: string;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	@Input() set deck(value: DeckSummary) {
		// this.logger.debug('[decktracker-deck-summary] setting value', value);
		this._deck = value;
		this.deckName = value.deckName || 'Deck name';
		this.totalGames = value.totalGames;
		this.winRatePercentage = value.winRatePercentage;
		this.lastUsed = this.buildLastUsedDate(value.lastUsedTimestamp);
		this.skin = `https://static.zerotoheroes.com/hearthstone/cardart/256x/${value.skin}.jpg`;
	}

	constructor(private logger: NGXLogger, private ow: OverwolfService) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	private buildLastUsedDate(lastUsedTimestamp: number): string {
		const date = new Date(lastUsedTimestamp);
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: '2-digit',
			year: 'numeric',
		});
	}
}
