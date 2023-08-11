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
import { ILocalizationService } from '@firestone/shared/framework/core';
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

	@Input() set stats(value: readonly BgsMetaQuestStatTierItem[]) {
		this.stats$$.next(value);
	}

	@Input() set collapsedQuests(value: readonly string[]) {
		this.collapsedQuests$$.next(value);
	}

	@Input() groupedByDifficulty: boolean;

	private stats$$ = new BehaviorSubject<readonly BgsMetaQuestStatTierItem[]>(null);
	private collapsedQuests$$ = new BehaviorSubject<readonly string[]>([]);

	constructor(protected override readonly cdr: ChangeDetectorRef, private readonly i18n: ILocalizationService) {
		super(cdr);
	}

	trackByFn(index: number, stat: BgsMetaQuestStatTier) {
		return stat.id;
	}

	ngAfterContentInit() {
		this.tiers$ = combineLatest([this.stats$$]).pipe(
			filter(([stats]) => !!stats),
			this.mapData(([stats]) => {
				const result = buildQuestTiers(stats, this.i18n);
				console.debug('built tiers', result);
				return result;
			}),
		);
		this.collapsedQuests$ = this.collapsedQuests$$.asObservable();
		const numberOfQuests$ = this.tiers$.pipe(
			this.mapData((tiers) => tiers.map((tier) => tier.items.length).reduce((a, b) => a + b, 0)),
		);
		this.showCollapseButton$ = combineLatest([this.collapsedQuests$$, numberOfQuests$]).pipe(
			this.mapData(([collapsedQuests, numberOfQuests]) => {
				console.debug('show collapse button', collapsedQuests, numberOfQuests);
				return collapsedQuests.length < numberOfQuests;
			}),
		);
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
