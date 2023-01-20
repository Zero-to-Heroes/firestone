import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	HostListener,
	Input,
	ViewRef,
} from '@angular/core';
import { AbstractSubscriptionStoreComponent } from '@components/abstract-subscription-store.component';
import { AppUiStoreFacadeService } from '@services/ui-store/app-ui-store-facade.service';
import { Observable } from 'rxjs';
import { SetCard } from '../../models/set';
import { LocalizationFacadeService } from '../../services/localization-facade.service';
import { ShowCardDetailsEvent } from '../../services/mainwindow/store/events/collection/show-card-details-event';
import { MainWindowStoreEvent } from '../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../services/overwolf.service';
import { CollectionReferenceCard } from './collection-reference-card';

@Component({
	selector: 'card-view',
	styleUrls: [`../../../css/component/collection/card.component.scss`],
	template: `
		<div
			class="card-container {{ secondaryClass }}"
			[ngClass]="{ missing: missing, 'showing-placeholder': showPlaceholder }"
		>
			<div
				class="perspective-wrapper"
				[cardTooltip]="tooltips && _card.id"
				[cardTooltipShowRelatedCards]="showRelatedCards$ | async"
				rotateOnMouseOver
			>
				<img src="assets/images/placeholder.png" class="pale-theme placeholder" />
				<img *ngIf="image" [src]="image" class="real-card" (load)="imageLoadedHandler()" />
				<div class="count" *ngIf="!showPlaceholder && showCounts">
					<div class="non-premium" *ngIf="showNonPremiumCount">
						<span>{{ ownedNonPremium }}</span>
					</div>
					<div class="premium" *ngIf="showPremiumCount">
						<i class="gold-theme left">
							<svg class="svg-icon-fill">
								<use xlink:href="assets/svg/sprite.svg#two_gold_leaves" />
							</svg>
						</i>
						<span>{{ ownedPremium }}</span>
						<i class="gold-theme right">
							<svg class="svg-icon-fill">
								<use xlink:href="assets/svg/sprite.svg#two_gold_leaves" />
							</svg>
						</i>
					</div>
					<div class="diamond" *ngIf="showDiamondCount">
						<i class="gold-theme left">
							<svg class="svg-icon-fill">
								<use xlink:href="assets/svg/sprite.svg#two_gold_leaves" />
							</svg>
						</i>
						<span>{{ ownedDiamond + ownedSignature }}</span>
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
export class CardComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit, AfterViewInit {
	showRelatedCards$: Observable<boolean>;

	@Input() set card(card: SetCard | CollectionReferenceCard) {
		this._card = card;
		if (!card) {
			return;
		}

		this.ownedNonPremium = (this._card as SetCard).ownedNonPremium ?? 0;
		this.showNonPremiumCount = this.ownedNonPremium > 0;

		this.ownedPremium = (this._card as SetCard).ownedPremium ?? 0;
		this.showPremiumCount = this.ownedPremium > 0;

		this.ownedDiamond = (this._card as SetCard).ownedDiamond ?? 0;
		this.ownedSignature = (this._card as SetCard).ownedSignature ?? 0;
		this.showDiamondCount = this.ownedDiamond > 0 || this.ownedSignature > 0;

		this.missing = this.ownedNonPremium + this.ownedPremium + this.ownedDiamond + this.ownedSignature === 0;
		this.updateImage();
	}

	@Input() set collectionCard(card: CollectionReferenceCard) {
		this._card = card;
		if (!card) {
			return;
		}

		this.missing = !card.numberOwned;
		this.updateImage();
	}

	@Input() set highRes(value: boolean) {
		this._highRes = value;
		this.updateImage();
	}

	@Input() set bgs(value: boolean) {
		this._bgs = value;
		this.updateImage();
	}

	@Input() set premium(value: boolean) {
		this._premium = value;
		this.updateImage();
	}

	@Input() tooltips = true;
	@Input() showCounts: boolean;

	_highRes = false;
	_bgs = false;
	_premium = false;

	showPlaceholder = true;
	showNonPremiumCount: boolean;
	showPremiumCount: boolean;
	showDiamondCount: boolean;

	secondaryClass: string;
	image: string;
	missing: boolean;
	_card: SetCard | CollectionReferenceCard;
	ownedPremium: number;
	ownedDiamond: number;
	ownedSignature: number;
	ownedNonPremium: number;

	// private _loadImage = true;
	private _imageLoaded: boolean;
	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		protected readonly store: AppUiStoreFacadeService,
		private readonly ow: OverwolfService,
		private readonly i18n: LocalizationFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.showRelatedCards$ = this.listenForBasicPref$((prefs) => prefs.collectionShowRelatedCards);
	}

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

		// this.imageLoaded.next(this._card.id);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private updateImage() {
		if (!this._imageLoaded) {
			this.showPlaceholder = true;
		}
		this.image = this.i18n.getCardImage(this._card.id, {
			isBgs: this._bgs,
			isPremium: this._premium,
			isHighRes: this._highRes,
		});
		this.secondaryClass = this._highRes ? 'high-res' : '';
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
