import { CardType, GameTag, Zone } from '@firestone-hs/reference-data';
import { ParserGameTag } from '../enums';
import { ActionParser } from '../action-parser';
import { GameEventProvider, GameEventHelper } from '../game-event';
import { ShowEntity } from '../models/action';
import { Node, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class SecretDestroyedParser implements ActionParser {
	readonly ParserName = 'SecretDestroyedParser';

	private GameState: GameState;
	private StateFacade: StateFacade;

	constructor(parserState: ParserState, stateFacade: StateFacade) {
		this.GameState = parserState.GameState;
		this.StateFacade = stateFacade;
	}

	AppliesOnNewNode(node: Node, stateType: StateType): boolean {
		return (
			stateType === StateType.PowerTaskList &&
			node.Type === TagChange &&
			(node.Object as TagChange).Name === (GameTag.ZONE as number) &&
			((node.Object as TagChange).Value === (Zone.GRAVEYARD as number) ||
				(node.Object as TagChange).Value === (Zone.REMOVEDFROMGAME as number) ||
				(node.Object as TagChange).Value === (Zone.SETASIDE as number)) &&
			this.GameState.CurrentEntities.get((node.Object as TagChange).Entity)?.GetTag(GameTag.ZONE) ===
				(Zone.SECRET as number)
		);
	}

	AppliesOnCloseNode(node: Node, stateType: StateType): boolean {
		const appliesToShowEntity =
			node.Type === ShowEntity &&
			((node.Object as ShowEntity).GetTag(GameTag.ZONE) === (Zone.GRAVEYARD as number) ||
				(node.Object as ShowEntity).GetTag(GameTag.ZONE) === (Zone.REMOVEDFROMGAME as number)) &&
			this.GameState.CurrentEntities.has((node.Object as ShowEntity).Entity) &&
			this.GameState.CurrentEntities.get((node.Object as ShowEntity).Entity)!.GetTag(GameTag.ZONE) ===
				(Zone.SECRET as number);
		return stateType === StateType.PowerTaskList && appliesToShowEntity;
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const tagChange = node.Object as TagChange;
		const entity = this.GameState.CurrentEntities.get(tagChange.Entity)!;
		if (entity.GetTag(ParserGameTag.SECRET_HAS_TRIGGERED) === 1) {
			return null;
		}
		const cardId = entity.CardId;
		const controllerId = entity.GetEffectiveController();
		if (tagChange.Value === (Zone.SETASIDE as number) && entity.GetZone() !== (Zone.SECRET as number)) {
			return null;
		}

		const eventName = entity.GetTag(GameTag.SECRET) === 1 ? 'SECRET_DESTROYED' : 'QUEST_DESTROYED';
		return [
			GameEventProvider.Create(
				tagChange.TimeStamp,
				eventName,
				GameEventHelper.CreateProvider(eventName, cardId, controllerId, entity.Id, this.StateFacade),
				true,
				node,
			),
		];
	}

	CreateGameEventProviderFromClose(node: Node): GameEventProvider[] | null {
		const showEntity = node.Object as ShowEntity;
		const entity = this.GameState.CurrentEntities.get(showEntity.Entity);
		if (entity == null || entity.GetTag(ParserGameTag.SECRET_HAS_TRIGGERED) === 1) {
			return null;
		}

		const cardId = showEntity.CardId;
		const controllerId = showEntity.GetTag(GameTag.CONTROLLER);
		const playerClass = showEntity.GetPlayerClass();
		const eventName = showEntity.GetTag(GameTag.SECRET) === 1 ? 'SECRET_DESTROYED' : 'QUEST_DESTROYED';
		return [
			GameEventProvider.Create(
				showEntity.TimeStamp,
				eventName,
				GameEventHelper.CreateProvider(eventName, cardId, controllerId, showEntity.Entity, this.StateFacade, {
					PlayerClass: playerClass,
				}),
				true,
				node,
			),
		];
	}
}
