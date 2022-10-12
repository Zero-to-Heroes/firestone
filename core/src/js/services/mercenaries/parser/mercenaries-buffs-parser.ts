import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { EntityGameState, GameEvent } from '../../../models/game-event';
import {
	BattleMercenary,
	BattleSpeedModifier,
	MercenariesBattleState,
	MercenariesBattleTeam,
} from '../../../models/mercenaries/mercenaries-battle-state';
import { CardsFacadeService } from '../../cards-facade.service';
import { sumOnArray } from '../../utils';
import {
	BUFF_SPEED_MODIFIER_ENCHANTMENTS,
	DEBUFF_SPEED_MODIFIER_ENCHANTMENTS,
	normalizeMercenariesCardId,
} from '../mercenaries-utils';
import { MercenariesParser } from './_mercenaries-parser';

export class MercenariesBuffsParser implements MercenariesParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	public eventType = () => GameEvent.TURN_START;

	public applies = (battleState: MercenariesBattleState) => !!battleState;

	public async parse(battleState: MercenariesBattleState, event: GameEvent): Promise<MercenariesBattleState> {
		// console.debug('processing turn start', event, battleState);
		const gameState = event.gameState;
		if (!gameState) {
			console.warn('missing game state on turn start event', event);
			return battleState;
		}

		const playerBoard = gameState.Player?.Board;
		const playerAbilities = gameState.Player?.LettuceAbilities;

		const opponentBoard = gameState.Opponent?.Board;
		const opponentAbilities = gameState.Opponent?.LettuceAbilities;

		const playerTeam = this.updateTeam(battleState.playerTeam, playerBoard, playerAbilities);
		const opponentTeam = this.updateTeam(battleState.opponentTeam, opponentBoard, opponentAbilities);

		// console.debug('returning teams', playerTeam, opponentTeam);
		return battleState.update({
			playerTeam: playerTeam,
			opponentTeam: opponentTeam,
		});
	}

	private updateTeam(
		playerTeam: MercenariesBattleTeam,
		playerBoard: readonly EntityGameState[],
		playerAbilities: readonly EntityGameState[],
	) {
		if (!playerBoard || !playerTeam || !playerAbilities) {
			return playerTeam;
		}

		for (const mercenary of playerTeam.mercenaries ?? []) {
			const playerEntity =
				playerBoard.find((a) => a.entityId === mercenary.entityId) ??
				playerBoard.find(
					(a) => normalizeMercenariesCardId(a.cardId) === normalizeMercenariesCardId(mercenary.cardId),
				);
			// Just a normal case where we're considering an entity that isn't on the board
			if (!playerEntity) {
				if (mercenary.inPlay) {
					console.warn('Merc in play, should have found something', mercenary, playerBoard);
				}
				playerTeam = playerTeam.updateMercenary(
					mercenary.entityId,
					BattleMercenary.create({ speedModifier: null }),
				);
				continue;
			}

			const abilities = mercenary.abilities.map((ability) => {
				const playerAbility =
					playerAbilities.find((a) => a.entityId === ability.entityId) ??
					playerAbilities.find(
						(a) => normalizeMercenariesCardId(a.cardId) === normalizeMercenariesCardId(ability.cardId),
					);
				// Typically can happen for opposing mercs unrevealed abilities
				if (!playerAbility) {
					console.debug('could not find player ability', ability, playerAbilities);
					return ability;
				}
				// const speedDiff =
				// 	playerAbility.tags?.find((tag) => tag.Name === GameTag.COST)?.Value ??
				// 	ability.speed - ability.speed;
				const speedModifier = this.buildSpeedModifier(playerAbility, playerEntity);
				// if ((speedModifier?.value ?? 0) !== (speedDiff ?? 0)) {
				// 	console.warn('incompatible computations', speedModifier, speedDiff, playerAbility, ability);
				// }
				return ability.update({
					// speed: playerAbility.tags?.find((tag) => tag.Name === GameTag.COST)?.Value ?? ability.speed,
					speedModifier: speedModifier,
				});
			});
			// console.debug('ability buff', this.allCards.getCard(mercenary.cardId).name, mercenary, abilities);
			playerTeam = playerTeam.updateMercenary(
				mercenary.entityId,
				BattleMercenary.create({
					speedModifier: this.buildSpeedModifier(playerEntity, null),
					abilities: abilities,
				}),
			);
		}
		return playerTeam;
	}

	private buildSpeedModifier(boardEntity: EntityGameState, playerEntity: EntityGameState): BattleSpeedModifier {
		if (!boardEntity) {
			return null;
		}

		console.debug(
			'computing buffs for',
			this.allCards.getCard(boardEntity.cardId).name,
			boardEntity.cardId,
			boardEntity,
		);
		const enchantments = [...(boardEntity.enchantments ?? []), ...(playerEntity?.enchantments ?? [])];
		const debuffs = enchantments
			.filter((e) => DEBUFF_SPEED_MODIFIER_ENCHANTMENTS.includes(e.cardId as CardIds))
			.filter((e) => !!e.tags.find((tag) => tag.Name === GameTag.TAG_SCRIPT_DATA_NUM_1)?.Value);
		const buffs = enchantments
			.filter((e) => {
				const mappedEnchantment = BUFF_SPEED_MODIFIER_ENCHANTMENTS.find(
					(b) => b.enchantment === (e.cardId as CardIds),
				);
				return (
					!!mappedEnchantment &&
					(!mappedEnchantment?.targets?.length || mappedEnchantment.targets.includes(boardEntity.cardId))
				);
			})
			.filter((e) => !!e.tags.find((tag) => tag.Name === GameTag.TAG_SCRIPT_DATA_NUM_1)?.Value);
		console.debug('buffs', buffs, boardEntity);
		const debuffValue = sumOnArray(
			debuffs,
			(buff) => buff.tags.find((tag) => tag.Name === GameTag.TAG_SCRIPT_DATA_NUM_1).Value ?? 0,
		);
		const buffValue = sumOnArray(
			buffs,
			(buff) => buff.tags.find((tag) => tag.Name === GameTag.TAG_SCRIPT_DATA_NUM_1).Value ?? 0,
		);
		console.debug('buffValue', buffValue, debuffValue);
		return !!buffValue || !!debuffValue
			? {
					value: debuffValue - buffValue,
					influences: [
						...debuffs.map((buff) => ({
							cardId: buff.cardId,
							value: buff.tags.find((tag) => tag.Name === GameTag.TAG_SCRIPT_DATA_NUM_1).Value,
						})),
						...buffs.map((buff) => ({
							cardId: buff.cardId,
							value: -buff.tags.find((tag) => tag.Name === GameTag.TAG_SCRIPT_DATA_NUM_1).Value,
						})),
					],
			  }
			: null;
	}
}
