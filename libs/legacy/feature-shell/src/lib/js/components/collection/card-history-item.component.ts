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
import { dustFor } from '@firestone/game-state';
import { MainWindowStateFacadeService } from '@firestone/mainwindow/common';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { CardHistory } from '../../models/card-history';
import { cardPremiumToCardType } from '../../services/collection/cards-monitor.service';
import { LocalizationFacadeService } from '../../services/localization-facade.service';
import { ShowCardDetailsEvent } from '@firestone/mainwindow/common';

@Component({
	standalone: false,
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
export class CardHistoryItemComponent extends AbstractSubscriptionComponent implements AfterContentInit {
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
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly cards: CardsFacadeService,
		private readonly mainWindowStateFacade: MainWindowStateFacadeService,
		private readonly prefs: PreferencesService,
	) {
		super(cdr);
	}

	ngAfterContentInit(): void {
		combineLatest([
			this.history$$.asObservable(),
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.locale)),
		])
			.pipe(this.mapData(([history, locale]) => ({ history, locale })))
			.subscribe((info) => {
				const history = info.history;

				this.cardId = history.cardId;
				this.newCard = history.isNewCard;
				this.relevantCount = history.relevantCount;

				const dbCard = this.cards.getCard(history.cardId);
				this.rarityImg = `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/rarity/rarity-${
					dbCard.rarity?.toLowerCase() || 'free'
				}.png`;

				const name = dbCard?.name;
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
					this.cdr.markForCheck();
				}
			});
	}

	@HostListener('mousedown') onClick() {
		this.mainWindowStateFacade.send(new ShowCardDetailsEvent(this.cardId));
	}
}
