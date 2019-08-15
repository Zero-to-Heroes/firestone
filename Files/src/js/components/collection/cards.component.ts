import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	HostListener,
	Input,
	ViewEncapsulation,
	ViewRef,
} from '@angular/core';
import sortBy from 'lodash-es/sortBy';
import { IOption } from 'ng-select';
import { Card } from '../../models/card';
import { Set, SetCard } from '../../models/set';

@Component({
	selector: 'cards',
	styleUrls: [`../../../css/component/collection/cards.component.scss`, `../../../css/global/scrollbar.scss`],
	encapsulation: ViewEncapsulation.None,
	template: `
		<div class="cards">
			<span *ngIf="_set && !_searchString" class="set-title">
				<img src="{{ '/Files/assets/images/sets/' + _set.id + '.png' }}" class="set-logo" />
				<span class="text set-name">{{ _set.name }}</span>
			</span>
			<span *ngIf="!_set && _searchString" class="set-title">
				<span class="text set-name">{{ _searchString }}</span>
			</span>
			<div class="show-filter" *ngIf="_activeCards.length > 0" [ngStyle]="{ 'display': _searchString ? 'none' : 'flex' }">
				<!-- Rarity -->
				<ng-select
					class="rarity-select"
					[options]="raritySelectOptions"
					[(ngModel)]="rarityActiveFilter"
					(selected)="selectRarityFilter($event)"
					(opened)="refresh()"
					(closed)="refresh()"
					[noFilter]="1"
				>
					<ng-template #optionTemplate let-option="option">
						<span>{{ option?.label }}</span>
						<i class="i-30" *ngIf="option.value === rarityActiveFilter">
							<svg class="svg-icon-fill">
								<use xlink:href="/Files/assets/svg/sprite.svg#selected_dropdown" />
							</svg>
						</i>
					</ng-template>
				</ng-select>
				<!-- Class -->
				<ng-select
					class="class-select"
					[options]="classSelectOptions"
					[(ngModel)]="classActiveFilter"
					(selected)="selectClassFilter($event)"
					(opened)="refresh()"
					(closed)="refresh()"
					[noFilter]="1"
				>
					<ng-template #optionTemplate let-option="option">
						<span>{{ option?.label }}</span>
						<i class="i-30" *ngIf="option.value === classActiveFilter">
							<svg class="svg-icon-fill">
								<use xlink:href="/Files/assets/svg/sprite.svg#selected_dropdown" />
							</svg>
						</i>
					</ng-template>
				</ng-select>
				<!-- Cards owned -->
				<ng-select
					class="owned-select"
					[options]="cardsOwnedSelectOptions"
					[(ngModel)]="cardsOwnedActiveFilter"
					(selected)="selectCardsOwnedFilter($event)"
					(opened)="refresh()"
					(closed)="refresh()"
					[noFilter]="1"
				>
					<ng-template #optionTemplate let-option="option">
						<span>{{ option?.label }}</span>
						<i class="i-30" *ngIf="option.value === cardsOwnedActiveFilter">
							<svg class="svg-icon-fill">
								<use xlink:href="/Files/assets/svg/sprite.svg#selected_dropdown" />
							</svg>
						</i>
					</ng-template>
				</ng-select>
			</div>
			<ul class="cards-list">
				<li *ngFor="let card of _activeCards; trackBy: trackByCardId">
					<card-view [card]="card">/</card-view>
				</li>
			</ul>
			<collection-empty-state
				[set]="_set"
				[activeFilter]="cardsOwnedActiveFilter"
				[searchString]="_searchString"
				*ngIf="_activeCards.length === 0"
			>
			</collection-empty-state>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardsComponent implements AfterViewInit {
	readonly MAX_CARDS_DISPLAYED_PER_PAGE = 100000;

	readonly RARITY_FILTER_ALL = 'rarity-all';
	readonly RARITY_FILTER_COMMON = 'common';
	readonly RARITY_FILTER_RARE = 'rare';
	readonly RARITY_FILTER_EPIC = 'epic';
	readonly RARITY_FILTER_LEGENDARY = 'legendary';

	readonly CLASS_FILTER_ALL = 'class-all';
	readonly CLASS_DRUID = 'druid';
	readonly CLASS_HUNTER = 'hunter';
	readonly CLASS_MAGE = 'mage';
	readonly CLASS_PALADIN = 'paladin';
	readonly CLASS_PRIEST = 'priest';
	readonly CLASS_ROGUE = 'rogue';
	readonly CLASS_SHAMAN = 'shaman';
	readonly CLASS_WARLOCK = 'warlock';
	readonly CLASS_WARRIOR = 'warrior';

	readonly FILTER_OWN = 'own';
	readonly FILTER_GOLDEN_OWN = 'goldenown';
	readonly FILTER_DONT_OWN = 'dontown';
	readonly FILTER_NON_PREMIUM_NOT_COMPLETED = 'notpremiumnotcompleted';
	readonly FILTER_NOT_COMPLETED = 'notcompleted';
	readonly FILTER_ALL = 'all';

	raritySelectOptions: IOption[] = [
		{ label: this.labelFor(this.RARITY_FILTER_ALL), value: this.RARITY_FILTER_ALL },
		{ label: this.labelFor(this.RARITY_FILTER_COMMON), value: this.RARITY_FILTER_COMMON },
		{ label: this.labelFor(this.RARITY_FILTER_RARE), value: this.RARITY_FILTER_RARE },
		{ label: this.labelFor(this.RARITY_FILTER_EPIC), value: this.RARITY_FILTER_EPIC },
		{ label: this.labelFor(this.RARITY_FILTER_LEGENDARY), value: this.RARITY_FILTER_LEGENDARY },
	];

	classSelectOptions: IOption[] = [
		{ label: this.labelFor(this.CLASS_FILTER_ALL), value: this.CLASS_FILTER_ALL },
		{ label: this.labelFor(this.CLASS_DRUID), value: this.CLASS_DRUID },
		{ label: this.labelFor(this.CLASS_HUNTER), value: this.CLASS_HUNTER },
		{ label: this.labelFor(this.CLASS_MAGE), value: this.CLASS_MAGE },
		{ label: this.labelFor(this.CLASS_PALADIN), value: this.CLASS_PALADIN },
		{ label: this.labelFor(this.CLASS_PRIEST), value: this.CLASS_PRIEST },
		{ label: this.labelFor(this.CLASS_ROGUE), value: this.CLASS_ROGUE },
		{ label: this.labelFor(this.CLASS_SHAMAN), value: this.CLASS_SHAMAN },
		{ label: this.labelFor(this.CLASS_WARLOCK), value: this.CLASS_WARLOCK },
		{ label: this.labelFor(this.CLASS_WARRIOR), value: this.CLASS_WARRIOR },
	];

	cardsOwnedSelectOptions: IOption[] = [
		{ label: this.labelFor(this.FILTER_OWN), value: this.FILTER_OWN },
		{ label: this.labelFor(this.FILTER_GOLDEN_OWN), value: this.FILTER_GOLDEN_OWN },
		{ label: this.labelFor(this.FILTER_DONT_OWN), value: this.FILTER_DONT_OWN },
		{ label: this.labelFor(this.FILTER_NON_PREMIUM_NOT_COMPLETED), value: this.FILTER_NON_PREMIUM_NOT_COMPLETED },
		{ label: this.labelFor(this.FILTER_NOT_COMPLETED), value: this.FILTER_NOT_COMPLETED },
		{ label: this.labelFor(this.FILTER_ALL), value: this.FILTER_ALL },
	];

	_searchString: string;
	_cardList: SetCard[];
	_activeCards: SetCard[] = [];
	_set: Set;
	classActiveFilter = this.CLASS_FILTER_ALL;
	rarityActiveFilter = this.RARITY_FILTER_ALL;
	cardsOwnedActiveFilter = this.FILTER_ALL;

	constructor(private elRef: ElementRef, private cdr: ChangeDetectorRef) {}

	ngAfterViewInit() {
		const singleEls: HTMLElement[] = this.elRef.nativeElement.querySelectorAll('.single');
		singleEls.forEach(singleEl => {
			const caretEl = singleEl.appendChild(document.createElement('i'));
			caretEl.innerHTML = `<svg class="svg-icon-fill">
					<use xlink:href="/Files/assets/svg/sprite.svg#arrow"/>
				</svg>`;
			caretEl.classList.add('i-30');
			caretEl.classList.add('caret');
		});
		setTimeout(() => {
			if (!(this.cdr as ViewRef).destroyed) {
				this.cdr.detectChanges();
			}
		});
	}

	@Input('set') set cardSet(set: Set) {
		this._set = set;
	}

	@Input('cardList') set cardList(cardList: SetCard[]) {
		this._cardList = sortBy(cardList, 'cost', 'name');
		this.classActiveFilter = this.CLASS_FILTER_ALL;
		this.rarityActiveFilter = this.RARITY_FILTER_ALL;
		this.cardsOwnedActiveFilter = this.FILTER_ALL;
		this.updateShownCards();
	}

	@Input('searchString') set searchString(searchString: string) {
		this._searchString = searchString;
	}

	selectRarityFilter(option: IOption) {
		this.rarityActiveFilter = option.value;
		this.updateShownCards();
	}

	selectClassFilter(option: IOption) {
		this.classActiveFilter = option.value;
		this.updateShownCards();
	}

	selectCardsOwnedFilter(option: IOption) {
		this.cardsOwnedActiveFilter = option.value;
		this.updateShownCards();
	}

	refresh() {
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	trackByCardId(card: Card, index: number) {
		return card.id;
	}

	// Prevent the window from being dragged around if user scrolls with click
	@HostListener('mousedown', ['$event'])
	onHistoryClick(event: MouseEvent) {
		const scrollbarWidth = 5;
		const cardsList = this.elRef.nativeElement.querySelector('.cards-list');
		if (cardsList) {
			const rect = cardsList.getBoundingClientRect();
			if (event.offsetX >= rect.width - scrollbarWidth) {
				event.stopPropagation();
				return;
			}
		}

		const optionsDropDown = this.elRef.nativeElement.querySelector('.options');
		// If not hidden
		if (optionsDropDown) {
			const rect = optionsDropDown.getBoundingClientRect();
			if (event.offsetX >= rect.width - scrollbarWidth) {
				event.stopPropagation();
				return;
			}
		}
	}

	private updateShownCards() {
		// console.log('updating card list', this._cardList, this.classActiveFilter);
		const filteredCards = this._cardList
			.filter(this.filterRarity())
			.filter(this.filterClass())
			.filter(this.filterCardsOwned());
		// TODO: we do this to speed up the initial load of the page
		// This should probably be improved in several ways:
		// - Extract this to a directive, so that the logic is abstracted away from each rendering page
		// - Be smart about how many items to display at first, so that the page looks full right away
		// Maybe have a look at https://www.telerik.com/blogs/blazing-fast-list-rendering-in-angular?
		this._activeCards = filteredCards.slice(0, 20);
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
		setTimeout(() => {
			this._activeCards = filteredCards.slice(0, this.MAX_CARDS_DISPLAYED_PER_PAGE);
			if (!(this.cdr as ViewRef).destroyed) {
				this.cdr.detectChanges();
			}
		}, 500);
	}

	private filterRarity() {
		switch (this.rarityActiveFilter) {
			case this.RARITY_FILTER_ALL:
				return (card: SetCard) => true;
			default:
				return (card: SetCard) => card.rarity && card.rarity.toLowerCase() === this.rarityActiveFilter;
		}
	}

	private filterClass() {
		switch (this.classActiveFilter) {
			case this.CLASS_FILTER_ALL:
				return (card: SetCard) => true;
			default:
				return (card: SetCard) => card.cardClass && card.cardClass.toLowerCase() === this.classActiveFilter;
		}
	}

	private filterCardsOwned() {
		switch (this.cardsOwnedActiveFilter) {
			case this.FILTER_ALL:
				return (card: SetCard) => true;
			case this.FILTER_OWN:
				return (card: SetCard) => card.ownedNonPremium + card.ownedPremium > 0;
			case this.FILTER_GOLDEN_OWN:
				return (card: SetCard) => card.ownedPremium > 0;
			case this.FILTER_NON_PREMIUM_NOT_COMPLETED:
				return (card: SetCard) => card.ownedNonPremium < card.getMaxCollectible();
			case this.FILTER_NOT_COMPLETED:
				return (card: SetCard) => card.ownedPremium < card.getMaxCollectible() || card.ownedNonPremium < card.getMaxCollectible();
			case this.FILTER_DONT_OWN:
				return (card: SetCard) => card.ownedNonPremium + card.ownedPremium === 0;
			default:
				console.log('unknown filter', this.cardsOwnedActiveFilter);
		}
	}

	private labelFor(filter: string) {
		switch (filter) {
			case this.RARITY_FILTER_ALL:
				return 'Any rarity';
			case this.RARITY_FILTER_COMMON:
				return 'Common';
			case this.RARITY_FILTER_RARE:
				return 'Rare';
			case this.RARITY_FILTER_EPIC:
				return 'Epic';
			case this.RARITY_FILTER_LEGENDARY:
				return 'Legendary';

			case this.CLASS_FILTER_ALL:
				return 'All classes';
			case this.CLASS_DRUID:
				return 'Druid';
			case this.CLASS_HUNTER:
				return 'Hunter';
			case this.CLASS_MAGE:
				return 'Mage';
			case this.CLASS_PALADIN:
				return 'Paladin';
			case this.CLASS_PRIEST:
				return 'Priest';
			case this.CLASS_ROGUE:
				return 'Rogue';
			case this.CLASS_SHAMAN:
				return 'Shaman';
			case this.CLASS_WARLOCK:
				return 'Warlock';
			case this.CLASS_WARRIOR:
				return 'Warrior';

			case this.FILTER_ALL:
				return 'All existing cards';
			case this.FILTER_OWN:
				return 'Only cards I have';
			case this.FILTER_GOLDEN_OWN:
				return 'Only golden cards I have';
			case this.FILTER_NON_PREMIUM_NOT_COMPLETED:
				return 'Only cards with missing non-golden copies';
			case this.FILTER_NOT_COMPLETED:
				return 'Only cards with missing copies';
			case this.FILTER_DONT_OWN:
				return 'Only cards I do not have';

			default:
				console.log('unknown filter', filter);
		}
	}
}
