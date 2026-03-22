import { GameTag } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventProvider, GameEventHelper } from '../game-event';
import { Node, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class ArmorChangeParser implements ActionParser {
	readonly ParserName = 'ArmorChangeParser';

	private GameState: GameState;
	private ParserState: ParserState;
	private StateFacade: StateFacade;

	constructor(parserState: ParserState, stateFacade: StateFacade) {
		this.ParserState = parserState;
		this.GameState = parserState.GameState;
		this.StateFacade = stateFacade;
	}

	AppliesOnNewNode(node: Node, stateType: StateType): boolean {
		return (
			stateType === StateType.PowerTaskList &&
			node.Type === TagChange &&
			(node.Object as TagChange).Name === (GameTag.ARMOR as number)
		);
	}

	AppliesOnCloseNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const tagChange = node.Object as TagChange;
		const entity = this.GameState.CurrentEntities.get(tagChange.Entity);
		if (entity == null) {
			return null;
		}

		if (!this.StateFacade.IsBattlegrounds()) {
			const controller = entity.GetController();
			const playerEntity = this.ParserState.GetPlayerForController(controller);
			const fullEntity = this.GameState.CurrentEntities.get(playerEntity!.Id);
			const heroEntity = fullEntity!.GetTag(GameTag.HERO_ENTITY);
			if (heroEntity !== tagChange.Entity) {
				return null;
			}
		}

		const initialArmor = entity.GetTag(GameTag.ARMOR, 0);
		const newArmor = tagChange.Value;
		const cardId = entity.CardId;
		const controllerId = entity.GetEffectiveController();
		return [
			GameEventProvider.Create(
				tagChange.TimeStamp,
				'ARMOR_CHANGED',
				GameEventHelper.CreateProvider('ARMOR_CHANGED', cardId, controllerId, entity.Id, this.StateFacade, {
					PlayerId: entity.GetTag(GameTag.PLAYER_ID),
					ArmorChange: newArmor - initialArmor,
					TotalArmor: newArmor,
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
