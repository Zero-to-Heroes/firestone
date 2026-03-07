import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostListener,
	Input,
	ViewRef,
} from '@angular/core';
import { CollectionCardType } from '@firestone-hs/user-packs';
import { SetCard } from '@firestone/collection/common';
import { MainWindowStateFacadeService } from '@firestone/mainwindow/common';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';
import { LocalizationFacadeService } from '../../services/localization-facade.service';
import { ShowCardDetailsEvent } from '@firestone/mainwindow/common';
import { CollectionReferenceCard } from './collection-reference-card';

@Component({
	standalone: false,
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
				<img
					src="https://static.zerotoheroes.com/hearthstone/asset/firestone/images/placeholder.png"
					class="pale-theme placeholder"
				/>
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
export class CardComponent extends AbstractSubscriptionComponent implements AfterContentInit {
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

	@Input() set cardType(value: CollectionCardType) {
		this._cardType = value;
		this.updateImage();
	}

	@Input() tooltips = true;
	@Input() showCounts: boolean;

	_highRes = false;
	_bgs = false;
	_cardType: CollectionCardType = 'NORMAL';

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

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly mainWindowStateFacade: MainWindowStateFacadeService,
		private readonly i18n: LocalizationFacadeService,
		private readonly prefs: PreferencesService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs);

		this.showRelatedCards$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => prefs.collectionShowRelatedCards),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.markForCheck();
		}
	}

	@HostListener('mousedown')
	onClick() {
		if (this.tooltips) {
			this.mainWindowStateFacade.send(new ShowCardDetailsEvent(this._card.id));
		}
	}

	imageLoadedHandler() {
		this.showPlaceholder = false;
		this._imageLoaded = true;

		// this.imageLoaded.next(this._card.id);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}

	private updateImage() {
		if (!this._imageLoaded) {
			this.showPlaceholder = true;
		}
		this.image = this.i18n.getCardImage(this._card.id, {
			isBgs: this._bgs,
			cardType: this._cardType,
			isHighRes: this._highRes,
		});
		this.secondaryClass = this._highRes ? 'high-res' : '';
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}
}
