/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-mixed-spaces-and-tabs */
import { Injectable } from '@angular/core';
import { CardIds, defaultStartingHp, GameTag, GameType, getHeroPower } from '@firestone-hs/reference-data';
import { Entity } from '@firestone-hs/replay-parser';
import { BoardEntity } from '@firestone-hs/simulate-bgs-battle/dist/board-entity';
import { BgsFaceOffWithSimulation } from '@firestone/battlegrounds/core';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { Side } from './bgs-simulator-controller.service';

@Injectable()
export class StateManagerService {
	// Keep this stateless, so it can be used on the UI windows, which keeps the code
	// simpler
	public constructor(private readonly allCards: CardsFacadeService) {}

	public buildInitialBattle(battle: BgsFaceOffWithSimulation | null): BgsFaceOffWithSimulation {
		// Make sure we have an instance of the class, and not just a data structure
		let result = BgsFaceOffWithSimulation.create(battle ?? {});
		if (!result.battleInfo) {
			result = result.update({
				battleInfo: {
					playerBoard: {
						board: [],
						player: {
							cardId: result.playerCardId ?? 'TB_BaconShop_HERO_KelThuzad',
							hpLeft:
								result.playerHpLeft ??
								defaultStartingHp(
									GameType.GT_BATTLEGROUNDS,
									result.playerCardId ?? 'TB_BaconShop_HERO_KelThuzad',
									this.allCards,
								),
							tavernTier: result.playerTavern ?? 6,
							heroPowerId: null,
							heroPowerUsed: true,
							heroPowerInfo: 0,
							heroPowerInfo2: 0,
							questRewards: undefined,
							questEntities: [],
						},
					},
					opponentBoard: {
						board: [],
						player: {
							cardId: result.opponentCardId ?? 'TB_BaconShop_HERO_KelThuzad',
							hpLeft: result.opponentHpLeft ?? 40,
							tavernTier: result.opponentTavern ?? 6,
							heroPowerId: null,
							heroPowerUsed: true,
							heroPowerInfo: 0,
							heroPowerInfo2: 0,
							questRewards: undefined,
							questEntities: [],
						},
					},
					options: {
						numberOfSimulations: 8000,
						maxAcceptableDuration: 6000,
						skipInfoLogs: true,
					},
					gameState: {
						// No restrictions on tribes yet
						validTribes: undefined,
						currentTurn: 0,
						anomalies: [],
					},
				},
			});
		}
		return result;
	}

	public updateHero(value: BgsFaceOffWithSimulation, side: Side, heroCardId: string): BgsFaceOffWithSimulation {
		if (!value.battleInfo) {
			return value;
		}

		return side === 'player'
			? value.update({
					playerCardId: heroCardId,
					battleInfo: {
						...value.battleInfo,
						playerBoard: {
							...value.battleInfo.playerBoard,
							player: {
								...value.battleInfo.playerBoard.player,
								cardId: heroCardId,
								heroPowerId: getHeroPower(heroCardId, this.allCards.getService()),
							},
						},
					},
			  })
			: value.update({
					opponentCardId: heroCardId,
					battleInfo: {
						...value.battleInfo,
						opponentBoard: {
							...value.battleInfo.opponentBoard,
							player: {
								...value.battleInfo.opponentBoard.player,
								cardId: heroCardId,
								heroPowerId: getHeroPower(heroCardId, this.allCards.getService()),
							},
						},
					},
			  });
	}

	public updateHeroPower(
		value: BgsFaceOffWithSimulation,
		side: Side,
		heroPowerCardId: string | null,
		heroPowerInfo: number,
	): BgsFaceOffWithSimulation {
		if (!value.battleInfo) {
			return value;
		}

		return side === 'player'
			? value.update({
					battleInfo: {
						...value.battleInfo,
						playerBoard: {
							...value.battleInfo.playerBoard,
							player: {
								...value.battleInfo.playerBoard.player,
								heroPowerId: heroPowerCardId,
								heroPowerInfo: heroPowerInfo,
							},
						},
					},
			  })
			: value.update({
					battleInfo: {
						...value.battleInfo,
						opponentBoard: {
							...value.battleInfo.opponentBoard,
							player: {
								...value.battleInfo.opponentBoard.player,
								heroPowerId: heroPowerCardId,
								heroPowerInfo: heroPowerInfo,
							},
						},
					},
			  });
	}

	public updateQuestReward(
		value: BgsFaceOffWithSimulation,
		side: Side,
		questRewardCardId: string | null,
	): BgsFaceOffWithSimulation {
		if (!value.battleInfo) {
			return value;
		}

		return side === 'player'
			? value.update({
					battleInfo: {
						...value.battleInfo,
						playerBoard: {
							...value.battleInfo.playerBoard,
							player: {
								...value.battleInfo.playerBoard.player,
								questRewards: [questRewardCardId].filter((cardId) => cardId != null) as string[],
							},
						},
					},
			  })
			: value.update({
					battleInfo: {
						...value.battleInfo,
						opponentBoard: {
							...value.battleInfo.opponentBoard,
							player: {
								...value.battleInfo.opponentBoard.player,
								questRewards: [questRewardCardId].filter((cardId) => cardId != null) as string[],
							},
						},
					},
			  });
	}

