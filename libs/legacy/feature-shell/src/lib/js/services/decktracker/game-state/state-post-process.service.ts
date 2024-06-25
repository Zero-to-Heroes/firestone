import { Injectable } from '@angular/core';
import { CardType } from '@firestone-hs/reference-data';
import { DeckState, GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';

@Injectable()
export class StatePostProcessService {
	constructor(private readonly allCards: CardsFacadeService) {}

	public postProcess(state: GameState): GameState {
		const newPlayerState = this.postProcessDeckState(state.playerDeck);
		const newOpponentState = this.postProcessDeckState(state.opponentDeck);
		return state.update({
			playerDeck: newPlayerState,
			opponentDeck: newOpponentState,
		});
	}

	private postProcessDeckState(deckState: DeckState): DeckState {
		return deckState.update({
			otherZone: deckState.otherZone.filter(
				(c) => this.allCards.getCard(c.cardId).type?.toUpperCase() !== CardType[CardType.ENCHANTMENT],
			),
		});
	}
}
