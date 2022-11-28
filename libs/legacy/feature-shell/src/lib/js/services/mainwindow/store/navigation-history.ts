import { StateHistory } from './state-history';

export class NavigationHistory {
	stateHistory: readonly StateHistory[] = [];
	currentIndexInHistory: number;
}
