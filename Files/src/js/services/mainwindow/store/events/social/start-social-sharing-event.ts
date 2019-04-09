import { MainWindowStoreEvent } from "../main-window-store-event";
import { SafeHtml } from "@angular/platform-browser";

export class StartSocialSharingEvent implements MainWindowStoreEvent {
    readonly network: string;
    readonly videoPath: string;
    readonly videoPathOnDisk: string;
    readonly title: SafeHtml;
    readonly achievementName: string;

    constructor(network: string, videoPath: string, videoPathOnDisk: string, title: SafeHtml, achievementName: string) {
        this.network = network;
        this.videoPath = videoPath;
        this.videoPathOnDisk = videoPathOnDisk;
        this.title = title;
        this.achievementName = achievementName;
    }
}