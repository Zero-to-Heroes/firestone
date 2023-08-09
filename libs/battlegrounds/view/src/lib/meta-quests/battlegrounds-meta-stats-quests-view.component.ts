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
			*ngIf="{ tiers: tiers$ | async } as value"
		>
			<div class="header">
				<div class="image"></div>
				<div class="quest-details" [fsTranslate]="'app.battlegrounds.tier-list.header-quest-details'"></div>
				<div
					class="turns-to-complete"
					[fsTranslate]="'app.battlegrounds.tier-list.header-average-turns-to-complete'"
				></div>
			</div>
			<div class="quests-list" role="list" scrollable>
				<battlegrounds-meta-stats-quest-tier
					*ngFor="let tier of value.tiers; trackBy: trackByFn"
					role="listitem"
					[tier]="tier"
					[collapsedQuests]="collapsedQuests"
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
	@Output() statClicked = new EventEmitter<BgsMetaQuestStatTierItem>();

	tiers$: Observable<readonly BgsMetaQuestStatTier[]>;

	@Input() set stats(value: readonly BgsMetaQuestStatTierItem[]) {
		this.stats$$.next(value);
	}

	@Input() collapsedQuests: readonly string[];

	private stats$$ = new BehaviorSubject<readonly BgsMetaQuestStatTierItem[]>(null);

	constructor(protected override readonly cdr: ChangeDetectorRef, private readonly i18n: ILocalizationService) {
		super(cdr);
	}

	trackByFn(index: number, stat: BgsMetaQuestStatTier) {
		return stat.label;
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
	}

	onStatClicked(item: BgsMetaQuestStatTierItem) {
		this.statClicked.next(item);
	}
}
