import { Injectable } from '@angular/core';
import { GameTag, Mulligan, Step } from '@firestone-hs/reference-data';
import { Map } from 'immutable';
import { ActionTurn } from '../../models/game/action-turn';
import { Game } from '../../models/game/game';
import { GameEntity } from '../../models/game/game-entity';
import { MulliganTurn } from '../../models/game/mulligan-turn';
import { Turn } from '../../models/game/turn';
import { HistoryItem } from '../../models/history/history-item';
import { TagChangeHistoryItem } from '../../models/history/tag-change-history-item';
import { PlayerHistoryItem } from '../../models/models';

@Injectable({
	providedIn: 'root',
})
export class TurnParserService {
	constructor() {}

	public createTurns(game: Game, history: readonly HistoryItem[]): Game {
		let turns: Map<number, Turn> = game.turns;
		let turnNumber = turns.size;
		// // console.log('last history item', history[history.length - 1]);
		for (const item of history) {
			if (turnNumber === 0 && this.isMulligan(item, game)) {
				// // console.log('adding mulligan turn', item);
				const mulliganTurn: MulliganTurn = this.parseMulliganTurn(item as TagChangeHistoryItem, turns);
				turns = turns.set(0, mulliganTurn);
				turnNumber++;
			} else if (turnNumber === 0 && this.isMulliganDone(item, game)) {
				// The proper mulligan input could not be parsed
				// console.warn('Could not detect mulligan input, creating mulligan turn');
				const mulliganTurn: MulliganTurn = this.parseMulliganTurn(item as PlayerHistoryItem, turns);
				turns = turns.set(0, mulliganTurn);
				turnNumber++;
			} else if (this.isStartOfTurn(item, game)) {
				// // console.log('adding new turn', turnNumber);
				// Used for instance in Bob's encounters
				if (!turns.has(0)) {
					// // console.log('creating fake mulligan turn', turns, turns.toJS());
					const mulliganTurn: MulliganTurn = this.parseMulliganTurn(item as TagChangeHistoryItem, turns);
					turns = turns.set(0, mulliganTurn);
					turnNumber++;
				}
				const turn: ActionTurn = this.parseTurn(turnNumber, item as TagChangeHistoryItem, turns);
				turns = turns.set(turnNumber, turn);
				turnNumber++;
			}
		}
		// // console.log('created turns', turns.toJS());
		return Game.createGame(game, { turns } as Game);
	}

	private parseTurn(currentTurnNumber: number, item: TagChangeHistoryItem, turns: Map<number, Turn>): ActionTurn {
		const itemIndex = (item as TagChangeHistoryItem).tag.index;
		// Turn 1 is mulligan in the log, while for us mulligan is turn 0
		let turn: ActionTurn = turns.get(
			currentTurnNumber,
			Object.assign(new ActionTurn(), {
				turn: `${currentTurnNumber}`,
				timestamp: item.timestamp,
				index: itemIndex,
				activePlayer: undefined,
				actions: [],
			}) as ActionTurn,
		) as ActionTurn;
		turn = Object.assign(new ActionTurn(), turn, {
			index: Math.max(turn.index, itemIndex),
		});
		return turn;
	}

	private parseMulliganTurn(item: TagChangeHistoryItem | PlayerHistoryItem, turns: Map<number, Turn>): MulliganTurn {
		const itemIndex = item instanceof TagChangeHistoryItem ? item.tag.index : item.index;
		let mulliganTurn: MulliganTurn = turns.get(
			0,
			Object.assign(new MulliganTurn(), {
				turn: 'mulligan',
				timestamp: item.timestamp,
				index: itemIndex,
				actions: [],
			}) as MulliganTurn,
		) as MulliganTurn;
		mulliganTurn = Object.assign(new MulliganTurn(), mulliganTurn, {
			index: Math.max(mulliganTurn.index, itemIndex),
		});
		return mulliganTurn;
	}

	private isMulligan(item: HistoryItem, game: Game) {
		return (
			item instanceof TagChangeHistoryItem &&
			item.tag.tag === GameTag.MULLIGAN_STATE &&
			item.tag.value === Mulligan.INPUT
		);
	}

	private isMulliganDone(item: HistoryItem, game: Game) {
		return (
			(item instanceof PlayerHistoryItem &&
				item.entityDefintion.tags[GameTag[GameTag.MULLIGAN_STATE]] === Mulligan.DONE) ||
			(item instanceof TagChangeHistoryItem &&
				item.tag.tag === GameTag.MULLIGAN_STATE &&
				item.tag.value === Mulligan.DONE)
		);
	}

	private isStartOfTurn(item: HistoryItem, game: Game) {
		if (!(item instanceof TagChangeHistoryItem)) {
			return false;
		}
		const startOfTurn = item.tag.tag === GameTag.STEP && item.tag.value === Step.MAIN_READY;
		if (startOfTurn) {
			// // console.log('start of turn, isGameEntity?', item.tag.entity, game.getLatestParsedState()?.toJS())
		}
		return this.isGameEntity(item.tag.entity, game) && startOfTurn;
	}

	// private isPlayerEntity(entityId: number, game: Game) {
	// 	return game.entities.get(entityId) instanceof PlayerEntity;
	// }

	private isGameEntity(entityId: number, game: Game): boolean {
		return game.getLatestParsedState().get(entityId) instanceof GameEntity;
	}
}
