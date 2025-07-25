/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
	standalone: false,
	selector: 'player-decks',
	styleUrls: ['../../global.scss', './player-decks.component.scss'],
	template: `
		<div class="player-decks">
			<div class="section opponent-deck">
				<div class="title">
					Opponent Deck
					<div
						class="info"
						inlineSVG="assets/svg/info.svg"
						[helpTooltip]="'Shows cards that were played by the opponent during the game.'"
					></div>
				</div>
				<deck-list-basic
					class="deck-list"
					*ngIf="opponentDecklist"
					[deckstring]="opponentDecklist"
				></deck-list-basic>
				<div class="no-list" *ngIf="!opponentDecklist">We couldn't find the decklist for this player</div>
			</div>
			<div class="section player-deck">
				<div class="title">Player Deck</div>
				<deck-list-basic class="deck-list" *ngIf="decklist" [deckstring]="decklist"></deck-list-basic>
				<div class="no-list" *ngIf="!decklist">We couldn't find the decklist for this player</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerDecksComponent {
	@Input() decklist: string | null;
	@Input() opponentDecklist: string | null;
}
