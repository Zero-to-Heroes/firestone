import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { GameTag, Race, ReferenceCard } from '@firestone-hs/reference-data';
import { BgsBoardHighlighterService } from '@firestone/battlegrounds/common';
import { Tier, TierGroup, TierViewType } from '@firestone/battlegrounds/core';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent, uuid } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';

@Component({
	standalone: false,
	selector: 'bgs-minions-list',
	styleUrls: [`../../../../css/global/cdk-overlay.scss`, './bgs-minions-list.component.scss'],
	template: `
		<div class="bgs-minions-list">
			<div class="group-header" *ngIf="tierName">
				<div class="header-text">{{ tierName }}</div>
				<div
					class="highlight-button"
					[ngClass]="{ highlighted: highlighted$ | async }"
					inlineSVG="assets/svg/pinned.svg"
					(click)="toggleHighlight()"
					[helpTooltip]="null"
					[helpTooltipPosition]="'left'"
				></div>
			</div>
			<div class="search-bar" *ngIf="showSearchBar">
				<fs-text-input
					class="search-input"
					[placeholder]="'Search name or text'"
					[value]="''"
					(fsModelUpdate)="onSearchStringChange($event)"
				></fs-text-input>
				<div class="grouping-toggle">
					<div
						class="toggle"
						[ngClass]="{ enabled: (groupBy$ | async) === 'tribe' }"
						(click)="toggleGroupingByTribe()"
					>
						<div class="text">Tribes</div>
					</div>
					<div
						class="toggle"
						[ngClass]="{ enabled: (groupBy$ | async) === 'tier' }"
						(click)="toggleGroupingByTier()"
					>
						<div class="text">Tiers</div>
					</div>
				</div>
			</div>
			<bgs-minions-group
				class="minion-group"
				*ngFor="let group of groups$ | async; trackBy: trackByGroup"
				[group]="group"
				[showTribesHighlight]="showTribesHighlight"
				[showGoldenCards]="showGoldenCards"
				[showTrinketTips]="showTrinketTips"
				[highlightedMinions]="highlightedMinions"
				[highlightedTribes]="highlightedTribes$ | async"
				[highlightedTiers]="highlightedTiers$ | async"
				[highlightedMechanics]="highlightedMechanics$ | async"
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
export class BattlegroundsMinionsListComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	highlighted$: Observable<boolean>;
	highlightedTribes$: Observable<readonly Race[]>;
	highlightedTiers$: Observable<readonly number[]>;
	highlightedMechanics$: Observable<readonly GameTag[]>;
	groups$: Observable<readonly TierGroup[]>;
	groupBy$: Observable<'tribe' | 'tier'>;

	tierName: string | undefined;
	showSearchBar: boolean;

	uuid = uuid();

	@Input() set tier(value: Tier) {
		if (!value) {
			return;
		}
		this.groups$$.next(value?.groups ?? []);
		this.tierName = value.tierName;
		this.type = value.type;
		this.tavernTierData$$.next(value.tavernTierData ?? null);
		this.showSearchBar = value.showSearchBar ?? false;
	}

	@Input() set highlightedTribes(value: readonly Race[]) {
		this.highlightedTribes$$.next(value);
	}
	@Input() set highlightedTiers(value: readonly number[]) {
		this.highlightedTiers$$.next(value);
	}
	@Input() set highlightedMechanics(value: readonly GameTag[]) {
		this.highlightedMechanics$$.next(value);
	}

	@Input() highlightedMinions: readonly string[];
	@Input() showTribesHighlight: boolean;
	@Input() showGoldenCards: boolean;
	@Input() showTrinketTips: boolean;

	private type: TierViewType;

	private groups$$ = new BehaviorSubject<readonly TierGroup[]>([]);
	private searchString$$ = new BehaviorSubject<string | null>(null);
	private highlightedTribes$$ = new BehaviorSubject<readonly Race[]>([]);
	private highlightedTiers$$ = new BehaviorSubject<readonly number[]>([]);
	private highlightedMechanics$$ = new BehaviorSubject<readonly GameTag[]>([]);
	private tavernTierData$$ = new BehaviorSubject<GameTag | Race | number | null>(null);

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly highlighter: BgsBoardHighlighterService,
		private readonly prefs: PreferencesService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs);
		this.groupBy$ = this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.bgsSingleTierGroup));
		this.highlightedTribes$ = this.highlightedTribes$$.asObservable();
		this.highlightedTiers$ = this.highlightedTiers$$.asObservable();
		this.highlightedMechanics$ = this.highlightedMechanics$$.asObservable();
		this.highlighted$ = combineLatest([
			this.highlightedTribes$,
			this.highlightedTiers$,
			this.highlightedMechanics$,
			this.tavernTierData$$,
		]).pipe(
			this.mapData(([highlightedTribes, highlightedTiers, highlightedMechanics, tavernTierData]) => {
				return (
					highlightedTribes?.includes(tavernTierData as Race) ||
					highlightedMechanics?.includes(tavernTierData as GameTag) ||
					highlightedTiers?.includes(tavernTierData as number)
				);
			}),
		);
		this.groups$ = combineLatest([this.groups$$, this.searchString$$]).pipe(
			this.mapData(([groups, searchString]) => {
				return !searchString?.length
					? groups
					: groups.map((g) => this.filterGroup(g, searchString)).filter((g: TierGroup) => g.cards.length > 0);
			}),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	resetHighlights() {
		this.highlighter.resetHighlights();
	}

	trackByGroup(index, item: TierGroup) {
		return item.label;
	}

	toggleHighlight() {
		if (!this.tavernTierData$$.value) {
			return;
		}

		switch (this.type) {
			case 'tribe':
				this.highlighter.toggleTribesToHighlight([this.tavernTierData$$.value as Race]);
				break;
			case 'mechanics':
				this.highlighter.toggleMechanicsToHighlight([this.tavernTierData$$.value as GameTag]);
				break;
			case 'standard':
				this.highlighter.toggleTiersToHighlight([this.tavernTierData$$.value as number]);
				break;
		}
	}

	toggleGroupingByTribe() {
		this.prefs.updatePrefs('bgsSingleTierGroup', 'tribe');
	}
	toggleGroupingByTier() {
		this.prefs.updatePrefs('bgsSingleTierGroup', 'tier');
	}

	onSearchStringChange(searchString: string) {
		this.searchString$$.next(searchString);
	}

	private filterGroup(group: TierGroup, searchString: string): TierGroup {
		return {
			...group,
			cards: group.cards.filter((c) => this.filterCard(c, searchString)),
		};
	}

	private filterCard(card: ReferenceCard, searchString: string): boolean {
		return (
			card.name.toLowerCase().includes(searchString.toLowerCase()) ||
			card.text.toLowerCase().includes(searchString.toLowerCase())
		);
	}
}
