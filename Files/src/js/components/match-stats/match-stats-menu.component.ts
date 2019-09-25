import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatchStatsCurrentStat } from '../../models/mainwindow/stats/current-stat.type';

@Component({
	selector: 'match-stats-menu',
	styleUrls: [
		`../../../css/global/components-global.scss`,
		`../../../css/component/settings/decktracker/settings-decktracker-menu.component.scss`,
	],
	template: `
		<ul class="match-stats-menu">
			<li [ngClass]="{ 'selected': selectedMenu === 'replay' }" (mousedown)="selectMenu('replay')">
				<span>Replay</span>
			</li>
		</ul>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchStatsMenuComponent {
	@Input() selectedMenu: MatchStatsCurrentStat;

	selectMenu(menu: MatchStatsCurrentStat) {}
}
