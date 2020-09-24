import { ConnectedPosition, Overlay, OverlayPositionBuilder, OverlayRef, PositionStrategy } from '@angular/cdk/overlay';
import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Input,
	ViewRef,
} from '@angular/core';
import { OverwolfService } from '../../services/overwolf.service';
import { capitalizeFirstLetter } from '../../services/utils';

declare var amplitude;

@Component({
	selector: 'social-share-button',
	styleUrls: [`../../../css/component/sharing/social-share-button.component.scss`],
	template: ``,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SocialShareButtonComponent implements AfterViewInit {
	_network: string;
	networkTitle: string;
	networkSvg: string;

	@Input() onSocialClick: () => Promise<[string, any]>;

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
		const positions: ConnectedPosition[] = this.buildPositions();
		this.positionStrategy = this.overlayPositionBuilder
			// Create position attached to the elementRef
			.flexibleConnectedTo(this.elementRef)
			// Describe how to connect overlay to the elementRef
			.withPositions(positions);
		this.overlayRef = this.overlay.create({ positionStrategy: this.positionStrategy, hasBackdrop: true });
		this.overlayRef.backdropClick().subscribe(() => this.overlayRef.detach());
	}

	async startSharing() {
		setTimeout(async () => {
			amplitude.getInstance().logEvent('share', {
				'page': 'bgs-post-match-stats',
				'network': this._network,
			});
			const [screenshotLocation, base64Image] = await this.onSocialClick();
			await this.doShare(screenshotLocation, base64Image);
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		}, 200);
	}

	protected async doShare(screenshotLocation: string, base64Image: string) {
		// Do nothing
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