	public addTeammate(value: BgsFaceOffWithSimulation, side: Side): BgsFaceOffWithSimulation {
		if (!value.battleInfo) {
			return value;
		}

		return side === 'player'
			? value.update({
					battleInfo: {
						...value.battleInfo,
						playerTeammateBoard: {
							board: [],
							player: {
								cardId: CardIds.Kelthuzad_TB_BaconShop_HERO_KelThuzad,
								heroPowerId: null,
								hpLeft: 30,
								tavernTier: 1,
								globalInfo: {},
								questEntities: [],
								friendly: true,
								hand: [],
								heroPowerUsed: false,
							},
							secrets: [],
						},
					},
			  })
			: value.update({
					battleInfo: {
						...value.battleInfo,
						opponentTeammateBoard: {
							board: [],
							player: {
								cardId: CardIds.Kelthuzad_TB_BaconShop_HERO_KelThuzad,
								heroPowerId: null,
								hpLeft: 30,
								tavernTier: 1,
								globalInfo: {},
								questEntities: [],
								friendly: false,
								hand: [],
								heroPowerUsed: false,
							},
							secrets: [],
						},
					},
			  });
	}

	public switchTeammates(value: BgsFaceOffWithSimulation, side: Side): BgsFaceOffWithSimulation {
		if (!value.battleInfo) {
			return value;
		}

		if (side === 'player') {
			const tmp = value.battleInfo.playerTeammateBoard;
			return value.update({
				battleInfo: {
					...value.battleInfo,
					playerTeammateBoard: value.battleInfo.playerBoard,
					playerBoard: tmp!,
				},
			});
		} else {
			const tmp = value.battleInfo.opponentTeammateBoard;
			return value.update({
				battleInfo: {
					...value.battleInfo,
					opponentTeammateBoard: value.battleInfo.opponentBoard,
					opponentBoard: tmp!,
				},
			});
		}
	}

	public addMinion(value: BgsFaceOffWithSimulation, side: Side, entity: BoardEntity): BgsFaceOffWithSimulation {
		if (!value.battleInfo) {
			return value;
		}

		return side === 'player'
			? value.update({
					battleInfo: {
						...value.battleInfo,
						playerBoard: {
							...value.battleInfo.playerBoard,
							board: [...value.battleInfo.playerBoard.board, entity],
						},
					},
			  })
			: value.update({
					battleInfo: {
						...value.battleInfo,
						opponentBoard: {
							...value.battleInfo.opponentBoard,
							board: [...value.battleInfo.opponentBoard.board, entity],
						},
					},
			  });
	}

	public removeMinion(value: BgsFaceOffWithSimulation, side: Side, index: number): BgsFaceOffWithSimulation {
		if (!value.battleInfo) {
			return value;
		}

		return side === 'player'
			? value.update({
					battleInfo: {
						...value.battleInfo,
						playerBoard: {
							...value.battleInfo.playerBoard,
							board: value.battleInfo.playerBoard.board.filter((e, i) => i !== index),
						},
					},
			  })
			: value.update({
					battleInfo: {
						...value.battleInfo,
						opponentBoard: {
							...value.battleInfo.opponentBoard,
							board: value.battleInfo.opponentBoard.board.filter((e, i) => i !== index),
						},
					},
			  });
	}

	public updateMinion(
		value: BgsFaceOffWithSimulation,
		side: Side,
		index: number,
		entity: BoardEntity | null,
	): BgsFaceOffWithSimulation {
		if (!value.battleInfo || !entity) {
			return value;
		}

		return side === 'player'
			? value.update({
					battleInfo: {
						...value.battleInfo,
						playerBoard: {
							...value.battleInfo.playerBoard,
							board: value.battleInfo.playerBoard.board.map((e, i) => (i === index ? entity : e)),
						},
					},
			  })
			: value.update({
					battleInfo: {
						...value.battleInfo,
						opponentBoard: {
							...value.battleInfo.opponentBoard,
							board: value.battleInfo.opponentBoard.board.map((e, i) => (i === index ? entity : e)),
						},
					},
			  });
	}

	public updateBoard(
		value: BgsFaceOffWithSimulation,
		side: Side,
		board: readonly Entity[],
	): BgsFaceOffWithSimulation {
		if (!value.battleInfo) {
			return value;
		}

		const newBoard = this.buildBoard(side, board);
		return side === 'player'
			? value.update({
					battleInfo: {
						...value.battleInfo,
						playerBoard: {
							...value.battleInfo.playerBoard,
							board: newBoard,
						},
					},
			  })
			: value.update({
					battleInfo: {
						...value.battleInfo,
						opponentBoard: {
							...value.battleInfo.opponentBoard,
							board: newBoard,
						},
					},
			  });
	}

	private buildBoard(side: Side, entities: readonly Entity[]): BoardEntity[] {
		const result = (entities ?? []).map((entity) => this.buildEntity(side, entity));
		return result;
	}

	private buildEntity(side: Side, entity: Entity): BoardEntity {
		return {
			entityId: entity.id,
			cardId: entity.cardID,
			attack: entity.getTag(GameTag.ATK),
			health: entity.getTag(GameTag.HEALTH),
			divineShield: entity.getTag(GameTag.DIVINE_SHIELD) === 1,
			friendly: side === 'player',
			windfury: entity.getTag(GameTag.WINDFURY) === 1 || entity.getTag(GameTag.MEGA_WINDFURY) === 1,
			stealth: entity.getTag(GameTag.STEALTH) === 1,
			poisonous: entity.getTag(GameTag.POISONOUS) === 1,
			venomous: entity.getTag(GameTag.VENOMOUS) === 1,
			reborn: entity.getTag(GameTag.REBORN) === 1,
			taunt: entity.getTag(GameTag.TAUNT) === 1,
			enchantments: entity['enchantments'],
			definitelyDead: false,
			immuneWhenAttackCharges: 0,
		};
	}
}
