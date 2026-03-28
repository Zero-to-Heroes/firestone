import { CardType, GameTag, Zone } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventProvider, GameEventHelper } from '../game-event';
import { Node, NodeType, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class WeaponDestroyedParser implements ActionParser {
	readonly ParserName = 'WeaponDestroyedParser';

	private GameState: GameState;
	private ParserState: ParserState;
	private StateFacade: StateFacade;

	constructor(parserState: ParserState, stateFacade: StateFacade) {
		this.ParserState = parserState;
		this.GameState = parserState.GameState;
		this.StateFacade = stateFacade;
	}

	AppliesOnNewNode(node: Node, stateType: StateType): boolean {
		const tagChange = node.Object as TagChange;
		const newZone = tagChange.Value;
		const isWeaponLeavingPlay =
			newZone === (Zone.GRAVEYARD as number) ||
			newZone === (Zone.SETASIDE as number) ||
			newZone === (Zone.REMOVEDFROMGAME as number);
		return (
			stateType === StateType.PowerTaskList &&
			node.Type === NodeType.TagChange &&
			tagChange.Name === (GameTag.ZONE as number) &&
			isWeaponLeavingPlay &&
			this.GameState.CurrentEntities.get(tagChange.Entity)?.GetTag(GameTag.CARDTYPE) ===
				(CardType.WEAPON as number) &&
			this.GameState.CurrentEntities.get(tagChange.Entity)!.GetTag(GameTag.ZONE) === (Zone.PLAY as number)
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
		return [
			GameEventProvider.Create(
				tagChange.TimeStamp,
				'WEAPON_DESTROYED',
				GameEventHelper.CreateProvider('WEAPON_DESTROYED', cardId, controllerId, entity.Id, this.StateFacade),
				true,
				node,
			),
		];
	}

	CreateGameEventProviderFromClose(_node: Node): GameEventProvider[] | null {
		return null;
	}
}
