import { MainWindowState } from '../../../models/mainwindow/main-window-state';

export interface StateHistory {
	readonly state: MainWindowState;
	readonly event: string;
	readonly navigation: boolean;
}
