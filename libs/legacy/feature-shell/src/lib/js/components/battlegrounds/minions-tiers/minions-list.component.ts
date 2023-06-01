import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
} from '@angular/core';
import { GameTag, Race, ReferenceCard } from '@firestone-hs/reference-data';
import { AbstractSubscriptionComponent, arraysEqual, uuid } from '@firestone/shared/framework/common';
import { OverwolfService } from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable, combineLatest, debounceTime, distinctUntilChanged, filter } from 'rxjs';
import { tribeValueForSort } from '../../../services/battlegrounds/bgs-utils';
import { BattlegroundsStoreEvent } from '../../../services/battlegrounds/store/events/_battlegrounds-store-event';
import { BgsResetHighlightsEvent } from '../../../services/battlegrounds/store/events/bgs-reset-highlights-event';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { multiGroupByFunction } from '../../../services/utils';
import { Tier } from './battlegrounds-minions-tiers-view.component';
import { BgsMinionsGroup } from './bgs-minions-group';

@Component({
	selector: 'bgs-minions-list',
	styleUrls: [
		`../../../../css/global/cdk-overlay.scss`,
		'../../../../css/component/battlegrounds/minions-tiers/bgs-minions-list.component.scss',
	],
	template: `
		<div class="bgs-minions-list">
			<bgs-minions-group
				class="minion-group"
				*ngFor="let group of groups$ | async; trackBy: trackByGroup"
				[group]="group"
				[showTribesHighlight]="showTribesHighlight"
				[showBattlecryHighlight]="showBattlecryHighlight"
				[showGoldenCards]="showGoldenCards"
			></bgs-minions-group>

			<div class="reset-all-button" (click)="resetHighlights()" *ngIf="showTribesHighlight">
				<div class="background-second-part"></div>
				<div class="background-main-part"></div>
				<div class="content">
					<div class="icon" inlineSVG="assets/svg/restore.svg"></div>
					{{ 'battlegrounds.in-game.minions-list.reset-button' | owTranslate }}
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsMinionsListComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit, AfterViewInit
{
	groups$: Observable<readonly BgsMinionsGroup[]>;

	@Input() set tier(value: Tier) {
		this.uuid = value.tavernTier + '-' + value.type;
		this.cards$$.next(value.cards.filter((c) => !!c));
		this.groupingFunction$$.next(value.groupingFunction);
	}

	@Input() set groupingFunction(value: (card: ReferenceCard) => readonly string[]) {
		this.groupingFunction$$.next(value);
	}

	@Input() set highlightedMinions(value: readonly string[]) {
		this.highlightedMinions$$.next(value ?? []);
	}

	@Input() set highlightedTribes(value: readonly Race[]) {
		this.highlightedTribes$$.next(value ?? []);
	}

	@Input() set highlightedMechanics(value: readonly GameTag[]) {
		this.highlightedMechanics$$.next(value ?? []);
	}

	@Input() showTribesHighlight: boolean;
	@Input() showBattlecryHighlight: boolean;
	@Input() showGoldenCards: boolean;

	cards$$ = new BehaviorSubject<readonly ReferenceCard[]>([]);
	groupingFunction$$ = new BehaviorSubject<(card: ReferenceCard) => readonly string[]>(null);
	highlightedMinions$$ = new BehaviorSubject<readonly string[]>([]);
	highlightedTribes$$ = new BehaviorSubject<readonly Race[]>([]);
	highlightedMechanics$$ = new BehaviorSubject<readonly GameTag[]>([]);

	private battlegroundsUpdater: EventEmitter<BattlegroundsStoreEvent>;

	private uuid = uuid();

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly i18n: LocalizationFacadeService,
	) {
		super(cdr);
	}

	ngAfterContentInit(): void {
		this.groups$ = combineLatest([
			this.cards$$.pipe(distinctUntilChanged((a, b) => arraysEqual(a, b))),
			this.groupingFunction$$.pipe(distinctUntilChanged((a, b) => arraysEqual(a, b))),
			this.highlightedMinions$$.pipe(distinctUntilChanged((a, b) => arraysEqual(a, b))),
			this.highlightedTribes$$.pipe(distinctUntilChanged((a, b) => arraysEqual(a, b))),
			this.highlightedMechanics$$.pipe(distinctUntilChanged((a, b) => arraysEqual(a, b))),
		]).pipe(
			filter(
				([cards, groupingFunction, highlightedMinions, highlightedTribes, highlightedMechanics]) =>
					!!cards && !!groupingFunction,
			),
			debounceTime(50),
			this.mapData(([cards, groupingFunction, highlightedMinions, highlightedTribes, highlightedMechanics]) => {
				const groupedByTribe = multiGroupByFunction(groupingFunction)(cards);
				return Object.keys(groupedByTribe)
					.sort((a: string, b: string) => tribeValueForSort(a) - tribeValueForSort(b)) // Keep consistent ordering
					.map((tribeString) => {
						return {
							tribe: isNaN(+tribeString) ? Race[tribeString] : null,
							title: isNaN(+tribeString)
								? this.i18n.translateString(`global.tribe.${tribeString.toLowerCase()}`)
								: this.i18n.translateString(`app.battlegrounds.filters.tier.tier`, {
										value: tribeString,
								  }),
							minions: groupedByTribe[tribeString],
							highlightedMinions: highlightedMinions || [],
							highlightedTribes: highlightedTribes || [],
							highlightedMechanics: highlightedMechanics || [],
						};
					});
			}),
		);
	}

	async ngAfterViewInit() {
		this.battlegroundsUpdater = (await this.ow.getMainWindow())?.battlegroundsUpdater;
	}

	resetHighlights() {
		this.battlegroundsUpdater.next(new BgsResetHighlightsEvent());
	}

	trackByGroup(index, item: BgsMinionsGroup) {
		return item.tribe;
	}
}
