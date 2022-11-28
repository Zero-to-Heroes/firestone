import { NavigationState } from '../../../models/mainwindow/navigation/navigation-state';

export interface StateHistory {
	readonly state: NavigationState;
	readonly event: string;
}
