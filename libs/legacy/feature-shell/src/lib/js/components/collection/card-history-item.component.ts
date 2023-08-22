import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostListener,
	Input,
	ViewRef,
} from '@angular/core';
import { CardsFacadeService, OverwolfService } from '@firestone/shared/framework/core';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { CardHistory } from '../../models/card-history';
import { CollectionCardType } from '../../models/collection/collection-card-type.type';
import { cardPremiumToCardType } from '../../services/collection/cards-monitor.service';
import { dustFor } from '../../services/hs-utils';
import { LocalizationFacadeService } from '../../services/localization-facade.service';
import { ShowCardDetailsEvent } from '../../services/mainwindow/store/events/collection/show-card-details-event';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../abstract-subscription-store.component';

declare let amplitude;

@Component({
	selector: 'card-history-item',
	styleUrls: [`../../../css/component/collection/card-history-item.component.scss`],
	template: `
		<div
			class="card-history-item"
			[ngClass]="{ active: active }"
			[cardTooltip]="cardId"
			[cardTooltipType]="cardType"
			cardTooltipPosition="left"
		>
			<img class="rarity" src="{{ rarityImg }}" />
			<span class="name">{{ cardName }}</span>
			<span class="dust-amount" *ngIf="!newCard">
				<span>{{ dustValue }}</span>
				<i class="i-30 pale-theme">
					<svg class="svg-icon-fill">
						<use xlink:href="assets/svg/sprite.svg#dust" />
					</svg>
				</i>
			</span>
			<span class="new" *ngIf="newCard && (!relevantCount || relevantCount === 1)">
				<span [owTranslate]="'app.collection.card-history.new-copy'"></span>
			</span>
			<span class="new second" *ngIf="newCard && relevantCount > 1">
				<span [owTranslate]="'app.collection.card-history.second-copy'"></span>
			</span>
			<span class="date">{{ creationDate }}</span>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardHistoryItemComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	@Input() active: boolean;

	@Input('historyItem') set historyItem(history: CardHistory) {
		if (!history) {
			return;
		}
		this.history$$.next(history);
	}

	newCard: boolean;
	relevantCount: number;
	rarityImg: string;
	cardName: string;
	creationDate: string;
	dustValue: number;
	cardId: string;
	cardType: CollectionCardType = 'NORMAL';

	private history$$ = new BehaviorSubject<CardHistory>(null);

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly i18n: LocalizationFacadeService,
		private readonly cards: CardsFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit(): void {
		combineLatest(
			this.history$$.asObservable(),
			this.listenForBasicPref$((prefs) => prefs.locale),
		)
			.pipe(this.mapData(([history, locale]) => ({ history, locale })))
			.subscribe((info) => {
				const history = info.history;

				this.cardId = history.cardId;
				this.newCard = history.isNewCard;
				this.relevantCount = history.relevantCount;

				const dbCard = this.cards.getCard(history.cardId);
				this.rarityImg = `assets/images/rarity/rarity-${dbCard.rarity || 'free'}.png`;

				const name = dbCard && dbCard.name ? dbCard.name : this.i18n.getUnknownCardName();
				this.cardType = cardPremiumToCardType(history.premium);
				this.cardName = history.premium
					? this.i18n.translateString(`app.collection.card-history.${this.cardType.toLowerCase()}-card`, {
							cardName: name,
					  })
					: name;

				this.dustValue = dustFor(dbCard.rarity, this.cardType);
				this.creationDate = new Date(history.creationTimestamp).toLocaleDateString(
					this.i18n.formatCurrentLocale(),
					{
						day: '2-digit',
						month: '2-digit',
						year: '2-digit',
					},
				);
				if (!(this.cdr as ViewRef)?.destroyed) {
					this.cdr.detectChanges();
				}
			});
	}

	@HostListener('mousedown') onClick() {
		amplitude.getInstance().logEvent('history', {
			page: 'collection',
		});
		this.store.send(new ShowCardDetailsEvent(this.cardId));
	}
}
