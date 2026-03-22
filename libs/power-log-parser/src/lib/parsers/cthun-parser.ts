import { BlockType, CardIds, GameTag } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventProvider, GameEventHelper } from '../game-event';
import { Action, Node, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class CthunParser implements ActionParser {
	readonly ParserName = 'CthunParser';

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
			((node.Object as TagChange).Name === (GameTag.CTHUN_ATTACK_BUFF as number) ||
				(node.Object as TagChange).Name === (GameTag.CTHUN_HEALTH_BUFF as number))
		);
	}

	AppliesOnCloseNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		if (node.Parent != null && node.Parent.Type === Action) {
			const parentAction = node.Parent.Object as Action;
			if (this.GameState.CurrentEntities.has(parentAction.Entity)) {
				const parentEntity = this.GameState.CurrentEntities.get(parentAction.Entity)!;
				if (
					parentAction.Type === (BlockType.POWER as number) &&
					parentEntity.CardId === CardIds.TheCavernsBelow_CrystalCoreToken
				) {
					return null;
				}
			}
		}

		const tagChange = node.Object as TagChange;
		const entity = this.GameState.CurrentEntities.get(tagChange.Entity)!;
		const controllerId = entity.GetEffectiveController();
		return [
			GameEventProvider.Create(
				tagChange.TimeStamp,
				'CTHUN',
				GameEventHelper.CreateProvider('CTHUN', null as any, controllerId, entity.Id, this.StateFacade, {
					CthuAtk:
						tagChange.Name === (GameTag.CTHUN_ATTACK_BUFF as number) ? tagChange.Value : null,
					CthuHealth:
						tagChange.Name === (GameTag.CTHUN_HEALTH_BUFF as number) ? tagChange.Value : null,
				}),
				true,
				node,
			),
		];
	}

	CreateGameEventProviderFromClose(_node: Node): GameEventProvider[] | null {
		return null;
	}
}
