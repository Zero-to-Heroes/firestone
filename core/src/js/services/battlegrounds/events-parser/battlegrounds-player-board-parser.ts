import { GameTag } from '@firestone-hs/reference-data';
import { Entity } from '@firestone-hs/replay-parser';
import { Map } from 'immutable';
import { BattlegroundsBoardState } from '../../../models/battlegrounds/battlegrounds-board-state';
import { BattlegroundsPlayer } from '../../../models/battlegrounds/battlegrounds-player';
import { BattlegroundsState } from '../../../models/battlegrounds/battlegrounds-state';
import { BgsBoardInfo } from '../../../models/battlegrounds/bgs-board-info';
import { BoardEntity } from '../../../models/battlegrounds/board-entity';
import { GameEvent } from '../../../models/game-event';
import { EventParser } from './event-parser';

export class BattlegroundsPlayerBoardParser implements EventParser {
	public applies(gameEvent: GameEvent, state: BattlegroundsState): boolean {
		return state && gameEvent.type === GameEvent.BATTLEGROUNDS_PLAYER_BOARD;
	}

	public async parse(currentState: BattlegroundsState, gameEvent: GameEvent): Promise<BattlegroundsState> {
		const cardId = gameEvent.additionalData.cardId;
		const board = this.buildEntities(gameEvent.additionalData.board);
		const boardState = Object.assign(new BattlegroundsBoardState(), {
			minions: board,
		} as BattlegroundsBoardState);
		const bgsBoard: readonly BoardEntity[] = this.buildBgsEntities(gameEvent.additionalData.board);
		const bgsInfo: BgsBoardInfo = {
			player: {
				tavernTier: gameEvent.additionalData.hero?.Tags?.find(tag => tag.Name === GameTag.TECH_LEVEL),
				cardId: gameEvent.additionalData.hero?.CardId,
			},
			board: bgsBoard,
		};
		// console.log('bgsInfo', JSON.stringify(bgsInfo, null, 4));
		const player: BattlegroundsPlayer = currentState.getPlayer(cardId);
		const newPlayer = player.addNewBoardState(boardState);
		return currentState
			.updatePlayer(newPlayer)
			.addBattleBoardInfo(bgsInfo);
	}

	public event() {
		return GameEvent.BATTLEGROUNDS_PLAYER_BOARD;
	}

	private buildEntities(logEntities: any[]): readonly Entity[] {
		return logEntities.map(entity => this.buildEntity(entity));
	}

	private buildEntity(logEntity): Entity {
		return Object.assign(new Entity(), {
			cardID: logEntity.CardId,
			id: logEntity.Entity,
			tags: this.buildTags(logEntity.Tags),
		} as Entity);
	}

	private buildBgsEntities(logEntities: any[]): readonly BoardEntity[] {
		return logEntities.map(entity => this.buildBgsEntity(entity));
	}

	private buildBgsEntity(logEntity): BoardEntity {
		return {
			cardId: logEntity.CardId,
			attack: logEntity.Tags.find(tag => tag.Name === GameTag.ATK)?.Value,
			divineShield: (logEntity.Tags.find(tag => tag.Name === GameTag.DIVINE_SHIELD) || {})?.Value === 1,
			enchantments: this.buildEnchantments(logEntity.Enchantments),
			entityId: logEntity.Entity,
			health: logEntity.Tags.find(tag => tag.Name === GameTag.HEALTH)?.Value,
			poisonous: logEntity.Tags.find(tag => tag.Name === GameTag.POISONOUS)?.Value === 1,
			reborn: logEntity.Tags.find(tag => tag.Name === GameTag.REBORN)?.Value === 1,
			taunt: logEntity.Tags.find(tag => tag.Name === GameTag.TAUNT)?.Value === 1,
			cleave: undefined, // For now I'm not aware of any tag for this, so it's hard-coded in the simulator
			windfury: logEntity.Tags.find(tag => tag.Name === GameTag.WINDFURY)?.Value === 1,
			megaWindfury: logEntity.Tags.find(tag => tag.Name === GameTag.MEGA_WINDFURY)?.Value === 1,
		};
	}

	private buildTags(tags: { Name: number; Value: number }[]): Map<string, number> {
		return Map(tags.map(tag => [GameTag[tag.Name], tag.Value]));
	}

	private buildEnchantments(
		enchantments: { EntityId: number; CardId: string }[],
	): readonly { cardId: string; originEntityId: number }[] {
		return enchantments.map(enchant => ({
			originEntityId: enchant.EntityId,
			cardId: enchant.CardId,
		}));
	}
}
