import { AchievementsState } from '../../../../models/mainwindow/achievements-state';
import { BinderState } from '../../../../models/mainwindow/binder-state';
import { MainWindowState } from '../../../../models/mainwindow/main-window-state';
import { Navigation } from '../../../../models/mainwindow/navigation';
import { ReplaysState } from '../../../../models/mainwindow/replays/replays-state';
import { ChangeVisibleApplicationEvent } from '../events/change-visible-application-event';
import { Processor } from './processor';

export class ChangeVisibleApplicationProcessor implements Processor {
	public async process(
		event: ChangeVisibleApplicationEvent,
		currentState: MainWindowState,
	): Promise<MainWindowState> {
		if (event.module === currentState.currentApp) {
			return currentState;
		}
		const binder =
			event.module === 'collection'
				? Object.assign(new BinderState(), currentState.binder, {
						currentView: 'sets',
						menuDisplayType: 'menu',
				  } as BinderState)
				: currentState.binder;
		const achievements =
			event.module === 'achievements'
				? Object.assign(new AchievementsState(), currentState.achievements, {
						currentView: 'categories',
						menuDisplayType: 'menu',
				  } as AchievementsState)
				: currentState.achievements;
		const replays =
			event.module === 'replays'
				? Object.assign(new ReplaysState(), currentState.replays, {
						currentView: 'list',
				  } as ReplaysState)
				: currentState.replays;
		return Object.assign(new MainWindowState(), currentState, {
			isVisible: true,
			currentApp: event.module,
			binder: binder,
			achievements: achievements,
			replays: replays,
			navigation: Object.assign(new Navigation(), currentState.navigation, {
				text: event.module === 'achievements' ? 'Categories' : null,
				image: null,
			} as Navigation),
		} as MainWindowState);
	}
}
