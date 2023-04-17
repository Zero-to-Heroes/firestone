import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Input,
	ViewRef,
} from '@angular/core';
import { uuid } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { debounceTime, distinctUntilChanged, filter, map, takeUntil } from 'rxjs/operators';
import { BoardSecret } from '../../models/decktracker/board-secret';
import { DeckCard } from '../../models/decktracker/deck-card';
import { SecretOption } from '../../models/decktracker/secret-option';
import { VisualDeckCard } from '../../models/decktracker/visual-deck-card';
import { LocalizationFacadeService } from '../../services/localization-facade.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../abstract-subscription-store.component';

@Component({
	selector: 'secrets-helper-list',
	styleUrls: [
		`../../../css/global/scrollbar-decktracker-overlay.scss`,
		'../../../css/global/scrollbar-cards-list.scss',
		'../../../css/component/decktracker/overlay/dim-overlay.scss',
		'../../../css/component/secrets-helper/secrets-helper-list.component.scss',
	],
	template: `
		<ng-scrollbar class="secrets-helper-list" [ngClass]="{ active: isScroll }">
			<ul class="card-list" scrollable>
				<li *ngFor="let card of cards; trackBy: trackCard">
					<deck-card [card]="card" [colorManaCost]="colorManaCost" [colorClassCards]="true"></deck-card>
				</li>
			</ul>
		</ng-scrollbar>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SecretsHelperListComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	@Input() colorManaCost: boolean;
	@Input() cardsGoToBottom: boolean;
	@Input() set secrets(value: readonly BoardSecret[]) {
		this._secrets = value ?? [];
		this.updateCards();
	}

	_secrets: readonly BoardSecret[] = [];
	cards: readonly VisualDeckCard[];
	isScroll: boolean;

	constructor(
		private el: ElementRef,
		private allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.store
			.listenPrefs$((prefs) => prefs.secretsHelperScale)
			.pipe(
				debounceTime(100),
				map(([pref]) => pref),
				distinctUntilChanged(),
				filter((scale) => !!scale),
				takeUntil(this.destroyed$),
			)
			.subscribe((scale) => {
				this.refreshScroll();
			});
	}

	trackCard(index, card: VisualDeckCard) {
		return card.cardId;
	}

	private updateCards() {
		this.cards = this._secrets.map((c) => VisualDeckCard.create(c)) ? this.buildCards() : null;
		this.refreshScroll();
	}

	private buildCards(): readonly VisualDeckCard[] {
		if (!this.allCards.getCards() || this.allCards.getCards().length === 0) {
			setTimeout(() => this.updateCards(), 200);
			return;
		}
		const allOptionsList = this._secrets
			.map((secret) => secret.allPossibleOptions)
			.reduce((a, b) => a.concat(b), []);

		const optionsGroupedByCard = this.groupBy(allOptionsList, (secret: SecretOption) => secret.cardId);

		const reducedOptions: readonly DeckCard[] = [...optionsGroupedByCard.values()]
			.filter((options) => options && options.length > 0)
			.map((options, index) => {
				const validOption = options.some((option) => option.isValidOption);
				const refOption = options[0].update({
					isValidOption: validOption,
				} as SecretOption);
				return { index: index, data: refOption };
			})
			.sort((a, b) => {
				if (this.cardsGoToBottom) {
					if (a.data.isValidOption && !b.data.isValidOption) {
						return -1;
					}
					if (!a.data.isValidOption && b.data.isValidOption) {
						return 1;
					}
				}
				return a.index - b.index;
			})
			.map((refOption) => refOption.data)
			.map((refOption) => {
				const dbCard = this.allCards.getCard(refOption.cardId);
				return VisualDeckCard.create({
					cardId: refOption.cardId,
					cardName: this.i18n.getCardName(dbCard.id),
					manaCost: dbCard.cost,
					rarity: dbCard.rarity ? dbCard.rarity.toLowerCase() : 'free',
					highlight: refOption.isValidOption ? 'normal' : 'dim',
					cardClass: dbCard.cardClass,
					internalEntityIds: [uuid()],
				});
			});

		return reducedOptions.map((c) => VisualDeckCard.create(c));
	}

	private refreshScroll() {
		setTimeout(() => {
			const psContent = this.el.nativeElement.querySelector('.ps-content');
			const ps = this.el.nativeElement.querySelector('.ps');
			if (!ps || !psContent) {
				return;
			}
			const contentHeight = psContent.getBoundingClientRect().height;
			const containerHeight = ps.getBoundingClientRect().height;
			this.isScroll = contentHeight > containerHeight;
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		}, 1000);
	}

	private groupBy(list, keyGetter): Map<string, SecretOption[]> {
		const map = new Map();
		list.forEach((item) => {
			const key = keyGetter(item);
			const collection = map.get(key);
			if (!collection) {
				map.set(key, [item]);
			} else {
				collection.push(item);
			}
		});
		return map;
	}
}
