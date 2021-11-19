import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Input,
	ViewRef,
} from '@angular/core';
import { CardsFacadeService } from '@services/cards-facade.service';
import { debounceTime, distinctUntilChanged, filter, map, takeUntil } from 'rxjs/operators';
import { CardTooltipPositionType } from '../../directives/card-tooltip-position.type';
import { BoardSecret } from '../../models/decktracker/board-secret';
import { DeckCard } from '../../models/decktracker/deck-card';
import { SecretOption } from '../../models/decktracker/secret-option';
import { VisualDeckCard } from '../../models/decktracker/visual-deck-card';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../abstract-subscription.component';

@Component({
	selector: 'secrets-helper-list',
	styleUrls: [
		'../../../css/global/components-global.scss',
		'../../../css/component/secrets-helper/secrets-helper-list.component.scss',
		'../../../css/component/decktracker/overlay/dim-overlay.scss',
		`../../../css/global/scrollbar-decktracker-overlay.scss`,
	],
	template: `
		<perfect-scrollbar class="secrets-helper-list" [ngClass]="{ 'active': isScroll }">
			<ul class="card-list" scrollable>
				<li *ngFor="let card of cards; trackBy: trackCard">
					<deck-card
						[card]="card"
						[tooltipPosition]="_tooltipPosition"
						[colorManaCost]="colorManaCost"
						[colorClassCards]="true"
					></deck-card>
				</li>
			</ul>
		</perfect-scrollbar>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SecretsHelperListComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	@Input() colorManaCost: boolean;
	@Input() cardsGoToBottom: boolean;
	@Input() set tooltipPosition(value: CardTooltipPositionType) {
		this._tooltipPosition = value;
	}
	@Input() set secrets(value: readonly BoardSecret[]) {
		this._secrets = value;
		this.updateCards();
	}

	_tooltipPosition: CardTooltipPositionType;
	_secrets: readonly BoardSecret[];
	cards: readonly DeckCard[];
	isScroll: boolean;

	constructor(
		private el: ElementRef,
		private allCards: CardsFacadeService,
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
		this.cards = this._secrets ? this.buildCards() : null;
		this.refreshScroll();
	}

	private buildCards(): readonly DeckCard[] {
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
					cardName: dbCard.name,
					manaCost: dbCard.cost,
					rarity: dbCard.rarity ? dbCard.rarity.toLowerCase() : 'free',
					highlight: refOption.isValidOption ? 'normal' : 'dim',
					cardClass: dbCard.cardClass,
				} as VisualDeckCard);
			});
		// TODO: add an optional filter step based on user preference to see or not the ruled out secrets

		return reducedOptions;
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
