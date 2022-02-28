import { Overlay, OverlayPositionBuilder } from '@angular/cdk/overlay';
import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	HostListener,
	ViewRef,
} from '@angular/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { Events } from '../../../services/events.service';
import { OverwolfService } from '../../../services/overwolf.service';
import { SocialShareButtonComponent } from '../social-share-button.component';

@Component({
	selector: 'clipboard-share-button',
	styleUrls: [
		`../../../../css/component/sharing/social-share-button.component.scss`,
		`../../../../css/component/sharing/clipboard/clipboard-share-button.component.scss`,
	],
	template: `
		<!-- We don't want it to stay open on click, because otherwise the tooltip is in the screenshot -->
		<div
			class="social-share {{ _network }}"
			[helpTooltip]="tooltip"
			[stayOpenOnClick]="false"
			[inlineSVG]="networkSvg"
		></div>
		<div class="label" *ngIf="showLabel" [owTranslate]="'app.share.clipboard.title'"></div>
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
		private readonly events: Events,
		private readonly i18n: LocalizationFacadeService,
	) {
		super(ow, overlay, elementRef, overlayPositionBuilder, cdr);
		this.network = 'clipboard';
		this.tooltip = this.i18n.translateString('app.share.clipboard.tooltip');
	}

	@HostListener('mousedown')
	onClick() {
		this.startSharing(true);
	}

	protected async doShare(screenshotLocation: string, base64Image: string) {
		this.events.broadcast(Events.SHOW_SCREEN_CAPTURE_EFFECT);
		this.tooltip = this.i18n.translateString('app.share.clipboard.confirmation');
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
		setTimeout(() => {
			this.tooltip = this.i18n.translateString('app.share.clipboard.tooltip');
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		}, 2000);
	}
}
