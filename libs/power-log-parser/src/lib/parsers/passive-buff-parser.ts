import { CardType, GameTag, Zone } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventHelper, GameEventProvider } from '../game-event';
import { Node, NodeType, ShowEntity, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class PassiveBuffParser implements ActionParser {
	readonly ParserName = 'PassiveBuffParser';

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
			node.Type === NodeType.TagChange &&
			(node.Object as TagChange).Name === (GameTag.ZONE as number) &&
			(node.Object as TagChange).Value === (Zone.PLAY as number)
		);
	}

	AppliesOnCloseNode(node: Node, stateType: StateType): boolean {
		return (
			stateType === StateType.PowerTaskList &&
			node.Type === NodeType.ShowEntity &&
			(node.Object as ShowEntity).IsInPlay() &&
			(node.Object as ShowEntity).GetTag(GameTag.DUNGEON_PASSIVE_BUFF) === 1 &&
			(node.Object as ShowEntity).GetTag(GameTag.CARDTYPE) === (CardType.SPELL as number)
		);
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const tagChange = node.Object as TagChange;
		const entity = this.GameState.CurrentEntities.get(tagChange.Entity)!;
		const cardId = entity.CardId;
		const controllerId = entity.GetEffectiveController();
		if (
			this.ParserState.GetTagFromList(entity.Tags, GameTag.DUNGEON_PASSIVE_BUFF) === 1 &&
			this.ParserState.GetTagFromList(entity.Tags, GameTag.CARDTYPE) !== (CardType.ENCHANTMENT as number)
		) {
			return [
				GameEventProvider.Create(
					tagChange.TimeStamp,
					'PASSIVE_BUFF',
					GameEventHelper.CreateProvider(
						'PASSIVE_BUFF',
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
		const showEntity = node.Object as ShowEntity;
		const cardId = showEntity.CardId;
		const controllerId = showEntity.GetEffectiveController();
		return [
			GameEventProvider.Create(
				showEntity.TimeStamp,
				'PASSIVE_BUFF',
				GameEventHelper.CreateProvider(
					'PASSIVE_BUFF',
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
