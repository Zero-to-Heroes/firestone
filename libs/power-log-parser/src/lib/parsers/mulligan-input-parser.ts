import { GameTag, Mulligan } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventProvider } from '../game-event';
import { Node, TagChange } from '../models';
import { ParserState, StateType } from '../state/parser-state';

export class MulliganInputParser implements ActionParser {
	readonly ParserName = 'MulliganInputParser';

	private ParserState: ParserState;

	constructor(parserState: ParserState) {
		this.ParserState = parserState;
	}

	AppliesOnNewNode(node: Node, stateType: StateType): boolean {
		return (
			stateType === StateType.PowerTaskList &&
			node.Type === TagChange &&
			(node.Object as TagChange).Name === (GameTag.MULLIGAN_STATE as number) &&
			(node.Object as TagChange).Value === (Mulligan.INPUT as number)
		);
	}

	AppliesOnCloseNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const tagChange = node.Object as TagChange;
		return [
			GameEventProvider.Create(
				tagChange.TimeStamp,
				'MULLIGAN_INPUT',
				() => ({
					Type: 'MULLIGAN_INPUT',
				}),
				false,
				node,
			),
		];
	}

	CreateGameEventProviderFromClose(_node: Node): GameEventProvider[] | null {
		return null;
	}
}
