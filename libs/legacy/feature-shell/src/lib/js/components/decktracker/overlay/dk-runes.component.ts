import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	Output,
} from '@angular/core';
import { decode } from '@firestone-hs/deckstrings';
import { CardClass, DkruneTypes } from '@firestone-hs/reference-data';
import { groupByFunction } from '@legacy-import/src/lib/js/services/utils';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { BehaviorSubject, combineLatest, Observable, share } from 'rxjs';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../abstract-subscription-store.component';

@Component({
	selector: 'dk-runes',
	styleUrls: ['../../../../css/component/decktracker/overlay/dk-runes.component.scss'],
	template: `
		<ng-container *ngIf="{ showRunes: showRunes$ | async, runes: dkRunes$ | async } as value">
			<div class="dk-runes" *ngIf="value.showRunes">
				<div
					class="runes-label"
					[owTranslate]="'app.duels.deckbuilder.dk-runes-text'"
					[helpTooltip]="'app.duels.deckbuilder.dk-runes-tooltip' | owTranslate"
				></div>
				<div class="runes-container">
					<div class="rune" *ngFor="let rune of value.runes"><img [src]="rune.image" /></div>
				</div>
			</div>
		</ng-container>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DkRunesComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	dkRunes$: Observable<readonly DkRune[]>;
	showRunes$: Observable<boolean>;

	@Output() dkRunes = new EventEmitter<readonly DkRune[]>();

	@Input() set deckstring(value: string) {
		this.deckstring$$.next(value);
	}

	@Input() set showRunes(value: boolean) {
		this.showRunes$$.next(value);
	}

	private deckstring$$ = new BehaviorSubject<string>(null);
	private showRunes$$ = new BehaviorSubject<boolean>(true);

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		const deckDefinition$ = this.deckstring$$.asObservable().pipe(
			this.mapData((deckstring) => {
				if (!deckstring) {
					return null;
				}
				return decode(deckstring);
			}),
			share(),
		);
		this.showRunes$ = combineLatest([deckDefinition$, this.showRunes$$.asObservable()]).pipe(
			this.mapData(([deckDefinition, showRunes]) => {
				if (!deckDefinition) {
					return false;
				}

				const result =
					showRunes &&
					deckDefinition.heroes.some(
						(h) => this.allCards.getCard(h).cardClass === CardClass[CardClass.DEATHKNIGHT],
					);
				return result;
			}),
		);
		const runesInDeck$ = deckDefinition$.pipe(
			this.mapData((deckDefinition) => {
				if (!deckDefinition) {
					return [];
				}

				const costs = deckDefinition.cards
					.map((pair) => pair[0])
					.map((dbfId) => this.allCards.getCard(dbfId))
					.filter((c) => !!c.additionalCosts)
					.map((c) => c.additionalCosts);

				const allRuneEntries = costs.flatMap((c) =>
					Object.entries(c).map((entry) => ({
						rune: entry[0],
						quantity: entry[1],
					})),
				);
				const groupedByRune = groupByFunction((rune: any) => rune.rune)(allRuneEntries);
				const maxRunesByType = Object.keys(groupedByRune).map((rune) => ({
					rune: rune,
					max: Math.max(...groupedByRune[rune].map((e) => e.quantity)),
				}));
				const result = maxRunesByType
					.flatMap((info) => Array(info.max).fill(info.rune))
					.map((rune: string) => ({
						type: DkruneTypes[rune],
						image: `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/runes/${rune.toLowerCase()}.png`,
					}));
				return result;
			}),
		);
		this.dkRunes$ = runesInDeck$.pipe(
			this.mapData((runes) => {
				const result = [...runes];
				for (let i = runes.length; i < 3; i++) {
					result.push({
						type: null,
						image: `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/runes/emptyrune.png`,
					});
				}
				return result;
			}),
		);
		this.dkRunes$.pipe(this.mapData((info) => info)).subscribe(this.dkRunes);
	}
}

export interface DkRune {
	readonly type: DkruneTypes;
	readonly image: string;
}
