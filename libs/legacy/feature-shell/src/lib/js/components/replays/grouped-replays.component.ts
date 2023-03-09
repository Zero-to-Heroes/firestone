import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { GameStat } from '@firestone/stats/data-access';
import { GroupedReplays } from '../../models/mainwindow/replays/grouped-replays';

@Component({
	selector: 'grouped-replays',
	styleUrls: [`../../../css/global/menu.scss`, `../../../css/component/replays/grouped-replays.component.scss`],
	template: `
		<div class="grouped-replays">
			<div class="header">{{ header }}</div>
			<ul class="replays">
				<li *ngFor="let replay of _replays">
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
}
