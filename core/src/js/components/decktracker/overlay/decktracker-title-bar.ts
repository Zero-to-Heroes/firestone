import { ChangeDetectionStrategy, Component, HostListener, Input, OnDestroy } from '@angular/core';
import { DeckState } from '../../../models/decktracker/deck-state';
import { StatsRecap } from '../../../models/decktracker/stats-recap';

@Component({
	selector: 'decktracker-title-bar',
	styleUrls: [
		'../../../../css/global/components-global.scss',
		'../../../../css/component/decktracker/overlay/decktracker-title-bar.component.scss',
	],
	template: `
		<div class="title-bar">
			<decktracker-deck-name [deck]="deck" *ngIf="showTitleBar"></decktracker-deck-name>
			<decktracker-cards-recap [deck]="deck" *ngIf="showTitleBar"></decktracker-cards-recap>
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
	@Input() deckWinrate: StatsRecap;
	@Input() matchupWinrate: StatsRecap;

	@HostListener('window:beforeunload')
	ngOnDestroy(): void {
		this.deck = null;
	}
}
