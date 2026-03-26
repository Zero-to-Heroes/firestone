import { BlockType, CardType, GameTag, Zone } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventHelper, GameEventProvider } from '../game-event';
import { Action, Node, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class BattlegroundsHeroKilledParser implements ActionParser {
	readonly ParserName = 'BattlegroundsHeroKilledParser';

	private GameState: GameState;
	private ParserState: ParserState;
	private StateFacade: StateFacade;

	constructor(parserState: ParserState, helper: StateFacade) {
		this.ParserState = parserState;
		this.GameState = parserState.GameState;
		this.StateFacade = helper;
	}

	AppliesOnNewNode(node: Node, stateType: StateType): boolean {
		return (
			stateType === StateType.PowerTaskList &&
			this.StateFacade.IsBattlegrounds() &&
			node.Type === TagChange &&
			(node.Object as TagChange).Name === (GameTag.ZONE as number) &&
			(node.Object as TagChange).Value === (Zone.GRAVEYARD as number) &&
			this.GameState.CurrentEntities.get((node.Object as TagChange).Entity)?.GetTag(GameTag.CARDTYPE) ===
				(CardType.HERO as number)
		);
	}

	AppliesOnCloseNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const tagChange = node.Object as TagChange;
		const parent = node.Parent;
		if (
			parent == null ||
			!(parent.Object instanceof Action) ||
			(parent.Object as Action).Type !== (BlockType.DEATHS as number)
		) {
			return null;
		}

		if (
			this.GameState.CurrentEntities.get(tagChange.Entity)!.GetController() ===
			this.StateFacade.LocalPlayer!.Id
		) {
			return null;
		}

		return [
			GameEventProvider.Create(
				tagChange.TimeStamp,
				'BATTLEGROUNDS_ENEMY_HERO_KILLED',
				GameEventHelper.CreateProvider(
					'BATTLEGROUNDS_ENEMY_HERO_KILLED',
					this.GameState.CurrentEntities.get(tagChange.Entity)!.CardId,
					this.GameState.CurrentEntities.get(tagChange.Entity)!.GetController(),
					tagChange.Entity,
					this.StateFacade,
					null,
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
