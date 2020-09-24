import { Overlay, OverlayPositionBuilder } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef } from '@angular/core';
import { OverwolfService } from '../../../services/overwolf.service';
import { SocialShareButtonComponent } from '../social-share-button.component';
import { TwitterShareModalComponent } from './twitter-share-modal.component';

declare var amplitude;

@Component({
	selector: 'twitter-share-button',
	styleUrls: [
		`../../../../css/component/sharing/social-share-button.component.scss`,
		`../../../../css/component/sharing/twitter/twitter-share-button.component.scss`,
	],
	template: `
		<div
			class="social-share {{ _network }}"
			helpTooltip="Share on {{ networkTitle }}"
			[inlineSVG]="networkSvg"
			(mousedown)="startSharing()"
		></div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TwitterShareButtonComponent extends SocialShareButtonComponent {
	constructor(
		protected readonly ow: OverwolfService,
		protected readonly overlay: Overlay,
		protected readonly elementRef: ElementRef,
		protected readonly overlayPositionBuilder: OverlayPositionBuilder,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(ow, overlay, elementRef, overlayPositionBuilder, cdr);
		this.network = 'twitter';
	}

	protected async doShare(screenshotLocation: string, base64Image: string) {
		const userInfo = await this.ow.getTwitterUserInfo();
		const portal = new ComponentPortal(TwitterShareModalComponent);

		const modalRef = this.overlayRef.attach(portal);
		modalRef.instance.fileLocation = screenshotLocation;
		modalRef.instance.base64Image = base64Image;
		modalRef.instance.socialUserInfo = userInfo;
		modalRef.instance.closeHandler = () => this.overlayRef.detach();
		console.log('instanciated modalRef'), modalRef;

		this.positionStrategy.apply();
	}
}
