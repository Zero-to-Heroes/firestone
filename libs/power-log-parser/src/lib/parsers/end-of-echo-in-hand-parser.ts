import { GameTag, Zone } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventProvider, GameEventHelper } from '../game-event';
import { Node, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class EndOfEchoInHandParser implements ActionParser {
	readonly ParserName = 'EndOfEchoInHandParser';

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
			(node.Object as TagChange).Value === (Zone.SETASIDE as number)
		);
	}

	AppliesOnCloseNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const tagChange = node.Object as TagChange;
		const entity = this.GameState.CurrentEntities.get(tagChange.Entity)!;
		const zoneInt = entity.GetTag(GameTag.ZONE) === -1 ? 0 : entity.GetTag(GameTag.ZONE);
		if (zoneInt !== (Zone.HAND as number)) {
			return null;
		}
		if (entity.GetTag(GameTag.GHOSTLY) !== 1) {
			return null;
		}

		const cardId = entity.CardId;
		const controllerId = entity.GetEffectiveController();
		entity.PlayedWhileInHand.length = 0;
		return [
			GameEventProvider.Create(
				tagChange.TimeStamp,
				'END_OF_ECHO_IN_HAND',
				GameEventHelper.CreateProvider(
					'END_OF_ECHO_IN_HAND',
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

	CreateGameEventProviderFromClose(_node: Node): GameEventProvider[] | null {
		return null;
	}
}
