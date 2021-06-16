import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
} from '@angular/core';
import { BgsPanelId } from '../../models/battlegrounds/bgs-panel-id.type';
import { BgsStageChangeEvent } from '../../services/battlegrounds/store/events/bgs-stage-change-event';
import { BattlegroundsStoreEvent } from '../../services/battlegrounds/store/events/_battlegrounds-store-event';
import { FeatureFlags } from '../../services/feature-flags';
import { OverwolfService } from '../../services/overwolf.service';

@Component({
	selector: 'menu-selection-bgs',
	styleUrls: [
		`../../../css/global/menu.scss`,
		`../../../css/component/battlegrounds/menu-selection-bgs.component.scss`,
	],
	template: `
		<ul class="menu-selection">
			<li
				[ngClass]="{ 'selected': selectedPanel === 'bgs-hero-selection-overview' }"
				(mousedown)="selectStage('bgs-hero-selection-overview')"
			>
				<span>Hero Selection</span>
			</li>
			<li
				[ngClass]="{ 'selected': selectedPanel === 'bgs-next-opponent-overview' }"
				(mousedown)="selectStage('bgs-next-opponent-overview')"
			>
				<span>Opponent</span>
			</li>
			<li
				[ngClass]="{ 'selected': selectedPanel === 'bgs-post-match-stats' }"
				(mousedown)="selectStage('bgs-post-match-stats')"
			>
				<span>{{ enableLiveStats && !matchOver ? 'Live stats' : 'Post-Match Stats' }}</span>
			</li>
			<li [ngClass]="{ 'selected': selectedPanel === 'bgs-battles' }" (mousedown)="selectStage('bgs-battles')">
				<span>Battles</span>
			</li>
		</ul>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuSelectionBgsComponent implements AfterViewInit {
	enableLiveStats = FeatureFlags.ENABLE_REAL_TIME_STATS;

	@Input() selectedPanel: BgsPanelId;
	@Input() matchOver: boolean;

	private battlegroundsUpdater: EventEmitter<BattlegroundsStoreEvent>;

	constructor(private ow: OverwolfService, private cdr: ChangeDetectorRef) {}

	async ngAfterViewInit() {
		this.battlegroundsUpdater = (await this.ow.getMainWindow()).battlegroundsUpdater;
	}

	selectStage(panelId: BgsPanelId) {
		this.battlegroundsUpdater.next(new BgsStageChangeEvent(panelId));
	}
}
