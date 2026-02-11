import { ChangeDetectionStrategy, Component, ElementRef, Input, NgZone, OnDestroy, ViewChild } from '@angular/core';
import { InternalCardBack } from './internal-card-back';

@Component({
	standalone: false,
	selector: 'card-back',
	styleUrls: [`../../../css/component/collection/card-back.component.scss`],
	template: `
		<div class="card-back" *ngIf="_cardBack" [ngClass]="{ missing: !_cardBack.owned }" [helpTooltip]="tooltip">
			<div class="perspective-wrapper" rotateOnMouseOver>
				<img [src]="_cardBack.image + ''" *ngIf="!animated || !_cardBack.animatedImage" />
				<video
					#videoPlayer
					loop="loop"
					(mouseover)="play($event)"
					(mouseout)="pause($event)"
					*ngIf="animated && _cardBack.animatedImage"
				>
					<source src="{{ _cardBack.animatedImage }}" type="video/webm" />
				</video>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardBackComponent implements OnDestroy {
	@ViewChild('videoPlayer', { static: false }) set videoPlayer(videoPlayer: ElementRef) {
		if (videoPlayer) {
			this.videoPlayerElement = videoPlayer;
			if (this._cardBack) {
				this.videoPlayerElement.nativeElement.src = this._cardBack.animatedImage;
				this.videoPlayerElement.nativeElement.load();
			}
			this.updatePlaybackState();
		}
	}

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

	@Input() set alwaysOn(value: boolean) {
		this._alwaysOn = value;
		this.setupIntersectionObserver();
		this.updatePlaybackState();
	}

	@Input() animated: boolean;

	_cardBack: InternalCardBack;
	_alwaysOn: boolean;
	tooltip: string;

	private videoPlayerElement: ElementRef;
	private intersectionObserver: IntersectionObserver | null = null;
	private isVisible = false;

	constructor(
		private readonly hostRef: ElementRef,
		private readonly zone: NgZone,
	) {}

	ngOnDestroy() {
		this.destroyIntersectionObserver();
	}

	play(event: MouseEvent) {
		if (this._alwaysOn) {
			return;
		}
		this.videoPlayerElement?.nativeElement?.play();
	}

	pause(event: MouseEvent) {
		if (this._alwaysOn) {
			return;
		}
		this.videoPlayerElement?.nativeElement?.pause();
	}

	private setupIntersectionObserver() {
		this.destroyIntersectionObserver();

		if (!this._alwaysOn) {
			return;
		}

		// Run outside Angular to avoid unnecessary change detection cycles
		this.zone.runOutsideAngular(() => {
			this.intersectionObserver = new IntersectionObserver(
				(entries) => {
					for (const entry of entries) {
						this.isVisible = entry.isIntersecting;
						this.updatePlaybackState();
					}
				},
				{
					// Use a margin to start playing slightly before the card scrolls into view
					rootMargin: '100px',
				},
			);
			this.intersectionObserver.observe(this.hostRef.nativeElement);
		});
	}

	private destroyIntersectionObserver() {
		if (this.intersectionObserver) {
			this.intersectionObserver.disconnect();
			this.intersectionObserver = null;
		}
	}

	private updatePlaybackState() {
		if (!this.videoPlayerElement) {
			return;
		}

		const video = this.videoPlayerElement.nativeElement as HTMLVideoElement;
		if (this._alwaysOn && this.isVisible) {
			video.play();
		} else if (this._alwaysOn && !this.isVisible) {
			video.pause();
		} else if (!this._alwaysOn) {
			video.pause();
		}
	}
}
