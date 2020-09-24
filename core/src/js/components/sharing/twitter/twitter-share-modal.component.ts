import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { TwitterUserInfo } from '../../../models/mainwindow/twitter-user-info';
import { OverwolfService } from '../../../services/overwolf.service';

@Component({
	selector: 'twitter-share-modal',
	styleUrls: [
		`../../../../css/global/scrollbar.scss`,
		`../../../../css/component/controls/controls.scss`,
		`../../../../css/component/controls/control-close.component.scss`,
		`../../../../css/component/sharing/twitter/twitter-share-modal.component.scss`,
	],
	template: `
		<social-share-modal
			[socialUserInfo]="socialUserInfo"
			[closeHandler]="closeHandler"
			[buttonEnabled]="!sharing"
			(onShare)="handleShare($event)"
			(onLoginRequest)="handleLoginRequest()"
			(onLogoutRequest)="handleLogoutRequest()"
		>
			<div class="network-icon twitter">
				<i>
					<svg>
						<use xlink:href="assets/svg/sprite.svg#twitter_share" />
					</svg>
				</i>
			</div>
			<img class="share-preview" [src]="imagePath" />
		</social-share-modal>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TwitterShareModalComponent implements AfterViewInit {
	@Input() fileLocation: string;
	@Input() socialUserInfo: TwitterUserInfo;
	@Input() closeHandler: () => void;
	imagePath: SafeResourceUrl;
	sharing: boolean;

	@Input() set base64Image(value: string) {
		this.imagePath = this.sanitizer.bypassSecurityTrustResourceUrl(`data:image/jpg;base64,${value}`);
	}

	constructor(
		private readonly sanitizer: DomSanitizer,
		private readonly ow: OverwolfService,
		private readonly cdr: ChangeDetectorRef,
	) {}

	ngAfterViewInit() {
		this.ow.addTwitterLoginStateChangedListener(async info => {
			this.socialUserInfo = await this.ow.getTwitterUserInfo();
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		});
	}

	async handleShare(text: string) {
		this.sharing = true;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
		await this.ow.twitterShare(this.fileLocation, text);
		this.sharing = false;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	handleLoginRequest() {
		this.ow.twitterLogin();
	}

	handleLogoutRequest() {
		this.ow.twitterLogout();
	}
}
