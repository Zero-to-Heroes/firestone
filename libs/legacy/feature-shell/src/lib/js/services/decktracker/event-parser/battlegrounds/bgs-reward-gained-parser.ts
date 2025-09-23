import { isBattlegrounds } from '@firestone-hs/reference-data';
import { GameState, QuestReward } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '@firestone/game-state';
import { EventParser } from '../event-parser';

export class BgsRewardGainedParser implements EventParser {
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

		const turn = currentState.getCurrentTurnAdjustedForAsyncPlay();
		const reward: QuestReward = playerToUpdate.questRewards.find((r) => r.isHeroPower === isHeroPowerReward);
		let newRewards: QuestReward[] = [...(playerToUpdate.questRewards ?? [])];
		if (!reward) {
			console.warn(
				'[bgs-reward] missing reward, it could be a case of a reward gained directly',
				event,
				playerToUpdate.questRewards,
				playerToUpdate,
			);
			newRewards.push({
				cardId: this.allCards.getCard(rewardDbfId).id,
				completed: true,
				completedTurn: turn,
				isHeroPower: isHeroPowerReward,
			} as QuestReward);
		} else {
			newRewards = playerToUpdate.questRewards.map((r) =>
				r.isHeroPower === isHeroPowerReward
					? {
							...r,
							completed: true,
							completedTurn: turn,
						}
					: r,
			);
		}
		const newPlayer = playerToUpdate.update({
			questRewards: newRewards,
		});
		const newGame = currentState.bgState.currentGame.updatePlayer(newPlayer);

		return currentState.update({
			bgState: currentState.bgState.update({
				currentGame: newGame,
			}),
		});
	}

	event(): string {
		return GameEvent.BATTLEGROUNDS_REWARD_GAINED;
	}
}
