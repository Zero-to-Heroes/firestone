import { Processor } from "../processor";
import { MainWindowState } from "../../../../../models/mainwindow/main-window-state";
import { AchievementsState } from "../../../../../models/mainwindow/achievements-state";
import { StartSocialSharingEvent } from "../../events/social/start-social-sharing-event";
import { SharingAchievement } from "../../../../../models/mainwindow/achievement/sharing-achievement";

export class StartSocialSharingProcessor implements Processor {

    public async process(event: StartSocialSharingEvent, currentState: MainWindowState): Promise<MainWindowState> {
        const sharingAchievement: SharingAchievement = {
            title: event.title,
            network: event.network,
            videoPath: event.videoPath,
            videoPathOnDisk: event.videoPathOnDisk,
            achievementName: event.achievementName,
        };
        const achievementState = Object.assign(new AchievementsState(), currentState.achievements, {
            sharingAchievement: sharingAchievement,
        } as AchievementsState);
        return Object.assign(new MainWindowState(), currentState, {
            isVisible: true,
            achievements: achievementState,
        } as MainWindowState);
    }
}