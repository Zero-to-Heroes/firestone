import { isBattlegrounds } from '@firestone-hs/reference-data';
import { GameState, QuestReward } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../../../models/game-event';
import { EventParser } from '../event-parser';

export class BgsRewardRevealedParser implements EventParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state && isBattlegrounds(state.metadata?.gameType);
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const cardId = gameEvent.cardId;
		const playerId = gameEvent.additionalData.playerId;
		const rewardDbfId = gameEvent.additionalData.questRewardDbfId;
		const isHeroPowerReward = gameEvent.additionalData.isHeroPowerReward;

		const playerToUpdate = currentState.bgState.currentGame.findPlayer(playerId);
		if (!playerToUpdate) {
			return currentState;
		}

		// Aranna (and maybe other transforming heroes) re-triggers this
		if (!!playerToUpdate.questRewards.find((r) => r.isHeroPower === isHeroPowerReward)) {
			return currentState;
		}

		const reward: QuestReward = {
			cardId: this.allCards.getCardFromDbfId(rewardDbfId).id,
			isHeroPower: isHeroPowerReward,
			completed: false,
			completedTurn: null,
		};
		const newPlayer = playerToUpdate.update({
			questRewards: [...playerToUpdate.questRewards, reward],
		});
		const newGame = currentState.bgState.currentGame.updatePlayer(newPlayer);

		return currentState.update({
			bgState: currentState.bgState.update({
				currentGame: newGame,
			}),
		});
	}

	event(): string {
		return GameEvent.BATTLEGROUNDS_REWARD_REVEALED;
	}
}
