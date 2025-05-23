import { isBattlegrounds } from '@firestone-hs/reference-data';
import { DeckState, GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../../../models/game-event';
import { LocalizationFacadeService } from '../../../localization-facade.service';
import { EventParser } from '../event-parser';

export class BgsRewardDestroyedParser implements EventParser {
	constructor(private readonly cards: CardsFacadeService, private readonly i18n: LocalizationFacadeService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state && isBattlegrounds(state.metadata?.gameType);
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
