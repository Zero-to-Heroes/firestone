import { CardType, GameTag, Zone } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventProvider, GameEventHelper } from '../game-event';
import { ShowEntity } from '../models/action';
import { Node, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class SecretPlayedFromDeckParser implements ActionParser {
	readonly ParserName = 'SecretPlayedFromDeckParser';

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
			(node.Object as TagChange).Value === (Zone.SECRET as number) &&
			this.GameState.CurrentEntities.get((node.Object as TagChange).Entity)?.GetTag(GameTag.ZONE) ===
				(Zone.DECK as number)
		);
	}

	AppliesOnCloseNode(node: Node, stateType: StateType): boolean {
		const appliesToShowEntity =
			node.Type === ShowEntity &&
			(node.Object as ShowEntity).GetTag(GameTag.ZONE) === (Zone.SECRET as number) &&
			this.GameState.CurrentEntities.has((node.Object as ShowEntity).Entity) &&
			this.GameState.CurrentEntities.get((node.Object as ShowEntity).Entity)!.GetTag(GameTag.ZONE) ===
				(Zone.DECK as number);
		return stateType === StateType.PowerTaskList && appliesToShowEntity;
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const tagChange = node.Object as TagChange;
		const entity = this.GameState.CurrentEntities.get(tagChange.Entity)!;
		const cardId = entity.CardId;
		const controllerId = entity.GetEffectiveController();
		if (
			entity.GetTag(GameTag.CARDTYPE) !== (CardType.ENCHANTMENT as number) &&
			entity.GetTag(GameTag.SIGIL) !== 1
		) {
			const playerClass = entity.GetPlayerClass();
			const eventName =
				this.GameState.CurrentEntities.get(tagChange.Entity)!.GetTag(GameTag.SECRET) === 1
					? 'SECRET_PLAYED_FROM_DECK'
					: 'QUEST_PLAYED_FROM_DECK';
			return [
				GameEventProvider.Create(
					tagChange.TimeStamp,
					eventName,
					GameEventHelper.CreateProvider(eventName, cardId, controllerId, entity.Id, this.StateFacade, {
						PlayerClass: playerClass,
					}),
					true,
					node,
				),
			];
		}
		return null;
	}

	CreateGameEventProviderFromClose(node: Node): GameEventProvider[] | null {
		const showEntity = node.Object as ShowEntity;
		if (showEntity.GetTag(GameTag.SIGIL) === 1) {
			return null;
		}

		const cardId = showEntity.CardId;
		const controllerId = showEntity.GetEffectiveController();
		const playerClass = showEntity.GetPlayerClass();
		const eventName =
			showEntity.GetTag(GameTag.SECRET) === 1 ? 'SECRET_PLAYED_FROM_DECK' : 'QUEST_PLAYED_FROM_DECK';

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
