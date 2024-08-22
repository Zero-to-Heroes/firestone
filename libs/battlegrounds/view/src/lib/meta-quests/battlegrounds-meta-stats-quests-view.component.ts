/* eslint-disable @angular-eslint/template/no-negated-async */
import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	Output,
} from '@angular/core';
import { BgsMetaQuestStatTier, BgsMetaQuestStatTierItem, buildQuestTiers } from '@firestone/battlegrounds/data-access';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { ILocalizationService, getDateAgo } from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable, combineLatest, filter } from 'rxjs';

@Component({
	selector: 'battlegrounds-meta-stats-quests-view',
	styleUrls: [
		`./battlegrounds-meta-stats-quests-columns.scss`,
		`./battlegrounds-meta-stats-quests-view.component.scss`,
	],
	template: `
		<section
			class="battlegrounds-meta-stats-quests"
			[attr.aria-label]="'Battlegrounds meta quest stats'"
			*ngIf="{
				tiers: tiers$ | async,
				showCollapseButton: showCollapseButton$ | async
			} as value"
		>
			<div class="data-info">
				<div class="label" [fsTranslate]="'app.decktracker.meta.last-updated'"></div>
				<div class="value" [helpTooltip]="lastUpdateFull$ | async">{{ lastUpdate$ | async }}</div>
				<div class="separator">-</div>
				<div class="label" [fsTranslate]="'app.decktracker.meta.total-games'"></div>
				<div class="value">{{ totalGames$ | async }}</div>
			</div>

			<div class="header">
				<div class="image"></div>
				<div class="quest-details" [fsTranslate]="'app.battlegrounds.tier-list.header-quest-details'"></div>
				<div
					class="turns-to-complete"
					[fsTranslate]="'app.battlegrounds.tier-list.header-average-turns-to-complete'"
				></div>

				<div class="button-groups">
					<div class="collapse-buttons" *ngIf="groupedByDifficulty">
						<div class="button collapse-button" *ngIf="value.showCollapseButton" (click)="onCollapseAll()">
							<div
								class="text"
								[fsTranslate]="'app.battlegrounds.tier-list.header-collapse-all-button'"
							></div>
							<div class="icon" inlineSVG="assets/svg/collapse_caret.svg"></div>
						</div>
						<div class="button expand-button" *ngIf="!value.showCollapseButton" (click)="onExpandAll()">
							<div
								class="text"
								[fsTranslate]="'app.battlegrounds.tier-list.header-expand-all-button'"
							></div>
							<div class="icon" inlineSVG="assets/svg/collapse_caret.svg"></div>
						</div>
					</div>

					<div class="group-buttons">
						<div
							class="button group-button"
							*ngIf="!groupedByDifficulty"
							(click)="onGroupDifficulty()"
							[helpTooltip]="
								'app.battlegrounds.tier-list.header-group-difficulty-button-tooltip' | fsTranslate
							"
						>
							<div
								class="text"
								[fsTranslate]="'app.battlegrounds.tier-list.header-group-difficulty-button'"
							></div>
							<div class="icon" inlineSVG="assets/svg/collapse_caret.svg"></div>
						</div>
						<div
							class="button ungroup-button"
							*ngIf="groupedByDifficulty"
							(click)="onUngroupDifficulty()"
							[helpTooltip]="
								'app.battlegrounds.tier-list.header-ungroup-difficulty-button-tooltip' | fsTranslate
							"
						>
							<div
								class="text"
								[fsTranslate]="'app.battlegrounds.tier-list.header-ungroup-difficulty-button'"
							></div>
							<div class="icon" inlineSVG="assets/svg/collapse_caret.svg"></div>
						</div>
					</div>
					<fs-text-input
						class="search"
						[value]="searchString"
						[placeholder]="'app.battlegrounds.tier-list.quest-search-placeholder' | fsTranslate"
						[debounceTime]="100"
						(fsModelUpdate)="onSearchStringUpdated($event)"
					>
					</fs-text-input>
				</div>
			</div>
			<div class="quests-list" role="list" scrollable>
				<battlegrounds-meta-stats-quest-tier
					*ngFor="let tier of value.tiers; trackBy: trackByFn"
					role="listitem"
					[tier]="tier"
					[collapsedQuests]="collapsedQuests$ | async"
					(statClicked)="onStatClicked($event)"
				></battlegrounds-meta-stats-quest-tier>
			</div>
		</section>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsMetaStatsQuestsViewComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit
{
	@Output() statClick = new EventEmitter<BgsMetaQuestStatTierItem>();
	@Output() collapseAll = new EventEmitter<void>();
	@Output() expandAll = new EventEmitter<void>();
	@Output() groupDifficulty = new EventEmitter<void>();
	@Output() ungroupDifficulty = new EventEmitter<void>();

	tiers$: Observable<readonly BgsMetaQuestStatTier[]>;
	collapsedQuests$: Observable<readonly string[]>;
	showCollapseButton$: Observable<boolean>;
	lastUpdate$: Observable<string | null>;
	lastUpdateFull$: Observable<string | null>;
	totalGames$: Observable<string>;

	@Input() set stats(value: readonly BgsMetaQuestStatTierItem[] | null) {
		this.stats$$.next(value);
	}
	@Input() set lastUpdate(value: string | null) {
		this.lastUpdate$$.next(value);
	}
	@Input() set collapsedQuests(value: readonly string[] | null) {
		this.collapsedQuests$$.next(value);
	}
	@Input() groupedByDifficulty: boolean | null;
	@Input() searchString: string;

	private stats$$ = new BehaviorSubject<readonly BgsMetaQuestStatTierItem[]>(null);
	private collapsedQuests$$ = new BehaviorSubject<readonly string[]>([]);
	private lastUpdate$$ = new BehaviorSubject<string | null>(null);
	private searchString$$ = new BehaviorSubject<string>(null);

	constructor(protected override readonly cdr: ChangeDetectorRef, private readonly i18n: ILocalizationService) {
		super(cdr);
	}

	trackByFn(index: number, stat: BgsMetaQuestStatTier) {
		return stat.id;
	}

	ngAfterContentInit() {
		this.tiers$ = combineLatest([this.stats$$, this.searchString$$]).pipe(
			filter(([stats, searchString]) => !!stats),
			this.mapData(([stats, searchString]) => {
				const result = buildQuestTiers(stats, searchString, this.i18n);
				return result;
			}),
		);
		this.collapsedQuests$ = this.collapsedQuests$$.asObservable();
		const numberOfQuests$ = this.tiers$.pipe(
			this.mapData((tiers) => tiers.map((tier) => tier.items.length).reduce((a, b) => a + b, 0)),
		);
		this.showCollapseButton$ = combineLatest([this.collapsedQuests$$, numberOfQuests$]).pipe(
			this.mapData(([collapsedQuests, numberOfQuests]) => {
				return collapsedQuests.length < numberOfQuests;
			}),
		);
		this.totalGames$ = this.tiers$.pipe(
			filter((stats) => !!stats),
			this.mapData(
				(stats) =>
					stats
						?.flatMap((s) => s.items)
						?.map((i) => i.dataPoints)
						?.reduce((a, b) => a + b, 0)
						.toLocaleString(this.i18n.formatCurrentLocale() ?? 'enUS') ?? '-',
			),
		);
		this.lastUpdate$ = this.lastUpdate$$.pipe(
			filter((date) => !!date),
			this.mapData((dateStr) => {
				// Show the date as a relative date, unless it's more than 1 week old
				// E.g. "2 hours ago", "3 days ago", "1 week ago", "on 12/12/2020"
				const date = new Date(dateStr);
				const now = new Date();
				const diff = now.getTime() - date.getTime();
				const days = diff / (1000 * 3600 * 24);
				if (days < 7) {
					return getDateAgo(date, this.i18n);
				}
				return date.toLocaleDateString(this.i18n.formatCurrentLocale() ?? 'enUS');
			}),
		);
		this.lastUpdateFull$ = this.lastUpdate$$.pipe(
			filter((date) => !!date),
			this.mapData((dateStr) => {
				const date = new Date(dateStr);
				return date.toLocaleDateString(this.i18n.formatCurrentLocale() ?? 'enUS', {
					year: 'numeric',
					month: 'numeric',
					day: 'numeric',
					hour: 'numeric',
					minute: 'numeric',
					second: 'numeric',
				});
			}),
		);
	}

	onSearchStringUpdated(value: string) {
		this.searchString$$.next(value);
	}

	onStatClicked(item: BgsMetaQuestStatTierItem) {
		this.statClick.next(item);
	}

	onCollapseAll() {
		this.collapseAll.next();
	}

	onExpandAll() {
		this.expandAll.next();
	}

	onGroupDifficulty() {
		this.groupDifficulty.next();
	}

	onUngroupDifficulty() {
		console.debug('ungrouping difficulty');
		this.ungroupDifficulty.next();
	}
}
