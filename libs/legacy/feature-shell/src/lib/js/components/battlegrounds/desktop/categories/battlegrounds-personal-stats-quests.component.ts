import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { BgsQuestStat } from '@firestone/game-state';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { Observable } from 'rxjs';

// UNUSED
@Component({
	standalone: false,
	selector: 'battlegrounds-personal-stats-quests',
	styleUrls: [
		`../../../../../css/component/battlegrounds/desktop/categories/battlegrounds-personal-stats-heroes.component.scss`,
	],
	template: `
		<section
			class="battlegrounds-personal-stats-heroes"
			[attr.aria-label]="'Battlegrounds quest stats'"
			role="list"
		>
			<battlegrounds-stats-quest-vignette
				*ngFor="let stat of stats$ | async; trackBy: trackByFn"
				role="listitem"
				[stat]="stat"
			></battlegrounds-stats-quest-vignette>
		</section>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsPersonalStatsQuestsComponent extends AbstractSubscriptionComponent {
	stats$: Observable<readonly BgsQuestStat[]>;

	constructor(protected readonly cdr: ChangeDetectorRef) {
		super(cdr);
	}

	trackByFn(index: number, stat: BgsQuestStat) {
		return stat.id;
	}
}
