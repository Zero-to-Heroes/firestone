import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { ArchetypeStat, ConstructedCardData } from '@firestone-hs/constructed-deck-stats';
import { Sideboard } from '@firestone-hs/deckstrings';
import { AbstractSubscriptionComponent, buildPercents } from '@firestone/shared/framework/common';
import { AnalyticsService, OverwolfService } from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Card } from '../../../models/card';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';

@Component({
	selector: 'constructed-meta-deck-details-view',
	styleUrls: [`../../../../css/component/decktracker/main/constructed-meta-deck-details-view.component.scss`],
	template: `
		<div class="constructed-meta-deck-details-view" *ngIf="deckName">
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
				</div>
			</div>
			<div class="details-container">
				<ul class="tabs">
					<li
						*ngFor="let tab of tabs$ | async"
						class="tab"
						[ngClass]="{ selected: tab.selected }"
						premiumSetting
						[premiumSettingEnabled]="tab.isPremium"
						(click)="selectTab(tab)"
					>
						<div class="premium-lock" [helpTooltip]="'settings.global.locked-tooltip' | owTranslate">
							<svg>
								<use xlink:href="assets/svg/sprite.svg#lock" />
							</svg>
						</div>
						<div class="text" [owTranslate]="tab.name" [helpTooltip]="tab.tooltip"></div>
					</li>
				</ul>
				<div class="details" *ngIf="{ selectedTab: selectedTab$ | async } as value">
					<constructed-meta-deck-details-cards
						*ngIf="value.selectedTab === 'cards' && isDeck"
						[deck]="deck"
						[archetypes]="archetypes"
						[collection]="collection"
					></constructed-meta-deck-details-cards>
					<constructed-meta-archetype-details-cards
						*ngIf="value.selectedTab === 'cards' && !isDeck"
						[deck]="deck"
						[archetypes]="archetypes"
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
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConstructedMetaDeckDetailsViewComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	tabs$: Observable<readonly Tab[]>;
	selectedTab$: Observable<TabType>;

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

	deckstring?: string;

	@Input() archetypes: readonly ArchetypeStat[];
	@Input() collection: readonly Card[];
	@Input() hasPremiumAccess: boolean;
	@Input() showRelativeInfo: boolean;

	@Input() set input(value: ConstructedDeckDetails) {
		//console.debug('[debug] input', value);
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
	}

	private selectedTab$$ = new BehaviorSubject<TabType>('cards');

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly ow: OverwolfService,
		private readonly analytics: AnalyticsService,
	) {
		super(cdr);
	}

	ngAfterContentInit(): void {
		this.selectedTab$ = this.selectedTab$$.asObservable();
		const refTabs = [
			{
				id: 'cards' as TabType,
				name: this.i18n.translateString('app.decktracker.meta.cards-header'),
			},
			{
				id: 'card-stats' as TabType,
				name: this.i18n.translateString('app.decktracker.meta.card-stats-header'),
				tooltip: this.i18n.translateString('app.decktracker.meta.card-stats-header-tooltip'),
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
			this.selectedTab$$.next(tab.id);
			this.analytics.trackEvent('meta-deck-select-tab', { tab: tab.id });
		}
	}

	viewOnline() {
		this.ow.openUrlInDefaultBrowser(
			`https://www.d0nkey.top/deck/${encodeURIComponent(this.deckstring)}?utm_source=firestone`,
		);
		this.analytics.trackEvent('meta-deck-view-online', { deckstring: this.deckstring });
	}
}

interface Tab {
	readonly id: TabType;
	readonly name: string;
	readonly tooltip?: string;
	readonly isPremium?: boolean;
	readonly selected: boolean;
}

type TabType = 'cards' | 'card-stats';

export interface ConstructedDeckDetails {
	readonly type: 'deck' | 'archetype';
	readonly heroCardClass: string;
	readonly name: string;
	readonly format: string;
	readonly games: number;
	readonly winrate: number;
	readonly archetypeId: number;
	readonly cardsData: readonly ConstructedCardData[];
	readonly archetypeCoreCards: readonly string[];
	readonly cardVariations?: {
		readonly added: readonly string[];
		readonly removed: readonly string[];
	};
	readonly sideboards?: readonly Sideboard[];

	readonly deckstring?: string;
}
