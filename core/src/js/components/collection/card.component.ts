import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	HostListener,
	Input,
	ViewRef,
} from '@angular/core';
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
			[ngClass]="{ 'missing': missing, 'showing-placeholder': showPlaceholder }"
			rotateOnMouseOver
		>
			<div class="perspective-wrapper" [cardTooltip]="tooltips && _card.id" rotateOnMouseOver>
				<img src="assets/images/placeholder.png" class="pale-theme placeholder" />
				<img *ngIf="image" [src]="image" class="real-card" (load)="imageLoadedHandler()" />
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
						<span>{{ _card.ownedPremium + _card.ownedDiamond }}</span>
						<i class="gold-theme right">
							<svg class="svg-icon-fill">
								<use xlink:href="assets/svg/sprite.svg#two_gold_leaves" />
							</svg>
						</i>
					</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardComponent implements AfterViewInit {
	// @Output() imageLoaded: EventEmitter<string> = new EventEmitter<string>();

	@Input() set card(card: SetCard) {
		this._card = card;
		this.missing = this._card.ownedNonPremium + this._card.ownedPremium + this._card.ownedDiamond === 0;
		this.updateInfo();
		this.updateImage();
	}

	// @Input() set loadImage(value: boolean) {
	// 	this._loadImage = value;
	// 	this.updateImage();
	// }

	@Input() set highRes(value: boolean) {
		this._highRes = value;
		this.updateImage();
	}

	@Input() tooltips = true;

	@Input() set showCounts(value: boolean) {
		this._showCounts = value;
		this.updateInfo();
	}

	_showCounts = false;
	showPlaceholder = true;
	showNonPremiumCount: boolean;
	showPremiumCount: boolean;

	secondaryClass: string;
	image: string;
	missing: boolean;
	_card: SetCard;
	_highRes = false;

	// private _loadImage = true;
	private _imageLoaded: boolean;
	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private ow: OverwolfService, private cdr: ChangeDetectorRef) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	@HostListener('mousedown')
	onClick() {
		if (this.tooltips) {
			this.stateUpdater.next(new ShowCardDetailsEvent(this._card.id));
		}
	}

	imageLoadedHandler() {
		this.showPlaceholder = false;
		this._imageLoaded = true;
		// console.log('image loaded', this.image);
		// this.imageLoaded.next(this._card.id);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private updateImage() {
		// if (!this._loadImage) {
		// 	this.image = undefined;
		// 	return;
		// }
		if (!this._imageLoaded) {
			this.showPlaceholder = true;
		}
		const imagePath = this._highRes ? '512' : 'compressed';
		this.image = `https://static.zerotoheroes.com/hearthstone/fullcard/en/${imagePath}/${this._card.id}.png?v=3`;
		this.secondaryClass = this._highRes ? 'high-res' : '';
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private updateInfo() {
		if (!this._card) {
			return;
		}

		this.showNonPremiumCount = this._card.ownedNonPremium > 0 || this._showCounts;
		this.showPremiumCount = this._card.ownedPremium + this._card.ownedDiamond > 0 || this._showCounts;
	}
}
