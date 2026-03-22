import { CardType, GameTag, Zone } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventProvider, GameEventHelper } from '../game-event';
import { Node, ShowEntity, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class HeroEnchantmentAttachedParser implements ActionParser {
	readonly ParserName = 'HeroEnchantmentAttachedParser';

	private GameState: GameState;
	private ParserState: ParserState;
	private StateFacade: StateFacade;

	constructor(parserState: ParserState, stateFacade: StateFacade) {
		this.ParserState = parserState;
		this.GameState = parserState.GameState;
		this.StateFacade = stateFacade;
	}

	AppliesOnNewNode(node: Node, stateType: StateType): boolean {
		if (stateType !== StateType.PowerTaskList || node.Type !== TagChange) {
			return false;
		}
		const tagChange = node.Object as TagChange;
		return (
			tagChange.Name === (GameTag.ZONE as number) &&
			tagChange.Value === (Zone.PLAY as number) &&
			this.GameState.CurrentEntities.get(tagChange.Entity)?.GetCardType() === (CardType.ENCHANTMENT as number) &&
			this.GameState.CurrentEntities.get(tagChange.Entity)!.GetZone() !== (Zone.PLAY as number)
		);
	}

	AppliesOnCloseNode(node: Node, stateType: StateType): boolean {
		return (
			stateType === StateType.PowerTaskList &&
			node.Type === ShowEntity &&
			(node.Object as ShowEntity).GetTag(GameTag.ATTACHED) > 0 &&
			(node.Object as ShowEntity).GetTag(GameTag.ZONE) === (Zone.PLAY as number)
		);
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const tagChange = node.Object as TagChange;
		const entity = this.GameState.CurrentEntities.get(tagChange.Entity);
		const creatorEntityId = entity?.GetTag(GameTag.CREATOR) ?? -1;
		const creatorEntity = this.GameState.CurrentEntities.get(creatorEntityId);
		const cardId = entity!.CardId;
		const controllerId = entity!.GetEffectiveController();
		const attachedToEntityId = entity!.GetTag(GameTag.ATTACHED);
		const attachedToEntity = this.GameState.CurrentEntities.get(attachedToEntityId);
		if (attachedToEntity == null) {
			return null;
		}

		if (
			attachedToEntityId !== this.StateFacade.LocalPlayer!.Id &&
			attachedToEntityId !== this.StateFacade.OpponentPlayer!.Id &&
			attachedToEntity.GetCardType() !== (CardType.HERO as number) &&
			attachedToEntity.GetCardType() !== (CardType.HERO_POWER as number)
		) {
			return null;
		}

		const tags = entity!.GetTagsCopy();
		return [
			GameEventProvider.Create(
				tagChange.TimeStamp,
				'ENCHANTMENT_ATTACHED',
				GameEventHelper.CreateProvider('ENCHANTMENT_ATTACHED', cardId, controllerId, entity!.Entity, this.StateFacade, {
					AttachedTo: attachedToEntityId,
					Tags: tags,
					CreatorEntityId: creatorEntity?.Entity,
					CreatorCardId: creatorEntity?.CardId,
				}),
				true,
				node,
			),
		];
	}

	CreateGameEventProviderFromClose(node: Node): GameEventProvider[] | null {
		const showEntity = node.Object as ShowEntity;
		const attachedTo = showEntity.GetTag(GameTag.ATTACHED);
		const attachedToEntity = this.GameState.CurrentEntities.get(attachedTo);
		const creatorEntityId = showEntity.GetTag(GameTag.CREATOR);
		const creatorEntity = this.GameState.CurrentEntities.get(creatorEntityId);
		const cardId = showEntity.CardId;
		const controllerId = showEntity.GetEffectiveController();
		if (
			attachedTo !== this.StateFacade.LocalPlayer!.Id &&
			attachedTo !== this.StateFacade.OpponentPlayer!.Id &&
			attachedToEntity!.GetCardType() !== (CardType.HERO as number) &&
			attachedToEntity!.GetCardType() !== (CardType.HERO_POWER as number)
		) {
			return null;
		}

		const tags = showEntity.GetTagsCopy();
		return [
			GameEventProvider.Create(
				showEntity.TimeStamp,
				'ENCHANTMENT_ATTACHED',
				GameEventHelper.CreateProvider(
					'ENCHANTMENT_ATTACHED',
					cardId,
					controllerId,
					showEntity.Entity,
					this.StateFacade,
					{
						AttachedTo: attachedTo,
						Tags: tags,
						CreatorEntityId: creatorEntityId,
						CreatorCardId: creatorEntity?.CardId,
					},
				),
				true,
				node,
			),
		];
	}
}
