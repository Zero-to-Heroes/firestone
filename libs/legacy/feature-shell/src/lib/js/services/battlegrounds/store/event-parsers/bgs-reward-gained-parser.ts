import { CardsFacadeService } from '@firestone/shared/framework/core';
import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { QuestReward } from '../../../../models/battlegrounds/bgs-player';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { BgsRewardGainedEvent } from '../events/bgs-reward-gained-event';
import { EventParser } from './_event-parser';

export class BgsRewardGainedParser implements EventParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsRewardGainedEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsRewardGainedEvent): Promise<BattlegroundsState> {
		const playerToUpdate = currentState.currentGame.findPlayer(event.playerId);
		if (!playerToUpdate) {
			return currentState;
		}

		const turn = currentState.currentGame.getCurrentTurnAdjustedForAsyncPlay();
		const reward: QuestReward = playerToUpdate.questRewards.find((r) => r.isHeroPower === event.isHeroPowerReward);
		let newRewards: QuestReward[] = [...(playerToUpdate.questRewards ?? [])];
		if (!reward) {
			console.warn(
				'[bgs-reward] missing reward, it could be a case of a reward gained directly',
				event,
				playerToUpdate.questRewards,
				playerToUpdate,
			);
			newRewards.push({
				cardId: this.allCards.getCard(event.rewardDbfId).id,
				completed: true,
				completedTurn: turn,
				isHeroPower: event.isHeroPowerReward,
			} as QuestReward);
		} else {
			newRewards = playerToUpdate.questRewards.map((r) =>
				r.isHeroPower === event.isHeroPowerReward
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
		const newGame = currentState.currentGame.updatePlayer(newPlayer);
		return currentState.update({
			currentGame: newGame,
		} as BattlegroundsState);
	}
}
