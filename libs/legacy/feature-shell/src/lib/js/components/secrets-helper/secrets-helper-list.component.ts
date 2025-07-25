import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Input,
	ViewRef,
} from '@angular/core';
import { CardClass } from '@firestone-hs/reference-data';
import { BoardSecret, DeckCard, SecretOption } from '@firestone/game-state';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent, sortByProperties, uuidShort } from '@firestone/shared/framework/common';
import { CardsFacadeService, waitForReady } from '@firestone/shared/framework/core';
import { combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { VisualDeckCard } from '../../models/decktracker/visual-deck-card';
import { LocalizationFacadeService } from '../../services/localization-facade.service';

@Component({
	standalone: false,
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
export class SecretsHelperListComponent extends AbstractSubscriptionComponent implements AfterContentInit {
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
		protected readonly cdr: ChangeDetectorRef,
		private readonly el: ElementRef,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
		private readonly prefs: PreferencesService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs);

		combineLatest([
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.globalWidgetScale ?? 100)),
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.secretsHelperScale ?? 100)),
		])
			.pipe(takeUntil(this.destroyed$))
			.subscribe(([globalScale, scale]) => {
				const newScale = (globalScale / 100) * (scale / 100);
				this.refreshScroll();
			});

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
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

		const optionsGroupedByCard = this.groupBy(
			allOptionsList,
			(secret: SecretOption) =>
				this.allCards.getCard(secret.cardId).counterpartCards?.[0] ??
				this.allCards.getCard(secret.cardId).dbfId,
		);

		const reducedOptions: readonly DeckCard[] = [...optionsGroupedByCard.values()]
			.filter((options) => options && options.length > 0)
			.map((options, index) => {
				const validOption = options.some((option) => option.isValidOption);
				const refOption = options[0].update({
					isValidOption: validOption,
				} as SecretOption);
				return refOption;
			})
			.map((refOption) => {
				const dbCard = this.allCards.getCard(refOption.cardId);
				return VisualDeckCard.create({
					cardId: refOption.cardId,
					cardName: this.allCards.getCard(dbCard.id).name,
					refManaCost: dbCard.cost,
					rarity: dbCard.rarity ? dbCard.rarity.toLowerCase() : 'free',
					highlight: refOption.isValidOption ? 'normal' : 'dim',
					classes: dbCard.classes?.map((c) => CardClass[c]) ?? [],
					internalEntityIds: [uuidShort()],
				});
			})
			.sort(
				sortByProperties((option) => [option.highlight === 'dim' ? 1 : 0, option.classes[0], option.cardName]),
			);

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
