import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { ILocalizationService } from '@firestone/shared/framework/core';

@Component({
	standalone: false,
	selector: 'spotlight-media-lightbox',
	styleUrls: ['./spotlight-media-lightbox.component.scss'],
	template: `
		<div class="lightbox-shell" (click)="close.emit()">
			<div class="spotlight-media-lightbox" (click)="$event.stopPropagation()">
				<button class="close-button" type="button" (click)="close.emit()" [attr.aria-label]="closeLabel">
					<svg class="svg-icon-fill">
						<use xlink:href="assets/svg/sprite.svg#window-control_close"></use>
					</svg>
				</button>
				<video
					[hidden]="mediaType !== 'video'"
					[src]="mediaType === 'video' ? url : null"
					autoplay
					muted
					loop
					playsinline
					controls
				></video>
				<img [hidden]="mediaType !== 'image'" [src]="mediaType === 'image' ? url : null" alt="" />
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpotlightMediaLightboxComponent {
	@Output() close = new EventEmitter<void>();

	@Input() url = '';
	@Input() mediaType: 'image' | 'video' = 'image';

	closeLabel: string;

	constructor(i18n: ILocalizationService) {
		this.closeLabel = i18n.translateString('app.global.controls.close-button-tooltip');
	}
}
