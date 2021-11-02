import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { BgsPanelId } from '../../models/battlegrounds/bgs-panel-id.type';
import { BgsStageChangeEvent } from '../../services/battlegrounds/store/events/bgs-stage-change-event';
import { BattlegroundsStoreEvent } from '../../services/battlegrounds/store/events/_battlegrounds-store-event';
import { OverwolfService } from '../../services/overwolf.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../abstract-subscription.component';

@Component({
	selector: 'menu-selection-bgs',
	styleUrls: [
		`../../../css/global/menu.scss`,
		`../../../css/component/battlegrounds/menu-selection-bgs.component.scss`,
	],
	template: `
		<ul class="menu-selection" *ngIf="selectedPanel$ | async as selectedPanel">
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
				<span>{{ !(matchOver$ | async) ? 'Live stats' : 'Post-Match Stats' }}</span>
			</li>
			<li [ngClass]="{ 'selected': selectedPanel === 'bgs-battles' }" (mousedown)="selectStage('bgs-battles')">
				<span>Simulator</span>
			</li>
		</ul>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuSelectionBgsComponent extends AbstractSubscriptionComponent implements AfterViewInit {
	selectedPanel$: Observable<BgsPanelId>;
	matchOver$: Observable<boolean>;

	// @Input() selectedPanel: BgsPanelId;
	// @Input() matchOver: boolean;

	private battlegroundsUpdater: EventEmitter<BattlegroundsStoreEvent>;

	constructor(private ow: OverwolfService, private readonly store: AppUiStoreFacadeService) {
		super();
		this.selectedPanel$ = this.store
			.listenBattlegrounds$(([state]) => state.currentPanelId)
			.pipe(
				map(([panelId]) => panelId as BgsPanelId),
				takeUntil(this.destroyed$),
			);
		this.matchOver$ = this.store
			.listenBattlegrounds$(([state]) => state.currentGame?.gameEnded)
			.pipe(
				map(([gameEnded]) => gameEnded),
				takeUntil(this.destroyed$),
			);
	}

	async ngAfterViewInit() {
		this.battlegroundsUpdater = (await this.ow.getMainWindow()).battlegroundsUpdater;
	}

	selectStage(panelId: BgsPanelId) {
		this.battlegroundsUpdater.next(new BgsStageChangeEvent(panelId));
	}
}
