import { GameTag } from '@firestone-hs/reference-data';
import { Entity } from '@firestone-hs/replay-parser';
import { BoardEntity } from '@firestone-hs/simulate-bgs-battle/dist/board-entity';
import { CardsFacadeService } from '@firestone/shared/framework/core';

export const buildEntityFromBoardEntity = (minion: BoardEntity, allCards: CardsFacadeService): Entity => {
	return Entity.fromJS({
		id: minion.entityId,
		cardID: minion.cardId,
		damageForThisAction: 0,
		tags: {
			[GameTag[GameTag.ATK]]: minion.attack,
			[GameTag[GameTag.HEALTH]]: minion.health,
			[GameTag[GameTag.TAUNT]]: minion.taunt ? 1 : 0,
			[GameTag[GameTag.STEALTH]]: minion.stealth ? 1 : 0,
			[GameTag[GameTag.DIVINE_SHIELD]]: minion.divineShield ? 1 : 0,
			[GameTag[GameTag.POISONOUS]]: minion.poisonous ? 1 : 0,
			[GameTag[GameTag.VENOMOUS]]: minion.venomous ? 1 : 0,
			[GameTag[GameTag.REBORN]]: minion.reborn ? 1 : 0,
			[GameTag[GameTag.WINDFURY]]: minion.windfury ? 1 : 0,
			[GameTag[GameTag.TAG_SCRIPT_DATA_NUM_1]]: minion.scriptDataNum1,
			[GameTag[GameTag.TAG_SCRIPT_DATA_NUM_2]]: minion.scriptDataNum2,
			[GameTag[GameTag.PREMIUM]]: allCards.getCard(minion.cardId)?.premium ? 1 : 0,
		},
		// This probably won't work with positioning auras, but I don't think there are many
		// left (used to have Dire Wolf Alpha)
		enchantments: minion.enchantments,
	} as any);
};
