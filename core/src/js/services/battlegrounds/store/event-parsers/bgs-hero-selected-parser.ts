import { AllCardsService } from '@firestone-hs/replay-parser';
import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsGame } from '../../../../models/battlegrounds/bgs-game';
import { BgsPlayer } from '../../../../models/battlegrounds/bgs-player';
import { getHeroPower, normalizeHeroCardId } from '../../bgs-utils';
import { BgsHeroSelectedEvent } from '../events/bgs-hero-selected-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { EventParser } from './_event-parser';

export class BgsHeroSelectedParser implements EventParser {
	constructor(private readonly allCards: AllCardsService) {}

	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsHeroSelectedEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsHeroSelectedEvent): Promise<BattlegroundsState> {
		const normalizedCardId = normalizeHeroCardId(event.cardId);
		const newPlayer: BgsPlayer = BgsPlayer.create({
			cardId: normalizedCardId,
			heroPowerCardId: getHeroPower(normalizedCardId),
			name: this.allCards.getCard(event.cardId).name,
			isMainPlayer: true,
		} as BgsPlayer);
		const newGame = currentState.currentGame.update({
			players: [...currentState.currentGame.players, newPlayer] as readonly BgsPlayer[],
		} as BgsGame);
		return currentState.update({
			currentGame: newGame,
		} as BattlegroundsState);
	}
}
