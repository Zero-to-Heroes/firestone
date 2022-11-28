import { Action, CurrentState } from '@services/plugins/mind-vision/mind-vision-actions';

export interface MindVisionState {
	stateId(): CurrentState;
	onEnter(): Promise<void>;
	onExit(): Promise<void>;
	performAction(action: Action, payload: any): Promise<Action>;
	apiCall<T>(apiCall: () => Promise<T>): Promise<T | 'reset'>;
}
