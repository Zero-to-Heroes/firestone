import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	EventEmitter,
	HostListener,
	Input,
	Output,
	ViewRef,
} from '@angular/core';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { SetCard } from '../../models/set';
import { ShowCardDetailsEvent } from '../../services/mainwindow/store/events/collection/show-card-details-event';
import { MainWindowStoreEvent } from '../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../services/overwolf.service';

@Component({
	selector: 'card-view',
	styleUrls: [`../../../css/component/collection/card.component.scss`],
	template: `
		<div
			class="card-container {{ secondaryClass }}"
			[style.transform]="styleTransform"
			[ngClass]="{ 'missing': missing, 'showing-placeholder': showPlaceholder }"
		>
			<div
				class="images perspective-wrapper"
				(mouseleave)="onMouseLeave($event)"
				(mouseenter)="onMouseOver($event)"
				(mousemove)="onMouseMove($event)"
				[cardTooltip]="tooltips && _card.id"
			>
				<img src="assets/images/placeholder.png" class="pale-theme placeholder" />
				<img *ngIf="image" [src]="image" class="real-card" (load)="imageLoadedHandler()" />
				<div
					[hidden]="showPlaceholder"
					class="overlay"
					[ngStyle]="{ '-webkit-mask-image': overlayMaskImage }"
				></div>
			</div>

			<div class="count" *ngIf="!showPlaceholder">
				<div class="non-premium" *ngIf="showNonPremiumCount">
					<span>{{ _card.ownedNonPremium }}</span>
				</div>
				<div class="premium" *ngIf="showPremiumCount">
					<i class="gold-theme left">
						<svg class="svg-icon-fill">
							<use xlink:href="assets/svg/sprite.svg#two_gold_leaves" />
						</svg>
					</i>
					<span>{{ _card.ownedPremium }}</span>
					<i class="gold-theme right">
						<svg class="svg-icon-fill">
							<use xlink:href="assets/svg/sprite.svg#two_gold_leaves" />
						</svg>
					</i>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardComponent implements AfterViewInit {
	@Output() imageLoaded: EventEmitter<boolean> = new EventEmitter<boolean>();

	@Input('card') set card(card: SetCard) {
		this._card = card;
		this.missing = this._card.ownedNonPremium + this._card.ownedPremium === 0;
		this.showNonPremiumCount = this._card.ownedNonPremium > 0 || this.showCounts;
		this.showPremiumCount = this._card.ownedPremium > 0 || this.showCounts;
		this.updateImage();
	}

	@Input() set loadImage(value: boolean) {
		this._loadImage = value;
		this.updateImage();
	}

	@Input() set highRes(value: boolean) {
		this._highRes = value;
		this.updateImage();
	}

	@Input() tooltips = true;
	@Input() showCounts = false;

	showPlaceholder = true;
	showNonPremiumCount: boolean;
	showPremiumCount: boolean;

	styleTransform: SafeStyle = 'scale3d(1, 1, 1)';
	secondaryClass: string;
	image: string;
	overlayMaskImage: string;
	missing: boolean;
	_card: SetCard;
	_highRes = false;

	private _loadImage = true;
	private _imageLoaded: boolean;
	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	private imageWidth: number;
	private imageHeight: number;
	private isMouseOver: boolean;

	constructor(
		private el: ElementRef,
		private sanitizer: DomSanitizer,
		private ow: OverwolfService,
		private cdr: ChangeDetectorRef,
	) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	@HostListener('mousedown')
	onClick() {
		if (this.tooltips) {
			this.stateUpdater.next(new ShowCardDetailsEvent(this._card.id));
		}
	}

	onMouseOver(event: MouseEvent) {
		this.isMouseOver = true;
		this.imageWidth = this.el.nativeElement.querySelector('.images')?.getBoundingClientRect()?.width;
		this.imageHeight = this.el.nativeElement.querySelector('.images')?.getBoundingClientRect()?.height;
	}

	onMouseLeave(event: MouseEvent) {
		this.isMouseOver = false;
		this.styleTransform = this.sanitizer.bypassSecurityTrustStyle(
			`perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`,
		);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	onMouseMove(event: MouseEvent) {
		if (!this.isMouseOver) {
			return;
		}

		const xRatio = event.offsetX / this.imageWidth;
		const yRatio = event.offsetY / this.imageHeight;
		const styleAmplifier = 2;
		const yRotation = Math.min(30, styleAmplifier * (xRatio * 16 - 8));
		const xRotation = Math.min(30, styleAmplifier * (yRatio * 16 - 8));
		this.styleTransform = this.sanitizer.bypassSecurityTrustStyle(
			`perspective(1000px) rotateX(${xRotation}deg) rotateY(${yRotation}deg) scale3d(1.035, 1.035, 1.035)`,
		);
		// console.log(
		// 	'mousemove',
		// 	event,
		// 	this.imageWidth,
		// 	this.imageHeight,
		// 	xRatio,
		// 	yRatio,
		// 	xRatio * 16 - 8,
		// 	yRatio * 16 - 8,
		// 	xRotation,
		// 	yRotation,
		// 	this.styleTransform,
		// );
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	imageLoadedHandler() {
		this.showPlaceholder = false;
		this._imageLoaded = true;
		console.log('image loaded', this.image);
		this.imageLoaded.next(true);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private updateImage() {
		if (!this._loadImage) {
			this.image = undefined;
			this.overlayMaskImage = undefined;
			return;
		}
		if (!this._imageLoaded) {
			this.showPlaceholder = true;
		}
		const imagePath = this._highRes ? '512' : 'compressed';
		this.image = `https://static.zerotoheroes.com/hearthstone/fullcard/en/${imagePath}/${this._card.id}.png`;
		this.overlayMaskImage = `url('${this.image}')`;
		this.secondaryClass = this._highRes ? 'high-res' : '';
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
