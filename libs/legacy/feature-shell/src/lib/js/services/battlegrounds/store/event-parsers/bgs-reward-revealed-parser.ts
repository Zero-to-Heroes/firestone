import { BattlegroundsState, QuestReward } from '@firestone/battlegrounds/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { BgsRewardRevealedEvent } from '../events/bgs-reward-revealed-event';
import { EventParser } from './_event-parser';

export class BgsRewardRevealedParser implements EventParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsRewardRevealedEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsRewardRevealedEvent): Promise<BattlegroundsState> {
		const playerToUpdate = currentState.currentGame.findPlayer(event.playerId);
		if (!playerToUpdate) {
			return currentState;
		}

		// Aranna (and maybe other transforming heroes) re-triggers this
		if (!!playerToUpdate.questRewards.find((r) => r.isHeroPower === event.isHeroPowerReward)) {
			return currentState;
		}

		const reward: QuestReward = {
			cardId: this.allCards.getCardFromDbfId(event.rewardDbfId).id,
			isHeroPower: event.isHeroPowerReward,
			completed: false,
			completedTurn: null,
		};
		const newPlayer = playerToUpdate.update({
			questRewards: [...playerToUpdate.questRewards, reward],
		});
		const newGame = currentState.currentGame.updatePlayer(newPlayer);
		return currentState.update({
			currentGame: newGame,
		} as BattlegroundsState);
	}
}
