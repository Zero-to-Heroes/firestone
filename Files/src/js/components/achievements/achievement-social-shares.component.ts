import { Component, Input, ChangeDetectionStrategy, AfterViewInit, EventEmitter } from '@angular/core';
import { MainWindowStoreEvent } from '../../services/mainwindow/store/events/main-window-store-event';
import { SocialShareUserInfo } from '../../models/mainwindow/social-share-user-info';
import { StartSocialSharingEvent } from '../../services/mainwindow/store/events/social/start-social-sharing-event';
import { SafeHtml } from '@angular/platform-browser';

declare var overwolf;
declare var ga;

@Component({
	selector: 'achievement-social-shares',
	styleUrls: [`../../../css/component/achievements/achievement-social-shares.component.scss`],
	template: `
        <div class="achievement-social-shares">
            <div class="social-share twitter" (click)="startSharingTwitter()">
                <i>
                    <svg>
                        <use xlink:href="/Files/assets/svg/sprite.svg#twitter_share"/>
                    </svg>
                </i>
            </div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class AchievementSocialSharesComponent implements AfterViewInit {

    @Input() title: SafeHtml;
    @Input() videoPath: string;
    @Input() videoPathOnDisk: string;
    @Input() achievementName: string;
    @Input() socialShareUserInfo: SocialShareUserInfo;
    
	private stateUpdater: EventEmitter<MainWindowStoreEvent>;
    
    ngAfterViewInit() {
		this.stateUpdater = overwolf.windows.getMainWindow().mainWindowStoreUpdater;
    }

    startSharingTwitter() {
        console.log('start sharing on Twitter', this.videoPath, this.socialShareUserInfo);
        this.stateUpdater.next(
            new StartSocialSharingEvent('twitter', this.videoPath, this.videoPathOnDisk, this.title, this.achievementName));
    }
}