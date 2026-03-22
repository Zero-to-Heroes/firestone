import { BlockType, CardType, GameTag, Zone } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventProvider, GameEventHelper } from '../game-event';
import { Action, ShowEntity } from '../models/action';
import { Node } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class DeathrattleTriggeredParser implements ActionParser {
	readonly ParserName = 'DeathrattleTriggeredParser';

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
			!this.ParserState.IsBattlegrounds() &&
			node.Type === Action &&
			(node.Object as Action).Type === (BlockType.TRIGGER as number) &&
			(node.Object as Action).TriggerKeyword === (GameTag.DEATHRATTLE as number)
		);
	}

	AppliesOnCloseNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const action = node.Object as Action;
		const entity = this.GameState.CurrentEntities.get(action.Entity)!;
		const cardId = entity.CardId;
		const controllerId = entity.GetEffectiveController();
		if (
			this.GameState.CurrentEntities.get(action.Entity)!.GetTag(GameTag.CARDTYPE) !==
			(CardType.ENCHANTMENT as number)
		) {
			return [
				GameEventProvider.Create(
					action.TimeStamp,
					'DEATHRATTLE_TRIGGERED',
					GameEventHelper.CreateProvider(
						'DEATHRATTLE_TRIGGERED',
						cardId,
						controllerId,
						entity.Id,
						this.StateFacade,
					),
					true,
					node,
				),
			];
		}
		return null;
	}

	CreateGameEventProviderFromClose(node: Node): GameEventProvider[] | null {
		const action = node.Object as Action;
		for (const data of action.Data) {
			if (data instanceof ShowEntity) {
				const showEntity = data as ShowEntity;
				if (
					showEntity.GetTag(GameTag.ZONE) === (Zone.SECRET as number) &&
					showEntity.GetTag(GameTag.CARDTYPE) !== (CardType.ENCHANTMENT as number) &&
					showEntity.GetTag(GameTag.SIGIL) !== 1
				) {
					const cardId = showEntity.CardId;
					const controllerId = showEntity.GetEffectiveController();
					return [
						GameEventProvider.Create(
							action.TimeStamp,
							'SECRET_PLAYED',
							GameEventHelper.CreateProvider(
								'SECRET_PLAYED',
								cardId,
								controllerId,
								showEntity.Entity,
								this.StateFacade,
							),
							true,
							node,
						),
					];
				}
			}
		}
		return null;
	}
}
