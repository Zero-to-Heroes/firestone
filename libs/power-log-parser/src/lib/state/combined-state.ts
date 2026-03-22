import { ParserState, StateType, INodeParser } from './parser-state';
import { StateFacade } from './state-facade';

export class CombinedState {
	GSState!: ParserState;
	PTLState!: ParserState;
	StateFacade!: StateFacade;

	constructor(createNodeParser: (stateFacade: StateFacade, stateType: StateType) => INodeParser) {
		this.StateFacade = new StateFacade(this);
		const gsNodeParser = createNodeParser(this.StateFacade, StateType.GameState);
		const ptlNodeParser = createNodeParser(this.StateFacade, StateType.PowerTaskList);
		this.GSState = new ParserState(StateType.GameState, gsNodeParser, this.StateFacade);
		this.PTLState = new ParserState(StateType.PowerTaskList, ptlNodeParser, this.StateFacade);
	}
}
