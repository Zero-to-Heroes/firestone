import { CardIds, GameTag, Zone } from '@firestone-hs/reference-data';
import { EntityLike, getEffectiveController, getEntityTag, getEntitiesInZone } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '@firestone/game-state';
import {
	BattleMercenary,
	BattleSpeedModifier,
	MercenariesBattleState,
	MercenariesBattleTeam,
} from '../../../models/mercenaries/mercenaries-battle-state';
import { sumOnArray } from '../../utils';
import {
	BUFF_SPEED_MODIFIER_ENCHANTMENTS,
	DEBUFF_SPEED_MODIFIER_ENCHANTMENTS,
	normalizeMercenariesCardId,
} from '@firestone/mercenaries/common';
import { MercenariesParser } from './_mercenaries-parser';

export class MercenariesBuffsParser implements MercenariesParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	public eventType = () => GameEvent.TURN_START;

	public applies = (battleState: MercenariesBattleState) => !!battleState;

	public async parse(battleState: MercenariesBattleState, event: GameEvent): Promise<MercenariesBattleState> {
		// Mercenaries game state is no longer available via events - this parser is effectively a no-op
		return battleState;
	}

	private updateTeam(
		playerTeam: MercenariesBattleTeam,
		playerBoard: readonly EntityLike[],
		playerAbilities: readonly EntityLike[],
	) {
		if (!playerBoard || !playerTeam || !playerAbilities) {
			return playerTeam;
		}

		for (const mercenary of playerTeam.mercenaries ?? []) {
			const playerEntity =
				playerBoard.find((a) => a.Id === mercenary.entityId) ??
				playerBoard.find(
					(a) => normalizeMercenariesCardId(a.CardId) === normalizeMercenariesCardId(mercenary.cardId),
				);
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
					playerAbilities.find((a) => a.Id === ability.entityId) ??
					playerAbilities.find(
						(a) => normalizeMercenariesCardId(a.CardId) === normalizeMercenariesCardId(ability.cardId),
					);
				if (!playerAbility) {
					return ability;
				}
				const speedModifier = this.buildSpeedModifier(playerAbility, playerEntity);
				return ability.update({
					speedModifier: speedModifier,
				});
			});
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

	private buildSpeedModifier(boardEntity: EntityLike, playerEntity: EntityLike | null): BattleSpeedModifier {
		if (!boardEntity) {
			return null;
		}

		const enchantments: EntityLike[] = [];
		const debuffs = enchantments
			.filter((e) => DEBUFF_SPEED_MODIFIER_ENCHANTMENTS.includes(e.CardId as CardIds))
			.filter((e) => !!getEntityTag(e, GameTag.TAG_SCRIPT_DATA_NUM_1));
		const buffs = enchantments
			.filter((e) => {
				const mappedEnchantment = BUFF_SPEED_MODIFIER_ENCHANTMENTS.find(
					(b) => b.enchantment === (e.CardId as CardIds),
				);
				return (
					!!mappedEnchantment &&
					(!mappedEnchantment?.targets?.length || mappedEnchantment.targets.includes(boardEntity.CardId))
				);
			})
			.filter((e) => !!getEntityTag(e, GameTag.TAG_SCRIPT_DATA_NUM_1));
		const debuffValue = sumOnArray(
			debuffs,
			(buff) => getEntityTag(buff, GameTag.TAG_SCRIPT_DATA_NUM_1, 0),
		);
		const buffValue = sumOnArray(
			buffs,
			(buff) => getEntityTag(buff, GameTag.TAG_SCRIPT_DATA_NUM_1, 0),
		);
		return !!buffValue || !!debuffValue
			? {
					value: debuffValue - buffValue,
					influences: [
						...debuffs.map((buff) => ({
							cardId: buff.CardId,
							value: getEntityTag(buff, GameTag.TAG_SCRIPT_DATA_NUM_1, 0),
						})),
						...buffs.map((buff) => ({
							cardId: buff.CardId,
							value: -getEntityTag(buff, GameTag.TAG_SCRIPT_DATA_NUM_1, 0),
						})),
					],
				}
			: null;
	}
}
