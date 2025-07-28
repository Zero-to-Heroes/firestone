import { Overlay, OverlayPositionBuilder, OverlayRef, PositionStrategy } from '@angular/cdk/overlay';
import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Input,
	ViewRef,
} from '@angular/core';
import { OverwolfService } from '@firestone/shared/framework/core';
import { capitalizeFirstLetter } from '../../services/utils';

@Component({
	standalone: false,
	selector: 'social-share-button',
	styleUrls: [`../../../css/component/sharing/social-share-button.component.scss`],
	template: ``,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SocialShareButtonComponent implements AfterViewInit {
	_network: string;
	networkTitle: string;
	networkSvg: string;

	@Input() onSocialClick: (copyToCliboard: boolean) => Promise<[string, any]>;
	@Input() page = 'bgs-post-match-stats';
	@Input() showLabel: boolean;

	protected set network(value: string) {
		this._network = value;
		this.networkTitle = capitalizeFirstLetter(value);
		this.networkSvg = `assets/svg/social/${value}.svg`;
	}

	protected overlayRef: OverlayRef;
	protected positionStrategy: PositionStrategy;

	constructor(
		protected readonly ow: OverwolfService,
		protected readonly overlay: Overlay,
		protected readonly elementRef: ElementRef,
		protected readonly overlayPositionBuilder: OverlayPositionBuilder,
		protected readonly cdr: ChangeDetectorRef,
	) {}

	ngAfterViewInit() {
		this.positionStrategy = this.overlayPositionBuilder.global().centerHorizontally().centerVertically();
		this.overlayRef = this.overlay.create({
			positionStrategy: this.positionStrategy,
			hasBackdrop: true,
			backdropClass: 'social-share-backdrop',
		});
		this.overlayRef.backdropClick().subscribe(() => this.overlayRef.detach());
	}

	async startSharing(copyToCliboard = false) {
		console.log('starting sharing');
		setTimeout(async () => {
			const [screenshotLocation, base64Image] = await this.onSocialClick(copyToCliboard);
			if (!screenshotLocation || !base64Image) {
				console.error('Could not take screenshot', screenshotLocation, base64Image);
				return;
			}
			await this.doShare(screenshotLocation, base64Image);
			setTimeout(() => {
				if (!(this.cdr as ViewRef)?.destroyed) {
					this.cdr.detectChanges();
				}
			}, 20);
		}, 200);
	}

	protected async doShare(screenshotLocation: string, base64Image: string) {
		// Do nothing
	}
}
