import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { AbstractSubscriptionStoreComponent } from '@components/abstract-subscription-store.component';
import { decode } from '@firestone-hs/deckstrings';
import { BrawlInfo, DeckStat, StatForClass } from '@firestone-hs/tavern-brawl-stats';
import { Card } from '@firestone/memory';
import { CardsFacadeService, waitForReady } from '@firestone/shared/framework/core';
import { pickRandom } from '@legacy-import/src/lib/js/services/utils';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { AppUiStoreFacadeService } from '@services/ui-store/app-ui-store-facade.service';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { TavernBrawlService } from '../../services/tavern-brawl.service';

@Component({
	standalone: false,
	selector: 'tavern-brawl-meta',
	styleUrls: [`../../../../css/component/app-section.component.scss`, `./tavern-brawl-meta.component.scss`],
	template: `
		<div class="tavern-brawl-meta">
			<div class="brawl-info" *ngIf="brawlInfo$ | async as brawlInfo">
				<div class="brawl-name">{{ brawlInfo.nameLabel }}</div>
			</div>
			<div class="stats">
				<tavern-brawl-stat *ngFor="let stat of stats$ | async" [stat]="stat"></tavern-brawl-stat>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TavernBrawlMetaComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit, OnDestroy
{
	brawlInfo$: Observable<ExtendedBrawlInfo>;
	stats$: Observable<readonly TavernStatWithCollection[]>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly allCards: CardsFacadeService,
		private readonly brawl: TavernBrawlService,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.brawl);
		const debug = await this.brawl.tavernBrawl$$.getValueWithInit();

		this.brawlInfo$ = this.brawl.tavernBrawl$$.pipe(
			this.mapData((stats) => {
				if (!stats?.info) {
					return null;
				}

				const nameLabel: string = this.i18n.translateString(
					!!stats.info?.name ? 'app.tavern-brawl.with-name' : 'app.tavern-brawl.no-name',
					{
						name: stats.info?.name,
						date: !!stats.info?.startDate
							? new Date(stats.info.startDate).toLocaleString(this.i18n.formatCurrentLocale(), {
									month: 'long',
									day: 'numeric',
							  })
							: 'unknown date',
					},
				);
				return {
					...stats.info,
					nameLabel: nameLabel,
				};
			}),
		);
		this.stats$ = combineLatest([this.brawl.tavernBrawl$$, this.store.collection$()]).pipe(
			map(([stats, collection]) => ({ stats: stats, collection: collection })),
			this.mapData((info) => {
				return (
					info.stats?.stats
						.filter((stat) => !!stat.playerClass)
						.map((stat) => {
							let buildableDecks: readonly DeckStat[] = stat.bestDecks.filter((decklist) =>
								this.canBuild(decklist, info.collection ?? []),
							);
							const hasBuildableDecks = buildableDecks?.length > 0;
							if (!buildableDecks?.length) {
								buildableDecks = stat.bestDecks;
							}

							const targetDecks = buildableDecks.slice(0, 3);
							const buildableDeck: string = pickRandom(targetDecks)?.decklist;
							return {
								...stat,
								hasBuildableDecks: hasBuildableDecks,
								buildableDecklist: buildableDeck,
							} as TavernStatWithCollection;
						})
						.sort((a, b) => b.winrate - a.winrate) ?? []
				);
			}),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private canBuild(deck: DeckStat, collection: readonly Card[]): boolean {
		if (!deck.decklist?.length || deck.decklist === 'null') {
			return false;
		}

		try {
			const deckDefinition = decode(deck.decklist);
			const flatDeckCardIds = deckDefinition.cards
				.flatMap((pair) => new Array(pair[1]).fill(pair[0]))
				.map((dbfId) => this.allCards.getCard(dbfId).id)
				.sort();
			const cardsInCollection = collection
				.filter((card) => flatDeckCardIds.includes(card.id))
				.flatMap((card) => {
					const maxTheoretical = this.allCards.getCard(card.id).rarity?.toLowerCase() === 'legendary' ? 1 : 2;
					const maxUsed = flatDeckCardIds.filter((c) => c === card.id).length;
					const max = Math.min(maxTheoretical, maxUsed);
					return new Array(
						Math.min(
							max,
							(card.count ?? 0) +
								(card.premiumCount ?? 0) +
								(card.diamondCount ?? 0) +
								(card.signatureCount ?? 0),
						),
					).fill(card.id);
				})
				.sort();
			// if (deckDefinition.heroes.includes(getDefaultHeroDbfIdForClass('druid'))) {
			// 	console.debug(
			// 		'[tavern-brawl-meta] deck',
			// 		deckDefinition,
			// 		flatDeckCardIds,
			// 		deckDefinition.cards
			// 			.flatMap((pair) => new Array(pair[1]).fill(pair[0]))
			// 			.map((dbfId) => this.allCards.getCard(dbfId).name)
			// 			.sort(),
			// 		cardsInCollection,
			// 	);
			// }
			if (flatDeckCardIds.length !== cardsInCollection.length) {
				return false;
			}
			for (let i = 0; i < flatDeckCardIds.length; i++) {
				if (flatDeckCardIds[i] !== cardsInCollection[i]) {
					return false;
				}
			}
			return true;
		} catch (e) {
			console.warn('[tavern-brawl-meta] error', e);
			return false;
		}
	}
}

export interface ExtendedBrawlInfo extends BrawlInfo {
	readonly nameLabel: string;
}

export interface TavernStatWithCollection extends StatForClass {
	readonly buildableDecklist: string;
	readonly hasBuildableDecks: boolean;
}
