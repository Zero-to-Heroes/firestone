import { Node } from './models';
import { StateType } from './state/parser-state';
import { GameEventProvider } from './game-event';

export interface ActionParser {
	readonly ParserName: string;
	AppliesOnNewNode(node: Node, stateType: StateType): boolean;
	AppliesOnCloseNode(node: Node, stateType: StateType): boolean;
	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null;
	CreateGameEventProviderFromClose(node: Node): GameEventProvider[] | null;
}
