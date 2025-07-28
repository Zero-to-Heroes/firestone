import { ChangeDetectionStrategy, Component, ElementRef, Input } from '@angular/core';
import { InternalCardBack } from './internal-card-back';

@Component({
	standalone: false,
	selector: 'card-back',
	styleUrls: [`../../../css/component/collection/card-back.component.scss`],
	template: `
		<div class="card-back" *ngIf="_cardBack" [ngClass]="{ missing: !_cardBack.owned }" [helpTooltip]="tooltip">
			<div class="perspective-wrapper" rotateOnMouseOver>
				<img [src]="_cardBack.image + ''" />
				<!-- <video
					#videoPlayer
					loop="loop"
					[autoplay]="alwaysOn"
					(mouseover)="play()"
					(mouseout)="pause()"
					*ngIf="animated && _cardBack.animatedImage"
				>
					<source src="{{ _cardBack.animatedImage }}" type="video/webm" />
				</video> -->
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardBackComponent {
	// @ViewChild('videoPlayer', { static: false }) set videoPlayer(videoPlayer: ElementRef) {
	// 	if (videoPlayer) {
	// 		this.videoPlayerElement = videoPlayer;
	// 		if (this._cardBack) {
	// 			this.videoPlayerElement.nativeElement.src = this._cardBack.animatedImage;
	// 			this.videoPlayerElement.nativeElement.load();
	// 		}
	// 	}
	// }

	@Input() set cardBack(value: InternalCardBack) {
		this._cardBack = value;
		if (this._cardBack) {
			this.tooltip = `${this._cardBack.name}<br/>${this._cardBack.text
				.replace('<i>', '')
				.replace('</i>', '')
				.replace('<b>', '')
				.replace('</b>', '')}`;
		}
		if (this._cardBack && this.videoPlayerElement) {
			this.videoPlayerElement.nativeElement.src = this._cardBack.animatedImage;
			this.videoPlayerElement.nativeElement.load();
		}
	}

	@Input() animated: boolean;
	@Input() alwaysOn: boolean;

	_cardBack: InternalCardBack;
	tooltip: string;

	private videoPlayerElement: ElementRef;

	play(event: MouseEvent) {
		if (this.alwaysOn) {
			return;
		}
		this.videoPlayerElement.nativeElement.play();
	}

	pause(event: MouseEvent) {
		if (this.alwaysOn) {
			return;
		}
		this.videoPlayerElement.nativeElement.pause();
	}
}
