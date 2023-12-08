import { Action, CurrentState } from '../mind-vision-actions';

export interface MindVisionState {
	stateId(): CurrentState;
	onEnter(): Promise<void>;
	onExit(): Promise<void>;
	performAction(action: Action, payload: any): Promise<Action | null>;
	apiCall<T>(apiCall: () => Promise<T>): Promise<T | 'reset' | null>;
}
