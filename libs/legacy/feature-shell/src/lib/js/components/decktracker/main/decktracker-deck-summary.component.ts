import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	ViewRef,
} from '@angular/core';
import { getDefaultHeroDbfIdForClass } from '@firestone-hs/reference-data';
import { DeckSummary } from '@firestone/constructed/common';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { CardsFacadeService, OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { StatGameFormatType } from '@firestone/stats/data-access';
import { BehaviorSubject, combineLatest, filter, Observable } from 'rxjs';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { DecktrackerDeleteDeckEvent } from '../../../services/mainwindow/store/events/decktracker/decktracker-delete-deck-event';
import { HideDeckSummaryEvent } from '../../../services/mainwindow/store/events/decktracker/hide-deck-summary-event';
import { RestoreDeckSummaryEvent } from '../../../services/mainwindow/store/events/decktracker/restore-deck-summary-event';
import { SelectDeckDetailsEvent } from '../../../services/mainwindow/store/events/decktracker/select-deck-details-event';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';

@Component({
	selector: 'decktracker-deck-summary',
	styleUrls: [
		`../../../../css/component/controls/controls.scss`,
		`../../../../css/component/controls/control-close.component.scss`,
		`../../../../css/global/menu.scss`,
		`../../../../css/component/decktracker/main/decktracker-deck-summary.component.scss`,
	],
	template: `
		<div class="decktracker-deck-summary" tabindex="0" [ngClass]="{ hidden: hidden }" (click)="selectDeck($event)">
			<div class="deck-name" [helpTooltip]="deckNameTooltip">{{ deckName }}</div>
			<div class="deck-image" aria-hidden="true">
				<img class="skin" [src]="skin$ | async" />
				<img
					class="frame"
					src="https://static.zerotoheroes.com/hearthstone/asset/firestone/images/deck/hero_frame.png"
				/>
				<img class="decoration {{ format }}" *ngIf="decoration" [src]="decoration" />
			</div>
			<div class="stats">
				<div
					class="text total-games"
					[owTranslate]="'app.decktracker.deck-summary.total-games'"
					[translateParams]="{ value: totalGames }"
					[attr.aria-label]="'app.decktracker.deck-summary.total-games' | owTranslate: { value: totalGames }"
				></div>
				<div
					class="text win-rate"
					*ngIf="winRatePercentage != null"
					[owTranslate]="'app.decktracker.deck-summary.winrate'"
					[translateParams]="{ value: winRatePercentage }"
					[attr.aria-label]="
						'app.decktracker.deck-summary.winrate' | owTranslate: { value: winRatePercentage }
					"
				></div>
				<div
					class="last-used"
					*ngIf="totalGames > 0"
					[owTranslate]="'app.decktracker.deck-summary.last-used'"
					[translateParams]="{ value: lastUsed }"
					[attr.aria-label]="'app.decktracker.deck-summary.last-used' | owTranslate: { value: lastUsed }"
				></div>
				<div
					class="last-used"
					*ngIf="totalGames == 0"
					[owTranslate]="'app.decktracker.deck-summary.created-on'"
					[translateParams]="{ value: lastUsed }"
					[attr.aria-label]="'app.decktracker.deck-summary.created-on' | owTranslate: { value: lastUsed }"
				></div>
			</div>
			<div class="buttons">
				<button
					class="move-button"
					[helpTooltip]="'app.decktracker.deck-summary.move-button-tooltip' | owTranslate"
					aria-hidden="true"
				>
					<svg class="svg-icon-fill">
						<use xmlns:xlink="https://www.w3.org/1999/xlink" xlink:href="assets/svg/sprite.svg#move"></use>
					</svg>
				</button>
				<button
					class="close-button"
					[helpTooltip]="'app.decktracker.deck-summary.archive-button-tooltip' | owTranslate"
					(mousedown)="hideDeck($event)"
					*ngIf="!hidden"
				>
					<svg class="svg-icon-fill">
						<use xmlns:xlink="https://www.w3.org/1999/xlink" xlink:href="assets/svg/sprite.svg#hide"></use>
					</svg>
				</button>
				<button
					class="restore-button"
					[helpTooltip]="'app.decktracker.deck-summary.restore-button-tooltip' | owTranslate"
					(mousedown)="restoreDeck($event)"
					*ngIf="hidden"
				>
					<svg class="svg-icon-fill">
						<use xmlns:xlink="https://www.w3.org/1999/xlink" xlink:href="assets/svg/sprite.svg#show"></use>
					</svg>
				</button>
				<button
					class="delete-button"
					[helpTooltip]="deleteDeckTooltip"
					confirmationTooltip
					[askConfirmation]="true"
					[confirmationTitle]="'app.duels.deck-stat.delete-deck-confirmation-title' | owTranslate"
					[confirmationText]="'app.duels.deck-stat.delete-deck-confirmation-text' | owTranslate"
					[validButtonText]="'app.duels.deck-stat.delete-deck-confirmation-ok' | owTranslate"
					[cancelButtonText]="'app.duels.deck-stat.delete-deck-confirmation-cancel' | owTranslate"
					(onConfirm)="deleteDeck()"
					inlineSVG="assets/svg/bin.svg"
				></button>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DecktrackerDeckSummaryComponent
	extends AbstractSubscriptionComponent
	implements AfterViewInit, AfterContentInit
{
	skin$: Observable<string>;

	@Input() set deck(value: DeckSummary) {
		this._deck = value;
		this.deckName = value.deckName || this.i18n.translateString('app.decktracker.deck-summary.default-deck-name');
		this.format = value.format;
		this.deckNameTooltip = `${this.deckName} (${this.i18n.translateString('global.format.' + this.format)})`;
		this.totalGames = value.totalGames ?? 0;
		this.winRatePercentage =
			value.winRatePercentage != null
				? parseFloat('' + value.winRatePercentage).toLocaleString(this.i18n.formatCurrentLocale(), {
						minimumIntegerDigits: 1,
						maximumFractionDigits: 2,
				  })
				: null;
		this.lastUsed = value.lastUsedTimestamp ? this.buildLastUsedDate(value.lastUsedTimestamp) : 'N/A';

		this.skin$$.next(value.skin);
		this.hidden = value.hidden;
		this.decoration = this.buildDecoration(value.format);
	}

	_deck: DeckSummary;
	deckName: string;
	deckNameTooltip: string;
	deckNameClass: string;
	totalGames: number;
	winRatePercentage: string;
	lastUsed: string;
	hidden: boolean;
	decoration: string;
	format: StatGameFormatType;

	deleteDeckTooltip = this.i18n.translateString('app.duels.deck-stat.delete-deck-tooltip');

	private skin$$ = new BehaviorSubject<string | null>(null);

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly i18n: LocalizationFacadeService,
		private readonly prefs: PreferencesService,
		private readonly allCards: CardsFacadeService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs);

		this.skin$ = combineLatest([
			this.skin$$,
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.replaysShowClassIcon)),
		]).pipe(
			filter(([skin, showClassIcon]) => !!skin),
			this.mapData(([skin, showClassIcon]) => {
				if (!showClassIcon) {
					return `https://static.zerotoheroes.com/hearthstone/cardart/256x/${skin}.jpg`;
				}
				const card = this.allCards.getCard(skin);
				const defaultHero = getDefaultHeroDbfIdForClass(card.classes?.[0]);
				const defaultHeroCard = this.allCards.getCard(defaultHero);
				return `https://static.zerotoheroes.com/hearthstone/cardart/256x/${defaultHeroCard.id}.jpg`;
			}),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	hideDeck(event: MouseEvent) {
		this.stateUpdater.next(new HideDeckSummaryEvent(this._deck.deckstring));
		event.stopPropagation();
		event.preventDefault();
	}

	restoreDeck(event: MouseEvent) {
		this.stateUpdater.next(new RestoreDeckSummaryEvent(this._deck.deckstring));
		event.stopPropagation();
		event.preventDefault();
	}

	deleteDeck() {
		console.log('[deck-delete] deleting deck', this._deck?.deckstring);
		this.stateUpdater.next(new DecktrackerDeleteDeckEvent(this._deck?.deckstring));
	}

	selectDeck(event: MouseEvent) {
		event.stopPropagation();
		event.preventDefault();
		if ((event.target as any)?.tagName === 'BUTTON') {
			return;
		}
		this.stateUpdater.next(new SelectDeckDetailsEvent(this._deck.deckstring));
	}

	private buildLastUsedDate(lastUsedTimestamp: number): string {
		const date = new Date(lastUsedTimestamp);
		return date
			.toLocaleDateString(this.i18n.formatCurrentLocale(), {
				month: 'short',
				day: '2-digit',
				year: 'numeric',
			})
			.replace(/\s+г\./, ''); //truncate date in russian
	}

	private buildDecoration(gameFormat: StatGameFormatType) {
		switch (gameFormat) {
			case 'classic':
				return `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/deck/ranks/ranked/Medal_Classic.png`;
			case 'twist':
				return `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/deck/ranks/ranked/Medal_Twist.webp`;
			case 'wild':
				return `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/deck/ranks/ranked/Medal_Wild.png`;
			default:
				return null;
		}
	}
}
