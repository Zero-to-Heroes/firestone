import { animate, state, style, transition, trigger } from '@angular/animations';
import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	EventEmitter,
	HostListener,
	Input,
	ViewRef,
} from '@angular/core';
import { SetCard } from '../../models/set';
import { Events } from '../../services/events.service';
import { ShowCardDetailsEvent } from '../../services/mainwindow/store/events/collection/show-card-details-event';
import { MainWindowStoreEvent } from '../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../services/overwolf.service';

@Component({
	selector: 'card-view',
	styleUrls: [`../../../css/component/collection/card.component.scss`],
	template: `
		<div class="card-container" [ngClass]="{ 'missing': missing }">
			<img
				src="/Files/assets/images/placeholder.png"
				class="pale-theme placeholder"
				[@showPlaceholder]="showPlaceholder"
			/>
			<img src="{{ image }}" class="real-card" (load)="imageLoadedHandler()" [@showRealCard]="!showPlaceholder" />
			<div
				class="overlay"
				[ngStyle]="{ '-webkit-mask-image': overlayMaskImage }"
				[hidden]="showPlaceholder"
			></div>

			<div class="count" *ngIf="!showPlaceholder">
				<div class="non-premium" *ngIf="showNonPremiumCount">
					<span>{{ _card.ownedNonPremium }}</span>
				</div>
				<div class="premium" *ngIf="showPremiumCount">
					<i class="gold-theme left">
						<svg class="svg-icon-fill">
							<use xlink:href="/Files/assets/svg/sprite.svg#two_gold_leaves" />
						</svg>
					</i>
					<span>{{ _card.ownedPremium }}</span>
					<i class="gold-theme right">
						<svg class="svg-icon-fill">
							<use xlink:href="/Files/assets/svg/sprite.svg#two_gold_leaves" />
						</svg>
					</i>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	animations: [
		trigger('showPlaceholder', [
			state(
				'false',
				style({
					opacity: 0,
					// 'pointer-events': 'none',
				}),
			),
			state(
				'true',
				style({
					opacity: 1,
				}),
			),
			transition('true => false', animate(`150ms linear`)),
		]),
		trigger('showRealCard', [
			state(
				'false',
				style({
					opacity: 0,
					// 'pointer-events': 'none',
				}),
			),
			state(
				'true',
				style({
					opacity: 1,
				}),
			),
			transition('false => true', animate(`150ms linear`)),
		]),
	],
})
export class CardComponent implements AfterViewInit {
	@Input() public tooltips = true;
	@Input() public showCounts = false;

	showPlaceholder = true;
	showNonPremiumCount: boolean;
	showPremiumCount: boolean;

	image: string;
	overlayMaskImage: string;
	missing: boolean;
	_card: SetCard;
	_highRes = false;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private el: ElementRef,
		private events: Events,
		private ow: OverwolfService,
		private cdr: ChangeDetectorRef,
	) {}

	@Input('card') set card(card: SetCard) {
		this._card = card;
		this.missing = this._card.ownedNonPremium + this._card.ownedPremium === 0;
		this.showNonPremiumCount = this._card.ownedNonPremium > 0 || this.showCounts;
		this.showNonPremiumCount = this._card.ownedPremium > 0 || this.showCounts;
		this.updateImage();
	}

	@Input() set highRes(value: boolean) {
		this._highRes = value;
		this.updateImage();
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	@HostListener('mousedown') onClick() {
		if (this.tooltips) {
			this.stateUpdater.next(new ShowCardDetailsEvent(this._card.id));
		}
	}

	@HostListener('mouseenter') onMouseEnter() {
		if (this.tooltips) {
			const rect = this.el.nativeElement.getBoundingClientRect();
			const x = rect.left + rect.width - 20;
			const y = rect.top + rect.height / 2;
			this.events.broadcast(Events.SHOW_TOOLTIP, this._card.id, x, y, this._card.isOwned());
		}
	}

	@HostListener('mouseleave') onMouseLeave() {
		if (this.tooltips) {
			this.events.broadcast(Events.HIDE_TOOLTIP, this._card.id);
		}
	}

	imageLoadedHandler() {
		this.showPlaceholder = false;
		// console.log('image loaded', )
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	private updateImage() {
		this.showPlaceholder = true;
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
		const imagePath = this._highRes ? '512' : 'compressed';
		this.image = `https://static.zerotoheroes.com/hearthstone/fullcard/en/${imagePath}/${this._card.id}.png`;
		this.overlayMaskImage = `url('${this.image}')`;
	}
}
