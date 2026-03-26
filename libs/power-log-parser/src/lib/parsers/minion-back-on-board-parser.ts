import { CardType, GameTag, Zone } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventProvider, GameEventHelper } from '../game-event';
import { Node, TagChange } from '../models';
import { Oracle } from '../oracle';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class MinionBackOnBoardParser implements ActionParser {
	readonly ParserName = 'MinionBackOnBoardParser';

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
			(node.Object as TagChange).Value === (Zone.PLAY as number) &&
			(this.GameState.CurrentEntities.get((node.Object as TagChange).Entity)!.GetTag(GameTag.ZONE) ===
				(Zone.REMOVEDFROMGAME as number) ||
				this.GameState.CurrentEntities.get((node.Object as TagChange).Entity)!.GetTag(GameTag.ZONE) ===
					(Zone.SETASIDE as number))
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
		if (!entity.IsMinionLike()) {
			return null;
		}
		if (
			this.GameState.CurrentEntities.get(tagChange.Entity)!.GetTag(GameTag.CARDTYPE) !==
			(CardType.ENCHANTMENT as number)
		) {
			const creatorCardId = Oracle.GetCreatorFromTags(this.GameState, entity, node);
			return [
				GameEventProvider.Create(
					tagChange.TimeStamp,
					'MINION_BACK_ON_BOARD',
					GameEventHelper.CreateProvider(
						'MINION_BACK_ON_BOARD',
						cardId,
						controllerId,
						entity.Id,
						this.StateFacade,
						{
							CreatorCardId: creatorCardId,
						},
					),
					true,
					node,
				),
			];
		}
		return null;
	}

	CreateGameEventProviderFromClose(_node: Node): GameEventProvider[] | null {
		return null;
	}
}
