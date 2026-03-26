import { GameTag } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventProvider, GameEventHelper } from '../game-event';
import { Node, NodeType, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class MercenariesQueuedAbilityParser implements ActionParser {
	readonly ParserName = 'MercenariesQueuedAbilityParser';

	private GameState: GameState;
	private StateFacade: StateFacade;

	constructor(parserState: ParserState, stateFacade: StateFacade) {
		this.GameState = parserState.GameState;
		this.StateFacade = stateFacade;
	}

	AppliesOnNewNode(node: Node, stateType: StateType): boolean {
		if (stateType !== StateType.PowerTaskList || node.Type !== NodeType.TagChange) {
			return false;
		}
		const tagChange = node.Object as TagChange;
		return (
			tagChange.Name === (GameTag.LETTUCE_ABILITY_TILE_VISUAL_ALL_VISIBLE as number) ||
			tagChange.Name === (GameTag.LETTUCE_ABILITY_TILE_VISUAL_SELF_ONLY as number)
		);
	}

	AppliesOnCloseNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const tagChange = node.Object as TagChange;
		const entity = this.GameState.CurrentEntities.get(tagChange.Entity)!;
		const cardId = entity.CardId;
		const controllerId = entity.GetEffectiveController();

		if (tagChange.Value === 0) {
			return [
				GameEventProvider.Create(
					tagChange.TimeStamp,
					'MERCENARIES_ABILITY_UNQUEUED',
					GameEventHelper.CreateProvider(
						'MERCENARIES_ABILITY_UNQUEUED',
						cardId,
						controllerId,
						entity.Id,
						this.StateFacade,
						null,
					),
					true,
					node,
				),
			];
		} else {
			const abilityEntityId = tagChange.Value;
			const abilityEntity = this.GameState.CurrentEntities.has(abilityEntityId)
				? this.GameState.CurrentEntities.get(abilityEntityId)!
				: null;
			const abilityCardId = abilityEntity?.CardId;
			const abilitySpeed = abilityEntity?.GetTag(GameTag.COST) ?? 0;
			if (
				controllerId === this.StateFacade.LocalPlayer?.PlayerId &&
				tagChange.Name === (GameTag.LETTUCE_ABILITY_TILE_VISUAL_ALL_VISIBLE as number)
			) {
				return null;
			}
			return [
				GameEventProvider.Create(
					tagChange.TimeStamp,
					'MERCENARIES_ABILITY_QUEUED',
					GameEventHelper.CreateProvider(
						'MERCENARIES_ABILITY_QUEUED',
						cardId,
						controllerId,
						entity.Id,
						this.StateFacade,
						{
							AbillityEntityId: abilityEntityId,
							AbilityCardId: abilityCardId,
							AbilitySpeed: abilitySpeed,
						},
					),
					true,
					node,
				),
			];
		}
	}

	CreateGameEventProviderFromClose(_node: Node): GameEventProvider[] | null {
		return null;
	}
}
