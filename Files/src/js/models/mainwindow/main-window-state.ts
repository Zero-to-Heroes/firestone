import { BinderState } from "./binder-state";
import { AchievementsState } from "./achievements-state";

export class MainWindowState {
    readonly isVisible: boolean = false;
    readonly currentApp: string = 'collection';
    readonly binder: BinderState = new BinderState();
    readonly achievements: AchievementsState = new AchievementsState();
}