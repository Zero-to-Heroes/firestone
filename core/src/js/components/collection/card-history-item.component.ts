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
import { CardsFacadeService } from '@services/cards-facade.service';
import { CardHistory } from '../../models/card-history';
import { Events } from '../../services/events.service';
import { ShowCardDetailsEvent } from '../../services/mainwindow/store/events/collection/show-card-details-event';
import { MainWindowStoreEvent } from '../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../services/overwolf.service';

declare let amplitude;

@Component({
	selector: 'card-history-item',
	styleUrls: [`../../../css/component/collection/card-history-item.component.scss`],
	template: `
		<div
			class="card-history-item"
			[ngClass]="{ 'active': active }"
			[cardTooltip]="cardId"
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
				<span>New</span>
			</span>
			<span class="new second" *ngIf="newCard && relevantCount > 1">
				<span>Second</span>
			</span>
			<span class="date">{{ creationDate }}</span>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardHistoryItemComponent implements AfterViewInit {
	@Input() active: boolean;

	newCard: boolean;
	relevantCount: number;
	rarityImg: string;
	cardName: string;
	creationDate: string;
	dustValue: number;
	cardId: string;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private cdr: ChangeDetectorRef,
		private ow: OverwolfService,
		private events: Events,
		private cards: CardsFacadeService,
	) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	@Input('historyItem') set historyItem(history: CardHistory) {
		if (!history) {
			return;
		}
		this.cardId = history.cardId;
		this.newCard = history.isNewCard;
		this.relevantCount = history.relevantCount;
		this.updateCard(history);
	}

	private updateCard(history: CardHistory, retriesLeft = 5) {
		if (retriesLeft < 0) {
			return;
		}
		if (!this.cards.getCards() || this.cards.getCards().length === 0) {
			// Cards service not initialized yet
			setTimeout(() => this.updateCard(history, retriesLeft - 1), 500);
			return;
		}
		const dbCard = this.cards.getCard(history.cardId);

		this.rarityImg = `assets/images/rarity/rarity-${dbCard.rarity || 'free'}.png`;
		const name = dbCard && dbCard.name ? dbCard.name : 'Unknown card';
		this.cardName = (history.isPremium ? 'Golden ' : '') + name;
		this.dustValue = this.getDust(dbCard, history.isPremium);
		this.creationDate = new Date(history.creationTimestamp).toLocaleDateString('en-GB', {
			day: '2-digit',
			month: '2-digit',
			year: '2-digit',
		});
		// FIXME: Why do I need this?
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@HostListener('mousedown') onClick() {
		amplitude.getInstance().logEvent('history', {
			'page': 'collection',
		});
		this.stateUpdater.next(new ShowCardDetailsEvent(this.cardId));
	}

	private getDust(dbCard: any, isPremium: boolean) {
		const dust = this.dustFor((dbCard.rarity || 'free').toLowerCase());
		return isPremium ? dust * 4 : dust;
	}

	private dustFor(rarity: string): number {
		switch (rarity) {
			case 'legendary':
				return 400;
			case 'epic':
				return 100;
			case 'rare':
				return 20;
			default:
				return 5;
		}
	}
}
