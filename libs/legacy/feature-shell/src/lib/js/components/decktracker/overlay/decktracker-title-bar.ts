import { ChangeDetectionStrategy, Component, HostListener, Input, OnDestroy } from '@angular/core';
import { DeckState, StatsRecap } from '@firestone/game-state';
import { CardTooltipPositionType } from '@firestone/shared/common/view';

@Component({
	selector: 'decktracker-title-bar',
	styleUrls: ['../../../../css/component/decktracker/overlay/decktracker-title-bar.component.scss'],
	template: `
		<div class="title-bar">
			<decktracker-deck-name
				[deck]="deck"
				[tooltipPosition]="_tooltipPosition"
				*ngIf="showTitleBar"
			></decktracker-deck-name>
			<decktracker-cards-recap
				[deck]="deck"
				[showCardsInDeck]="showTotalCardsInZone"
				*ngIf="showTitleBar"
			></decktracker-cards-recap>
			<decktracker-winrate-recap
				*ngIf="showDeckWinrate"
				[stats]="deckWinrate"
				[type]="'deck'"
			></decktracker-winrate-recap>
			<decktracker-winrate-recap
				*ngIf="showMatchupWinrate"
				[stats]="matchupWinrate"
				[type]="'matchup'"
			></decktracker-winrate-recap>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckTrackerTitleBarComponent implements OnDestroy {
	@Input() deck: DeckState;
	@Input() showTitleBar: boolean;
	@Input() showDeckWinrate: boolean;
	@Input() showMatchupWinrate: boolean;
	@Input() showTotalCardsInZone: boolean;
	@Input() deckWinrate: StatsRecap;
	@Input() matchupWinrate: StatsRecap;

	_tooltipPosition: CardTooltipPositionType;

	@Input() set tooltipPosition(value: CardTooltipPositionType) {
		this._tooltipPosition = value;
	}

	@HostListener('window:beforeunload')
	ngOnDestroy(): void {
		this.deck = null;
	}
}
