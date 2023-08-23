import { CardsFacadeService } from '@firestone/shared/framework/core';
import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsGame } from '../../../../models/battlegrounds/bgs-game';
import { BgsPlayer, QuestReward } from '../../../../models/battlegrounds/bgs-player';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { BgsRewardRevealedEvent } from '../events/bgs-reward-revealed-event';
import { EventParser } from './_event-parser';

export class BgsRewardRevealedParser implements EventParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsRewardRevealedEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsRewardRevealedEvent): Promise<BattlegroundsState> {
		const playerToUpdate = currentState.currentGame.players.find((player) => player.playerId === event.playerId);
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
		const newPlayers: readonly BgsPlayer[] = currentState.currentGame.players.map((player) =>
			player.playerId === newPlayer.playerId ? newPlayer : player,
		);
		const newGame = currentState.currentGame.update({ players: newPlayers } as BgsGame);
		return currentState.update({
			currentGame: newGame,
		} as BattlegroundsState);
	}
}
