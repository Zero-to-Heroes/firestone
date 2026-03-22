import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventProvider, GameEventHelper } from '../game-event';
import { Node, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class ResourcesUsedThisTurnParser implements ActionParser {
	readonly ParserName = 'ResourcesUsedThisTurnParser';

	private GameState: GameState;
	private ParserState: ParserState;
	private StateFacade: StateFacade;

	constructor(parserState: ParserState, facade: StateFacade) {
		this.ParserState = parserState;
		this.GameState = parserState.GameState;
		this.StateFacade = facade;
	}

	AppliesOnNewNode(node: Node, stateType: StateType): boolean {
		return (
			stateType === StateType.PowerTaskList &&
			node.Type === TagChange &&
			((node.Object as TagChange).Name === (GameTag.RESOURCES_USED as number) ||
				(node.Object as TagChange).Name === (GameTag.TEMP_RESOURCES as number) ||
				(node.Object as TagChange).Name === (GameTag.RESOURCES as number))
		);
	}

	AppliesOnCloseNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		if (this.ParserState.IsBattlegrounds() && this.ParserState.InCombatPhase()) {
			return null;
		}

		const tagChange = node.Object as TagChange;
		const entity = this.GameState.CurrentEntities.get(tagChange.Entity)!;
		if (entity.CardId === CardIds.TagtransferplayerenchantDntEnchantment_Bacon_TagTransferPlayerE) {
			return null;
		}

		const resourcesUsed =
			tagChange.Name === (GameTag.RESOURCES_USED as number)
				? tagChange.Value
				: entity.GetTag(GameTag.RESOURCES_USED, 0);
		const tempResources =
			tagChange.Name === (GameTag.TEMP_RESOURCES as number)
				? tagChange.Value
				: entity.GetTag(GameTag.TEMP_RESOURCES, 0);
		const totalResources =
			tagChange.Name === (GameTag.RESOURCES as number)
				? tagChange.Value
				: entity.GetTag(GameTag.RESOURCES, 0);
		const resourcesLeft = totalResources + tempResources - resourcesUsed;
		const controllerId = entity.GetEffectiveController();
		return [
			GameEventProvider.Create(
				tagChange.TimeStamp,
				'RESOURCES_UPDATED',
				GameEventHelper.CreateProvider(
					'RESOURCES_UPDATED',
					null as any,
					controllerId,
					entity.Id,
					this.StateFacade,
					{
						ResourcesTotal: totalResources + tempResources,
						ResourcesUsed: resourcesUsed,
						ResourcesLeft: resourcesLeft,
					},
				),
				true,
				node,
			),
		];
	}

	CreateGameEventProviderFromClose(_node: Node): GameEventProvider[] | null {
		return null;
	}
}
