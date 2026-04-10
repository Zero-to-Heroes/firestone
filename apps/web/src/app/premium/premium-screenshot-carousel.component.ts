import { CommonModule } from '@angular/common';
import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	EventEmitter,
	Input,
	Output,
	ViewChild,
	ViewEncapsulation,
} from '@angular/core';
import {
	isPremiumImage,
	isPremiumVideo,
	PremiumImage,
	PremiumMedia,
} from './premium-page.content';

@Component({
	standalone: true,
	selector: 'web-premium-screenshot-carousel',
	imports: [CommonModule],
	templateUrl: './premium-screenshot-carousel.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None,
})
export class PremiumScreenshotCarouselComponent {
	@Input({ required: true }) shots!: readonly PremiumMedia[];

	@Output() readonly openLightbox = new EventEmitter<PremiumImage>();

	/** Exposed for template use (Angular cannot call imported functions in templates without a member). */
	readonly isPremiumVideo = isPremiumVideo;
	readonly isPremiumImage = isPremiumImage;

	index = 0;

	private touchStartX = 0;

	@ViewChild('slideVideo') private slideVideo?: ElementRef<HTMLVideoElement>;

	constructor(private readonly cdr: ChangeDetectorRef) {}

	get currentShot(): PremiumMedia {
		return this.shots[this.index];
	}

	onTouchStart(ev: TouchEvent): void {
		this.touchStartX = ev.changedTouches[0]?.screenX ?? 0;
	}

	onTouchEnd(ev: TouchEvent): void {
		const x = ev.changedTouches[0]?.screenX ?? 0;
		const dx = x - this.touchStartX;
		if (dx > 48) {
			this.prev();
		} else if (dx < -48) {
			this.next();
		}
	}

	onKeydown(ev: KeyboardEvent): void {
		if (ev.key === 'ArrowLeft') {
			ev.preventDefault();
			this.prev();
		} else if (ev.key === 'ArrowRight') {
			ev.preventDefault();
			this.next();
		}
	}

	next(): void {
		this.pauseSlideVideo();
		this.index = (this.index + 1) % this.shots.length;
		this.cdr.markForCheck();
	}

	prev(): void {
		this.pauseSlideVideo();
		this.index = (this.index - 1 + this.shots.length) % this.shots.length;
		this.cdr.markForCheck();
	}

	emitOpen(shot: PremiumMedia): void {
		if (isPremiumImage(shot)) {
			this.openLightbox.emit(shot);
		}
	}

	private pauseSlideVideo(): void {
		this.slideVideo?.nativeElement?.pause();
	}
}
