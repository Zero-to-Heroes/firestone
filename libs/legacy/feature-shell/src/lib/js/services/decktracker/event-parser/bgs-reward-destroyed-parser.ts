import { CardsFacadeService } from '@services/cards-facade.service';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { LocalizationFacadeService } from '../../localization-facade.service';
import { EventParser } from './event-parser';

export class BgsRewardDestroyedParser implements EventParser {
	constructor(private readonly cards: CardsFacadeService, private readonly i18n: LocalizationFacadeService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.BATTLEGROUNDS_QUEST_REWARD_DESTROYED;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		const newPlayerDeck = deck.update({
			weapon: gameEvent.additionalData.isHeroPowerReward ? deck.weapon : null,
			heroPower: gameEvent.additionalData.isHeroPowerReward ? null : deck.heroPower,
		} as DeckState);
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.BATTLEGROUNDS_QUEST_REWARD_DESTROYED;
	}
}
