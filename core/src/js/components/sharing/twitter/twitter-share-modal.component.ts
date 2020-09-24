import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	Input,
	ViewChild,
	ViewRef,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { TwitterUserInfo } from '../../../models/mainwindow/twitter-user-info';
import { OverwolfService } from '../../../services/overwolf.service';
import { ShareInfoComponent } from '../share-info.component';

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
			(onShare)="handleShare()"
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
			<share-info #shareInfo class="share-main-body" [loggedIn]="socialUserInfo.id != null"> </share-info>
		</social-share-modal>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TwitterShareModalComponent implements AfterViewInit {
	@ViewChild('shareInfo', { static: false }) shareInfo: ShareInfoComponent;

	@Input() fileLocation: string;
	@Input() socialUserInfo: TwitterUserInfo;
	@Input() closeHandler: () => void;
	imagePath: SafeResourceUrl;
	sharing: boolean;

	@Input() set base64Image(value: string) {
		this.imagePath = this.sanitizer.bypassSecurityTrustResourceUrl(`data:image/jpg;base64,${value}`);
		console.log('imagePath', this.imagePath);
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

	async handleShare() {
		this.sharing = true;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
		await this.ow.twitterShare(this.fileLocation, this.shareInfo.textValue);
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
