import { Processor } from "../processor";
import { MainWindowState } from "../../../../../models/mainwindow/main-window-state";
import { AchievementsState } from "../../../../../models/mainwindow/achievements-state";
import { ShareVideoOnSocialNetworkEvent } from "../../events/social/share-video-on-social-network-event";
import { OverwolfService } from "../../../../overwolf.service";

export class ShareVideoOnSocialNetworkProcessor implements Processor {

    constructor(private ow: OverwolfService) { }

    public async process(event: ShareVideoOnSocialNetworkEvent, currentState: MainWindowState): Promise<MainWindowState> {
        switch(event.network) {
            case 'twitter':
                await this.ow.twitterShare(event.videoPathOnDisk, event.message);
                break;
        }
        const achievementState = Object.assign(new AchievementsState(), currentState.achievements, {
            sharingAchievement: undefined,
        } as AchievementsState);
        return Object.assign(new MainWindowState(), currentState, {
            achievements: achievementState,
        } as MainWindowState);
    }
}