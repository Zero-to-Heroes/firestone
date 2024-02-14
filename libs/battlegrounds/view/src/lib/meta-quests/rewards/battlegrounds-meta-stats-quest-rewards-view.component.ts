/* eslint-disable @angular-eslint/template/no-negated-async */
import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import {
	BgsMetaQuestRewardStatTier,
	BgsMetaQuestRewardStatTierItem,
	buildQuestRewardTiers,
} from '@firestone/battlegrounds/data-access';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { ILocalizationService, getDateAgo } from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable, combineLatest, filter } from 'rxjs';

@Component({
	selector: 'battlegrounds-meta-stats-quest-rewards-view',
	styleUrls: [
		`./battlegrounds-meta-stats-quest-rewards-columns.scss`,
		`./battlegrounds-meta-stats-quest-rewards-view.component.scss`,
	],
	template: `
		<section
			class="battlegrounds-meta-stats-quests"
			[attr.aria-label]="'Battlegrounds meta quest rewards stats'"
			*ngIf="{
				tiers: tiers$ | async
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
				<div
					class="quest-details"
					[fsTranslate]="'app.battlegrounds.tier-list.header-quest-reward-details'"
				></div>
				<div class="position" [fsTranslate]="'app.battlegrounds.tier-list.header-average-position'"></div>

				<div class="button-groups">
					<fs-text-input
						class="search"
						[value]="searchString"
						[placeholder]="'app.battlegrounds.tier-list.reward-search-placeholder' | fsTranslate"
						[debounceTime]="100"
						(fsModelUpdate)="onSearchStringUpdated($event)"
					>
					</fs-text-input>
				</div>
			</div>
			<div class="quests-list" role="list" scrollable>
				<battlegrounds-meta-stats-quest-reward-tier
					*ngFor="let tier of value.tiers; trackBy: trackByFn"
					role="listitem"
					[tier]="tier"
				></battlegrounds-meta-stats-quest-reward-tier>
			</div>
		</section>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsMetaStatsQuestRewardsViewComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit
{
	tiers$: Observable<readonly BgsMetaQuestRewardStatTier[]>;
	lastUpdate$: Observable<string | null>;
	lastUpdateFull$: Observable<string | null>;
	totalGames$: Observable<string>;

	@Input() set stats(value: readonly BgsMetaQuestRewardStatTierItem[]) {
		this.stats$$.next(value);
	}
	@Input() set lastUpdate(value: string) {
		this.lastUpdate$$.next(value);
	}
	@Input() searchString: string;

	private stats$$ = new BehaviorSubject<readonly BgsMetaQuestRewardStatTierItem[]>(null);
	private lastUpdate$$ = new BehaviorSubject<string | null>(null);
	private searchString$$ = new BehaviorSubject<string>(null);

	constructor(protected override readonly cdr: ChangeDetectorRef, private readonly i18n: ILocalizationService) {
		super(cdr);
	}

	trackByFn(index: number, stat: BgsMetaQuestRewardStatTier) {
		return stat.id;
	}

	ngAfterContentInit() {
		this.tiers$ = combineLatest([this.stats$$, this.searchString$$]).pipe(
			filter(([stats, searchString]) => !!stats),
			this.mapData(([stats, searchString]) => {
				const result = buildQuestRewardTiers(stats, searchString, this.i18n);
				return result;
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
}
