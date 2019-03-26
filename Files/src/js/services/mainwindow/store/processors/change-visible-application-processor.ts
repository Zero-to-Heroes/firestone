import { Processor } from "./processor";
import { MainWindowState } from "../../../../models/mainwindow/main-window-state";
import { ChangeVisibleApplicationEvent } from "../events/change-visible-application-event";
import { BinderState } from "../../../../models/mainwindow/binder-state";
import { AchievementsState } from "../../../../models/mainwindow/achievements-state";

export class ChangeVisibleApplicationProcessor implements Processor {

    public async process(event: ChangeVisibleApplicationEvent, currentState: MainWindowState): Promise<MainWindowState> {
        const binder = event.module === 'collection'
                ? Object.assign(new BinderState(), currentState.binder, {
                        currentView: 'sets',
                        menuDisplayType: 'menu',
                    } as BinderState)
                : currentState.binder;
        const achievements = event.module === 'achievements'
                ? Object.assign(new AchievementsState(), currentState.achievements, {
                        currentView: 'categories',
                        menuDisplayType: 'menu',
                    } as AchievementsState)
                : currentState.achievements;
        return Object.assign(new MainWindowState(), currentState, {
            isVisible: true,
            currentApp: event.module,
            binder: binder,
            achievements: achievements,
        } as MainWindowState);
    }
}