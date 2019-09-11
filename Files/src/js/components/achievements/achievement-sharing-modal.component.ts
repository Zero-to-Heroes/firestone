import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	EventEmitter,
	Input,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { DomSanitizer, SafeHtml, SafeUrl } from '@angular/platform-browser';
import { SharingAchievement } from '../../models/mainwindow/achievement/sharing-achievement';
import { SocialShareUserInfo } from '../../models/mainwindow/social-share-user-info';
import { MainWindowStoreEvent } from '../../services/mainwindow/store/events/main-window-store-event';
import { CloseSocialShareModalEvent } from '../../services/mainwindow/store/events/social/close-social-share-modal-event';
import { OverwolfService } from '../../services/overwolf.service';

@Component({
	selector: 'achievement-sharing-modal',
	styleUrls: [
		`../../../css/component/achievements/achievement-sharing-modal.component.scss`,
		`../../../css/global/scrollbar-achievements.scss`,
		`../../../css/component/controls/controls.scss`,
		`../../../css/component/controls/control-close.component.scss`,
	],
	template: `
		<div class="achievement-sharing-modal {{ network }}">
			<button class="i-30 close-button" (mousedown)="closeModal()">
				<svg class="svg-icon-fill">
					<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="/Files/assets/svg/sprite.svg#window-control_close"></use>
				</svg>
			</button>
			<div class="modal-title">
				<div class="social-share twitter">
					<i>
						<svg>
							<use xlink:href="/Files/assets/svg/sprite.svg#twitter_share" />
						</svg>
					</i>
				</div>
				<div class="text">Share on {{ network }}</div>
			</div>
			<vg-player>
				<div class="title" [innerHTML]="title"></div>
				<fs-overlay-play></fs-overlay-play>

				<vg-controls>
					<vg-play-pause></vg-play-pause>
					<fs-time-display vgProperty="current" vgFormat="mm:ss"></fs-time-display>
					<fs-time-display vgProperty="total" vgFormat="mm:ss"></fs-time-display>
					<vg-scrub-bar [vgSlider]="true">
						<vg-scrub-bar-current-time [vgSlider]="true"></vg-scrub-bar-current-time>
					</vg-scrub-bar>
					<vg-mute></vg-mute>
					<vg-volume></vg-volume>
				</vg-controls>

				<video [vgMedia]="media" #media id="singleVideo" preload="auto">
					<source [src]="videoPath" type="video/mp4" />
				</video>
			</vg-player>
			<section class="sharing-body">
				<share-login [socialInfo]="socialShareUserInfo[network]" [network]="network"></share-login>
				<share-info
					[achievementName]="achievementName"
					[socialInfo]="socialShareUserInfo[network]"
					[videoPathOnDisk]="videoPathOnDisk"
					[network]="network"
				>
				</share-info>
			</section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AchievementSharingModal implements AfterViewInit, OnDestroy {
	videoPath: SafeUrl;
	videoPathOnDisk: string;
	network: string;
	title: SafeHtml;
	achievementName: string;
	@Input() socialShareUserInfo: SocialShareUserInfo;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;
	private player;
	private stateChangedListener: (message: any) => void;

	constructor(private elRef: ElementRef, private ow: OverwolfService, private sanitizer: DomSanitizer, private cdr: ChangeDetectorRef) {}

	@Input() set sharingAchievement(value: SharingAchievement) {
		console.log('setting sharing achievement', value);
		if (!value) {
			this.videoPath = undefined;
			this.videoPathOnDisk = undefined;
			this.network = undefined;
			this.title = undefined;
			this.achievementName = undefined;
			return;
		}
		this.videoPath = this.sanitizer.bypassSecurityTrustUrl(value.videoPath);
		this.videoPathOnDisk = value.videoPathOnDisk;
		this.network = value.network;
		this.title = value.title;
		this.achievementName = value.achievementName;
		this.initPlayer();
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
		this.player = this.elRef.nativeElement.querySelector('video');
		if (!this.player) {
			setTimeout(() => this.ngAfterViewInit(), 50);
			return;
		}
		// auto pause the video when window is closed / minimized
		this.stateChangedListener = this.ow.addStateChangedListener('CollectionWindow', message => {
			if (message.window_state !== 'normal') {
				this.player.pause();
			}
		});
	}

	ngOnDestroy(): void {
		this.ow.removeStateChangedListener(this.stateChangedListener);
	}

	closeModal() {
		this.player.pause();
		this.stateUpdater.next(new CloseSocialShareModalEvent());
	}

	private initPlayer() {
		if (!this.player) {
			setTimeout(() => this.initPlayer(), 50);
			return;
		}
		this.player.load();
		this.player.play();
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}
}
