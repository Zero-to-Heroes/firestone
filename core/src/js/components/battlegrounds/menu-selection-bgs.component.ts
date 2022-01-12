import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter
} from '@angular/core';
import { Observable } from 'rxjs';
import { distinctUntilChanged, map, takeUntil, tap } from 'rxjs/operators';
import { BgsPanelId } from '../../models/battlegrounds/bgs-panel-id.type';
import { BgsStageChangeEvent } from '../../services/battlegrounds/store/events/bgs-stage-change-event';
import { BattlegroundsStoreEvent } from '../../services/battlegrounds/store/events/_battlegrounds-store-event';
import { OverwolfService } from '../../services/overwolf.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { cdLog } from '../../services/ui-store/app-ui-store.service';
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
				<span [owTranslate]="'battlegrounds.menu.hero'"></span>
			</li>
			<li
				[ngClass]="{ 'selected': selectedPanel === 'bgs-next-opponent-overview' }"
				(mousedown)="selectStage('bgs-next-opponent-overview')"
			>
				<span [owTranslate]="'battlegrounds.menu.opponent'"></span>
			</li>
			<li
				[ngClass]="{ 'selected': selectedPanel === 'bgs-post-match-stats' }"
				(mousedown)="selectStage('bgs-post-match-stats')"
			>
				<span>{{
					!(matchOver$ | async)
						? ('battlegrounds.menu.live-stats' | owTranslate)
						: ('battlegrounds.menu.post-match-stats' | owTranslate)
				}}</span>
			</li>
			<li [ngClass]="{ 'selected': selectedPanel === 'bgs-battles' }" (mousedown)="selectStage('bgs-battles')">
				<span [owTranslate]="'battlegrounds.menu.simulator'"></span>
			</li>
		</ul>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuSelectionBgsComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit, AfterViewInit {
	selectedPanel$: Observable<BgsPanelId>;
	matchOver$: Observable<boolean>;

	private battlegroundsUpdater: EventEmitter<BattlegroundsStoreEvent>;

	constructor(
		private ow: OverwolfService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.selectedPanel$ = this.store
			.listenBattlegrounds$(([state]) => state.currentPanelId)
			.pipe(
				map(([panelId]) => panelId as BgsPanelId),
				distinctUntilChanged(),
				tap((info) => cdLog('emitting selectedPanel in ', this.constructor.name, info)),
				takeUntil(this.destroyed$),
			);
		this.matchOver$ = this.store
			.listenBattlegrounds$(([state]) => state.currentGame?.gameEnded)
			.pipe(
				map(([gameEnded]) => gameEnded),
				distinctUntilChanged(),
				tap((info) => cdLog('emitting matchOver in ', this.constructor.name, info)),
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
