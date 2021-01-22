import { Overlay, OverlayPositionBuilder } from '@angular/cdk/overlay';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, ViewRef } from '@angular/core';
import { OverwolfService } from '../../../services/overwolf.service';
import { SocialShareButtonComponent } from '../social-share-button.component';

declare let amplitude;

@Component({
	selector: 'clipboard-share-button',
	styleUrls: [
		`../../../../css/component/sharing/social-share-button.component.scss`,
		`../../../../css/component/sharing/clipboard/clipboard-share-button.component.scss`,
	],
	template: `
		<div
			class="social-share {{ _network }}"
			[helpTooltip]="tooltip"
			[stayOpenOnClick]="true"
			[inlineSVG]="networkSvg"
			(mousedown)="startSharing(true)"
		></div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClipboardShareButtonComponent extends SocialShareButtonComponent {
	tooltip: string;

	constructor(
		protected readonly ow: OverwolfService,
		protected readonly overlay: Overlay,
		protected readonly elementRef: ElementRef,
		protected readonly overlayPositionBuilder: OverlayPositionBuilder,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(ow, overlay, elementRef, overlayPositionBuilder, cdr);
		this.network = 'clipboard';
		this.tooltip = 'Copy current screen to clipboard';
	}

	protected async doShare(screenshotLocation: string, base64Image: string) {
		this.tooltip = 'Image copied to clipboard';
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
		setTimeout(() => {
			this.tooltip = 'Copy current screen to clipboard';
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		}, 2000);
	}
}
