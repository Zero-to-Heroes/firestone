/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @angular-eslint/template/eqeqeq */
/* eslint-disable @angular-eslint/template/no-negated-async */
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ReferenceCard } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameStat } from '@firestone/stats/data-access';

@Component({
	standalone: false,
	selector: 'community-friendly-battle-player',
	styleUrls: [`./community-friendly-battle-player.component.scss`],
	template: `
		<div class="player" [ngClass]="{ opponent: isOpponent }">
			<rank-image class="player-rank" [stat]="playerRankGameStat" [gameMode]="gameMode"></rank-image>
			<img class="player-class" [src]="playerClassImage" [helpTooltip]="playerClassTooltip" />
			<div class="player-name" *ngIf="playerName">{{ playerName }}</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommunityFriendlyBattlePlayerComponent {
	playerName: string;
	playerRankGameStat: GameStat;
	playerClassImage: string;
	playerClassTooltip: string;
	gameMode: string;

	@Input() isOpponent: boolean;

	@Input() set player(value: InternalFriendlyBattlePlayer) {
		this.playerName = value.name;

		const heroCard: ReferenceCard = this.allCards.getCard(value.cardId);
		this.playerClassTooltip = heroCard.name;
		this.playerClassImage = `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/deck/classes/${heroCard.playerClass?.toLowerCase()}.png`;
		this.playerRankGameStat = {
			playerRank: value.rank,
			gameMode: value.gameMode,
			gameFormat: value.gameFormat,
		} as GameStat;
		this.gameMode = value.gameMode;
	}

	constructor(private readonly allCards: CardsFacadeService) {}
}

export interface InternalFriendlyBattlePlayer {
	readonly name: string;
	readonly cardId: string;
	readonly rank: string;
	readonly gameMode: string;
	readonly gameFormat: string;
	readonly hasWon: boolean;
}
