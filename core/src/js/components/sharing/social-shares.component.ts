import { ConnectedPosition, Overlay, OverlayPositionBuilder, OverlayRef, PositionStrategy } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Input } from '@angular/core';
import { OverwolfService } from '../../services/overwolf.service';
import { TwitterShareModalComponent } from './twitter-share-modal.component';

declare var amplitude;

@Component({
	selector: 'social-shares',
	styleUrls: [`../../../css/component/sharing/social-shares.component.scss`],
	template: `
		<div class="social-shares">
			<div class="social-share twitter" helpTooltip="Share on Twitter" (mousedown)="startSharingTwitter()">
				<i>
					<svg>
						<use xlink:href="assets/svg/sprite.svg#twitter_share" />
					</svg>
				</i>
			</div>

			<!--<div class="social-share discord disabled">
                <i>
                    <svg>
                        <use xlink:href="assets/svg/sprite.svg#discord_share"/>
                    </svg>
                </i>
            </div>
            <div class="social-share youtube disabled">
                <i>
                    <svg>
                        <use xlink:href="assets/svg/sprite.svg#youtube_share"/>
                    </svg>
                </i>
            </div>
            <div class="social-share gfycat disabled">
                <i>
                    <svg>
                        <use xlink:href="assets/svg/sprite.svg#gfycat_share"/>
                    </svg>
                </i>
            </div>-->
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SocialSharesComponent implements AfterViewInit {
	@Input() onSocialClick: () => Promise<[string, any]>;

	private overlayRef: OverlayRef;
	private positionStrategy: PositionStrategy;

	constructor(
		private readonly ow: OverwolfService,
		private readonly overlay: Overlay,
		private readonly elementRef: ElementRef,
		private readonly overlayPositionBuilder: OverlayPositionBuilder,
	) {}

	ngAfterViewInit() {
		const positions: ConnectedPosition[] = this.buildPositions();
		this.positionStrategy = this.overlayPositionBuilder
			// Create position attached to the elementRef
			.flexibleConnectedTo(this.elementRef)
			// Describe how to connect overlay to the elementRef
			.withPositions(positions);
		this.overlayRef = this.overlay.create({ positionStrategy: this.positionStrategy, hasBackdrop: true });
		this.overlayRef.backdropClick().subscribe(() => this.overlayRef.detach());
	}

	async startSharingTwitter() {
		setTimeout(async () => {
			amplitude.getInstance().logEvent('share', {
				'page': 'bgs-post-match-stats',
				'network': 'twitter',
			});
			// console.log('ready to share on twitter', this.onSocialClick);
			const [screenshotLocation, base64Image] = await this.onSocialClick();
			// console.log('start sharing to twitter', screenshotLocation);
			const userInfo = await this.ow.getTwitterUserInfo();
			// console.log('retrieved user info', userInfo);
			// if (!userInfo?.id) {
			// 	console.log('waiting for twitter login');
			// 	await this.loginToTwitter();
			// }
			const portal = new ComponentPortal(TwitterShareModalComponent);
			// console.log('building twitter modal component', screenshotLocation, userInfo);

			const modalRef = this.overlayRef.attach(portal);
			modalRef.instance.fileLocation = screenshotLocation;
			modalRef.instance.base64Image = base64Image;
			modalRef.instance.socialUserInfo = userInfo;
			modalRef.instance.closeHandler = () => this.overlayRef.detach();

			this.positionStrategy.apply();
		}, 100);
	}

	private async loginToTwitter() {
		this.ow.twitterLogin();
		await this.waitForTwitterLogin();
	}

	private async waitForTwitterLogin() {
		return new Promise<void>(resolve => {
			this.ow.addTwitterLoginStateChangedListener(info => {
				console.log('state changed', info);
				resolve();
			});
		});
	}

	private buildPositions(): ConnectedPosition[] {
		return [
			{
				originX: 'start',
				originY: 'top',
				overlayX: 'end',
				overlayY: 'top',
			},
		];
	}
}
