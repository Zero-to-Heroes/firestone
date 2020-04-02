import { AllCardsService } from '@firestone-hs/replay-parser';
import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsGame } from '../../../../models/battlegrounds/bgs-game';
import { BgsPlayer } from '../../../../models/battlegrounds/bgs-player';
import { BgsOpponentRevealedEvent } from '../events/bgs-opponent-revealed-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { EventParser } from './_event-parser';

export class BgsOpponentRevealedParser implements EventParser {
	constructor(private readonly allCards: AllCardsService) {}

	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsOpponentRevealedEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsOpponentRevealedEvent): Promise<BattlegroundsState> {
		console.log('opponent revealed', event, currentState);
		const newPlayer: BgsPlayer = BgsPlayer.create({
			cardId: event.cardId,
			name: this.allCards.getCard(event.cardId).name,
		} as BgsPlayer);
		const newGame = currentState.currentGame.update({
			players: [...currentState.currentGame.players, newPlayer] as readonly BgsPlayer[],
		} as BgsGame);
		return currentState.update({
			currentGame: newGame,
		} as BattlegroundsState);
	}
}
