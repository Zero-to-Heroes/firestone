import { Component, Input, ChangeDetectionStrategy, AfterViewInit, EventEmitter } from '@angular/core';
import { MainWindowStoreEvent } from '../../services/mainwindow/store/events/main-window-store-event';
import { SocialShareUserInfo } from '../../models/mainwindow/social-share-user-info';
import { StartSocialSharingEvent } from '../../services/mainwindow/store/events/social/start-social-sharing-event';
import { SafeHtml } from '@angular/platform-browser';
import { OverwolfService } from '../../services/overwolf.service';

@Component({
	selector: 'achievement-social-shares',
	styleUrls: [`../../../css/component/achievements/achievement-social-shares.component.scss`],
	template: `
		<div class="achievement-social-shares">
			<div class="social-share twitter" (mousedown)="startSharingTwitter()">
				<i>
					<svg>
						<use xlink:href="/Files/assets/svg/sprite.svg#twitter_share" />
					</svg>
				</i>
			</div>
			<!--<div class="social-share discord disabled">
                <i>
                    <svg>
                        <use xlink:href="/Files/assets/svg/sprite.svg#discord_share"/>
                    </svg>
                </i>
            </div>
            <div class="social-share youtube disabled">
                <i>
                    <svg>
                        <use xlink:href="/Files/assets/svg/sprite.svg#youtube_share"/>
                    </svg>
                </i>
            </div>
            <div class="social-share gfycat disabled">
                <i>
                    <svg>
                        <use xlink:href="/Files/assets/svg/sprite.svg#gfycat_share"/>
                    </svg>
                </i>
            </div>-->
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AchievementSocialSharesComponent implements AfterViewInit {
	@Input() title: SafeHtml;
	@Input() videoPath: string;
	@Input() videoPathOnDisk: string;
	@Input() achievementName: string;
	@Input() socialShareUserInfo: SocialShareUserInfo;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private ow: OverwolfService) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	startSharingTwitter() {
		console.log('start sharing on Twitter', this.videoPath, this.socialShareUserInfo);
		this.stateUpdater.next(
			new StartSocialSharingEvent('twitter', this.videoPath, this.videoPathOnDisk, this.title, this.achievementName),
		);
	}
}
