import { BoardEntity } from '@firestone-hs/simulate-bgs-battle/dist/board-entity';
import { BgsFaceOffWithSimulation } from '@firestone/game-state';
import { NonFunctionProperties } from '@firestone/shared/framework/common';

export class BgsCustomSimulationState {
	public readonly faceOff: BgsFaceOffWithSimulation;
	public readonly picker: BgsCustomSimulationPicker;

	constructor() {
		this.faceOff = this.buildInitialFaceOff();
	}

	public update(base: Partial<NonFunctionProperties<BgsCustomSimulationState>>): BgsCustomSimulationState {
		return Object.assign(new BgsCustomSimulationState(), this, base);
	}

	public findEntity(side: string, minionIndex: number): BoardEntity {
		const existingSide =
			side === 'player' ? this.faceOff.battleInfo?.playerBoard : this.faceOff.battleInfo?.opponentBoard;
		return existingSide?.board[minionIndex];
	}

	public resetFaceOff(): BgsCustomSimulationState {
		return this.update({
			faceOff: this.buildInitialFaceOff(),
		} as BgsCustomSimulationState);
	}

	private buildInitialFaceOff(): BgsFaceOffWithSimulation {
		return BgsFaceOffWithSimulation.create({
			battleInfo: {
				playerBoard: {
					board: [],
					player: {
						cardId: 'TB_BaconShop_HERO_KelThuzad',
						hpLeft: 40,
						tavernTier: 6,
						heroPowerId: null,
						heroPowerUsed: true,
						heroPowerInfo: 0,
						globalInfo: {
							EternalKnightsDeadThisGame: 0,
							TavernSpellsCastThisGame: 0,
							SpellsCastThisGame: 0,
							PiratesPlayedThisGame: 0,
							PiratesSummonedThisGame: 0,
							BeastsSummonedThisGame: 0,
							MagnetizedThisGame: 0,
							UndeadAttackBonus: 0,
							HauntedCarapaceAttackBonus: 0,
							HauntedCarapaceHealthBonus: 0,
							ChoralAttackBuff: 0,
							ChoralHealthBuff: 0,
							FrostlingBonus: 0,
							AstralAutomatonsSummonedThisGame: 0,
							BloodGemAttackBonus: 0,
							BloodGemHealthBonus: 0,
							BeetleAttackBuff: 0,
							BeetleHealthBuff: 0,
							ElementalAttackBuff: 0,
							ElementalHealthBuff: 0,
							TavernSpellHealthBuff: 0,
							TavernSpellAttackBuff: 0,
							BattlecriesTriggeredThisGame: 0,
							SanlaynScribesDeadThisGame: 0,
							FriendlyMinionsDeadLastCombat: 0,
						},
						questRewards: [] as readonly string[],
					},
				},
				opponentBoard: {
					board: [],
					player: {
						cardId: 'TB_BaconShop_HERO_KelThuzad',
						hpLeft: 40,
						tavernTier: 6,
						heroPowerId: null,
						heroPowerUsed: true,
						heroPowerInfo: 0,
						globalInfo: {
							EternalKnightsDeadThisGame: 0,
							TavernSpellsCastThisGame: 0,
							SpellsCastThisGame: 0,
							PiratesPlayedThisGame: 0,
							PiratesSummonedThisGame: 0,
							BeastsSummonedThisGame: 0,
							MagnetizedThisGame: 0,
							UndeadAttackBonus: 0,
							HauntedCarapaceAttackBonus: 0,
							HauntedCarapaceHealthBonus: 0,
							ChoralAttackBuff: 0,
							ChoralHealthBuff: 0,
							FrostlingBonus: 0,
							AstralAutomatonsSummonedThisGame: 0,
							BloodGemAttackBonus: 0,
							BloodGemHealthBonus: 0,
							BeetleAttackBuff: 0,
							BeetleHealthBuff: 0,
							ElementalAttackBuff: 0,
							ElementalHealthBuff: 0,
							BattlecriesTriggeredThisGame: 0,
							SanlaynScribesDeadThisGame: 0,
							FriendlyMinionsDeadLastCombat: 0,
						},
						questRewards: [] as readonly string[],
					},
				},
				options: {
					numberOfSimulations: 8000,
					maxAcceptableDuration: 6000,
				},
				gameState: {
					// No restrictions on tribes yet
					validTribes: undefined,
					currentTurn: 0,
				},
			},
		} as BgsFaceOffWithSimulation);
	}
}

export interface BgsCustomSimulationPicker {
	readonly type: 'minion' | 'hero' | 'minion-update';
	readonly side: 'player' | 'opponent';
	readonly minionIndex?: number;
}
