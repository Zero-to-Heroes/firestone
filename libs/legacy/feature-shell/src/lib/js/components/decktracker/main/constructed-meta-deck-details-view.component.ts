import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	Input,
	Optional,
} from '@angular/core';
import { ConstructedCardData, ConstructedMatchupInfo } from '@firestone-hs/constructed-deck-stats';
import { Sideboard } from '@firestone-hs/deckstrings';
import { Card } from '@firestone/memory';
import { AbstractSubscriptionComponent, buildPercents } from '@firestone/shared/framework/common';
import { AnalyticsService, OverwolfService } from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { ConstructedMetaArchetypeShowDecksEvent } from '../../../services/mainwindow/store/processors/decktracker/constructed-meta-archetype-show-decks';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { ConstructedMatchupDetails } from './constructed-meta-deck-details-matchups.component';

@Component({
	selector: 'constructed-meta-deck-details-view',
	styleUrls: [`../../../../css/component/decktracker/main/constructed-meta-deck-details-view.component.scss`],
	template: `
		<ng-container *ngIf="!missing; else emptyState">
			<with-loading [isLoading]="loading">
				<div class="constructed-meta-deck-details-view">
					<div class="cartouche">
						<div class="player-class">
							<img class="icon" [src]="classIcon" [helpTooltip]="classTooltip" />
						</div>
						<div class="general-info">
							<div class="deck-name">{{ deckName }}</div>
							<div class="deck-type label-value">
								<div class="label" [owTranslate]="'app.decktracker.meta.deck-type-header'"></div>
								<div class="value">{{ deckType }}</div>
							</div>
							<div class="format label-value">
								<div class="label" [owTranslate]="'app.decktracker.meta.deck-format-header'"></div>
								<div class="value">{{ format }}</div>
							</div>
							<div class="games label-value">
								<div class="label" [owTranslate]="'app.decktracker.meta.games-header'"></div>
								<div class="value">{{ gamesPlayed }}</div>
							</div>
							<div class="winrate label-value">
								<div class="label" [owTranslate]="'app.decktracker.meta.winrate-header'"></div>
								<div class="value">{{ winrate }}</div>
							</div>
						</div>
						<div class="buttons">
							<copy-deckstring
								*ngIf="deckstring"
								class="button copy-deckstring"
								[deckstring]="deckstring"
								[deckName]="deckName"
								[title]="'app.decktracker.meta.deck.copy-deckstring-button' | owTranslate"
								[origin]="'constructed-meta-decks'"
							></copy-deckstring>
							<div class="button view-online" (click)="viewOnline()" *ngIf="deckstring">
								<div class="icon">
									<svg class="svg-icon-fill">
										<use xlink:href="assets/svg/replays/replays_icons.svg#match_watch" />
									</svg>
								</div>
								<div
									class="text"
									[owTranslate]="'app.decktracker.meta.deck.view-online-button'"
									[helpTooltip]="'app.decktracker.meta.deck.view-online-button-tooltip' | owTranslate"
								></div>
							</div>
							<div class="button view-decks" (click)="viewDecks()" *ngIf="!isDeck">
								<div class="icon">
									<svg class="svg-icon-fill">
										<use xlink:href="assets/svg/replays/replays_icons.svg#match_watch" />
									</svg>
								</div>
								<div
									class="text"
									[owTranslate]="'app.decktracker.meta.deck.view-decks-button'"
									[helpTooltip]="'app.decktracker.meta.deck.view-decks-button-tooltip' | owTranslate"
								></div>
							</div>
						</div>
					</div>
					<div class="details-container">
						<ul class="tabs">
							<ng-container *ngFor="let tab of tabs$ | async">
								<li
									*ngIf="!tab.restricted || tab.restricted === (isDeck ? 'deck' : 'archetype')"
									class="tab"
									[ngClass]="{ selected: tab.selected }"
									premiumSetting
									[premiumSettingEnabled]="tab.isPremium"
									(click)="selectTab(tab)"
								>
									<div
										class="premium-lock"
										[helpTooltip]="'settings.global.locked-tooltip' | owTranslate"
									>
										<svg>
											<use xlink:href="assets/svg/sprite.svg#lock" />
										</svg>
									</div>
									<div class="text" [owTranslate]="tab.name" [helpTooltip]="tab.tooltip"></div>
								</li>
							</ng-container>
						</ul>
						<div class="details" *ngIf="{ selectedTab: selectedTab$ | async } as value">
							<constructed-meta-deck-details-cards
								*ngIf="value.selectedTab === 'cards' && isDeck"
								[deck]="deck"
								[collection]="collection"
							></constructed-meta-deck-details-cards>
							<constructed-meta-archetype-details-cards
								*ngIf="value.selectedTab === 'cards' && !isDeck"
								[deck]="deck"
								[collection]="collection"
							></constructed-meta-archetype-details-cards>
							<constructed-meta-deck-details-card-stats
								*ngIf="value.selectedTab === 'card-stats'"
								[cards]="cards"
								[isDeck]="isDeck"
								[showRelativeInfo]="showRelativeInfo"
								[deckWinrate]="winrateNumber"
								[totalGames]="gamesPlayedNumber"
							></constructed-meta-deck-details-card-stats>
							<constructed-meta-deck-details-matchups
								*ngIf="value.selectedTab === 'matchups'"
								[matchupDetails]="matchupInfo"
							></constructed-meta-deck-details-matchups>
						</div>
					</div>
				</div>
			</with-loading>
		</ng-container>

		<ng-template #emptyState>
			<battlegrounds-empty-state
				[subtitle]="'app.decktracker.meta.deck.no-data-empty-state-title' | owTranslate"
				[emptyStateIcon]="'assets/svg/ftue/decktracker.svg'"
				class="empty-state"
			></battlegrounds-empty-state>
		</ng-template>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConstructedMetaDeckDetailsViewComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	tabs$: Observable<readonly Tab[]>;
	selectedTab$: Observable<TabType>;

	loading: boolean;
	missing: boolean;

	deck: ConstructedDeckDetails;
	isDeck: boolean;
	classTooltip: string;
	classIcon: string;
	deckName: string;
	deckType: string;
	format: string;
	gamesPlayedNumber: number;
	gamesPlayed: string;
	winrate: string;
	winrateNumber: number;
	cards: readonly ConstructedCardData[];
	matchupInfo: readonly ConstructedMatchupDetails[];

	deckstring?: string;

	@Input() collection: readonly Card[];
	@Input() hasPremiumAccess: boolean;
	@Input() showRelativeInfo: boolean;

	@Input() set input(value: ConstructedDeckDetails) {
		console.debug('[debug] input', value);
		this.loading = value === undefined;
		this.missing = value === null;
		if (!value) {
			return;
		}

		this.isDeck = value?.type === 'deck';
		this.deck = value;
		this.classIcon = `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/deck/classes/${value?.heroCardClass}.png`;
		this.classTooltip = this.i18n.translateString(`global.class.${value?.heroCardClass}`);
		this.deckName = value?.name;
		this.deckType = this.isDeck
			? this.i18n.translateString('app.decktracker.meta.details.deck-type')
			: this.i18n.translateString('app.decktracker.meta.details.archetype-type');
		this.format = value?.format;
		this.gamesPlayedNumber = value?.games;
		this.gamesPlayed = value?.games.toLocaleString(this.i18n.formatCurrentLocale());
		this.winrate = buildPercents(value?.winrate);
		this.winrateNumber = value?.winrate;
		this.cards = value?.cardsData;
		this.deckstring = value?.deckstring;
		this.matchupInfo = [
			{
				name: this.deckName,
				matchups: value?.matchups,
			},
		];
	}

	private selectedTab$$ = new BehaviorSubject<TabType>('cards');

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly analytics: AnalyticsService,
		@Optional() private readonly ow: OverwolfService,
		@Optional() private readonly store: AppUiStoreFacadeService,
	) {
		super(cdr);
	}

	ngAfterContentInit(): void {
		this.selectedTab$ = this.selectedTab$$.asObservable();
		const refTabs = [
			{
				id: 'cards' as const,
				name: this.i18n.translateString('app.decktracker.meta.cards-header'),
			},
			{
				id: 'card-stats' as const,
				name: this.i18n.translateString('app.decktracker.meta.card-stats-header'),
				tooltip: this.i18n.translateString('app.decktracker.meta.card-stats-header-tooltip'),
				isPremium: true,
			},
			{
				id: 'matchups' as const,
				name: this.i18n.translateString('app.decktracker.meta.matchups-header'),
				tooltip: this.i18n.translateString('app.decktracker.meta.matchups-header-tooltip'),
				isPremium: true,
			},
		];
		this.tabs$ = this.selectedTab$$.pipe(
			this.mapData((selectedTab) =>
				refTabs.map((tab) => ({
					...tab,
					selected: tab.id === selectedTab,
				})),
			),
		);
	}

	selectTab(tab: Tab) {
		if (tab.id !== this.selectedTab$$.value && (!tab.isPremium || this.hasPremiumAccess)) {
			this.analytics.trackEvent('meta-deck-select-tab', { tab: tab.id });
			this.selectedTab$$.next(tab.id);
		}
	}

	viewOnline() {
		this.analytics.trackEvent('meta-deck-view-online', { deckstring: this.deckstring });
		const url = `https://www.d0nkey.top/deck/${encodeURIComponent(this.deckstring)}?utm_source=firestone`;
		if (!!this.ow) {
			this.ow.openUrlInDefaultBrowser(url);
		} else {
			window.open(url, '_blank');
		}
	}

	viewDecks() {
		this.analytics.trackEvent('meta-archetype-view-decks', { archetype: this.deck.archetypeId });
		if (!!this.store) {
			this.store.send(new ConstructedMetaArchetypeShowDecksEvent(this.deck.archetypeId));
		} else {
			// Navigate to the correct URL
		}
	}
}

interface Tab {
	readonly id: TabType;
	readonly name: string;
	readonly selected: boolean;
	readonly tooltip?: string;
	readonly isPremium?: boolean;
	readonly restricted?: 'archetype' | 'deck';
}

type TabType = 'cards' | 'card-stats' | 'matchups';

export interface ConstructedDeckDetails {
	readonly type: 'deck' | 'archetype';
	readonly heroCardClass: string;
	readonly name: string;
	readonly format: string;
	readonly games: number;
	readonly winrate: number;
	readonly archetypeId: number;
	readonly cardsData: readonly ExtendedConstructedCardData[];
	readonly matchups: readonly ConstructedMatchupInfo[];
	readonly archetypeCoreCards: readonly string[];
	readonly cardVariations?: {
		readonly added: readonly string[];
		readonly removed: readonly string[];
	};
	readonly sideboards?: readonly Sideboard[];

	readonly deckstring?: string;
}

export interface ExtendedConstructedCardData extends ConstructedCardData {
	readonly sideboard?: Sideboard;
}
