import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { GameStat } from '@firestone/stats/data-access';
import { GroupedReplays } from '@firestone/mainwindow/common';

@Component({
	standalone: false,
	selector: 'grouped-replays',
	styleUrls: [`../../../css/global/menu.scss`, `../../../css/component/replays/grouped-replays.component.scss`],
	template: `
		<div class="grouped-replays">
			<div class="header">{{ header }}</div>
			<ul class="replays">
				<li *ngFor="let replay of _replays; trackBy: trackByReplay">
					<replay-info [replay]="replay"></replay-info>
				</li>
			</ul>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupedReplaysComponent {
	@Input() set groupedReplays(value: GroupedReplays) {
		this.header = value.header;
		this._replays = value.replays;
	}

	header: string;
	_replays: readonly GameStat[];

	trackByReplay(index: number, replay: GameStat) {
		return replay.reviewId ?? index;
	}
}
