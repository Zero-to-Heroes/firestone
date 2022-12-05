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
import { RedditUserInfo } from '../../../models/mainwindow/reddit-user-info';
import { OverwolfService } from '../../../services/overwolf.service';
import { RedditShareInfoComponent } from './reddit-share-info.component';

@Component({
	selector: 'reddit-share-modal',
	styleUrls: [
		`../../../../css/component/controls/controls.scss`,
		`../../../../css/component/controls/control-close.component.scss`,
		`../../../../css/component/sharing/reddit/reddit-share-modal.component.scss`,
	],
	template: `
		<social-share-modal
			[socialUserInfo]="_socialUserInfo"
			[closeHandler]="closeHandler"
			[buttonEnabled]="!sharing"
			[dataValid]="dataValid"
			(onShare)="handleShare()"
			(onLoginRequest)="handleLoginRequest()"
			(onLogoutRequest)="handleLogoutRequest()"
		>
			<img class="share-preview" [src]="imagePath" />
			<reddit-share-info
				#shareInfo
				class="share-main-body"
				[loggedIn]="_socialUserInfo?.id != null"
				(onValidChange)="handleValid($event)"
			>
			</reddit-share-info>
		</social-share-modal>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RedditShareModalComponent implements AfterViewInit {
	@ViewChild('shareInfo', { static: false }) shareInfo: RedditShareInfoComponent;

	@Input() fileLocation: string;
	@Input() closeHandler: () => void;

	@Input() set socialUserInfo(value: RedditUserInfo) {
		this._socialUserInfo = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() set base64Image(value: string) {
		this.imagePath = this.sanitizer.bypassSecurityTrustResourceUrl(`data:image/jpg;base64,${value}`);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	imagePath: SafeResourceUrl;
	sharing: boolean;
	_socialUserInfo: RedditUserInfo;
	dataValid: boolean;

	constructor(
		private readonly sanitizer: DomSanitizer,
		private readonly ow: OverwolfService,
		private readonly cdr: ChangeDetectorRef,
	) {}

	ngAfterViewInit() {
		this.ow.addRedditLoginStateChangedListener(async (info) => {
			this._socialUserInfo = await this.ow.getRedditUserInfo();
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		});
	}

	async handleValid(isValid: boolean) {
		this.dataValid = isValid;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	async handleShare() {
		this.sharing = true;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
		const result = await this.ow.redditShare(
			this.fileLocation,
			this.shareInfo.title,
			this.shareInfo.subreddit,
			this.shareInfo.flair,
		);
		this.sharing = false;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	handleLoginRequest() {
		this.ow.redditLogin();
	}

	handleLogoutRequest() {
		this.ow.redditLogout();
	}
}
