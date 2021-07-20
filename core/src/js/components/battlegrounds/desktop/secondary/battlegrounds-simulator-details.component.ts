import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter } from '@angular/core';
import { CardIds, Race, ReferenceCard } from '@firestone-hs/reference-data';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { BoardEntity } from '@firestone-hs/simulate-bgs-battle/dist/board-entity';
import { Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, tap } from 'rxjs/operators';
import { BgsCustomSimulationPicker } from '../../../../models/mainwindow/battlegrounds/simulator/bgs-custom-simulation-state';
import { AppUiStoreService, cdLog } from '../../../../services/app-ui-store.service';
import { getAllCardsInGame, getEffectiveTribe, tribeValueForSort } from '../../../../services/battlegrounds/bgs-utils';
import { BgsCustomSimulationCloseSidePanelEvent } from '../../../../services/mainwindow/store/events/battlegrounds/simulator/bgs-custom-simulation-close-side-panel-event';
import { BgsCustomSimulationMinionChosenEvent } from '../../../../services/mainwindow/store/events/battlegrounds/simulator/bgs-custom-simulation-minion-chosen-event';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../../services/overwolf.service';
import { groupByFunction } from '../../../../services/utils';
import { BgsMinionsGroup } from '../../minions-tiers/bgs-minions-group';

@Component({
	selector: 'battlegrounds-simulator-details',
	styleUrls: [
		`../../../../../css/global/components-global.scss`,
		`../../../../../css/component/controls/controls.scss`,
		`../../../../../css/component/controls/control-close.component.scss`,
		`../../../../../css/component/battlegrounds/desktop/secondary/battlegrounds-simulator-details.component.scss`,
	],
	template: `
		<div class="battlegrounds-simulator-details">
			<ng-container *ngIf="picker$ | async as picker">
				<button class="close" (click)="dismiss()" *ngIf="picker.type">
					<svg class="svg-icon-fill">
						<use
							xmlns:xlink="https://www.w3.org/1999/xlink"
							xlink:href="assets/svg/sprite.svg#window-control_close"
						></use>
					</svg>
				</button>
				<div class="title" *ngIf="buildTitle(picker) as title">{{ title }}</div>
				<div class="minion-selection" *ngIf="picker.type === 'minion'" scrollable>
					<bgs-minions-group
						class="minion-group"
						*ngFor="let group of groups"
						[group]="group"
						[tooltipPosition]="'left'"
						[showTribesHighlight]="false"
						(minionClick)="onMinionClick($event, picker.side, picker.minionIndex)"
					></bgs-minions-group>
				</div>
				<div class="minion-update" *ngIf="picker.type === 'minion-update'">
					<battlegrounds-simulator-details-entity-update
						[entity]="entityToUpdate$ | async"
						[picker]="picker"
					></battlegrounds-simulator-details-entity-update></div
			></ng-container>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsSimulatorDetailsComponent implements AfterViewInit {
	groups: readonly BgsMinionsGroup[];

	picker$: Observable<BgsCustomSimulationPicker>;
	entityToUpdate$: Observable<BoardEntity>;

	private cardsInGame: readonly ReferenceCard[];
	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly ow: OverwolfService,
		private readonly allCards: AllCardsService,
		private readonly store: AppUiStoreService,
	) {
		// For now we consider all tribes
		this.cardsInGame = [
			...getAllCardsInGame([], this.allCards),
			this.allCards.getCard(CardIds.NonCollectible.Neutral.AvatarOfNzoth_FishOfNzothTokenBattlegrounds),
			this.allCards.getCard(CardIds.NonCollectible.Neutral.Menagerist_AmalgamTokenBattlegrounds),
		];
		// TODO: this can be moved elsewhere once we have a search / filter option
		const groupedByTribe = groupByFunction((card: ReferenceCard) => getEffectiveTribe(card))(this.cardsInGame);
		this.groups = Object.keys(groupedByTribe)
			.sort((a: string, b: string) => tribeValueForSort(a) - tribeValueForSort(b)) // Keep consistent ordering
			.map((tribeString) => ({
				tribe: Race[tribeString],
				minions: groupedByTribe[tribeString],
				highlightedMinions: [],
				highlightedTribes: [],
			}));
		console.debug('groups', this.groups, this.cardsInGame, groupedByTribe);

		this.picker$ = this.store
			.listen$(([main, nav]) => main.battlegrounds.customSimulationState.picker)
			.pipe(
				map(([picker]) => picker),
				distinctUntilChanged(),
				tap((info) => cdLog('emitting picker in ', this.constructor.name, info)),
			);
		this.entityToUpdate$ = this.store
			.listen$(([main, nav]) => main.battlegrounds.customSimulationState)
			.pipe(
				filter(([state]) => !!state?.picker),
				map(([state]) => {
					return state.picker.type === 'minion-update'
						? state.findEntity(state.picker.side, state.picker.minionIndex)
						: null;
				}),
				filter((entity) => !!entity),
				distinctUntilChanged(),
				tap((info) => cdLog('emitting entity in ', this.constructor.name, info)),
			);
	}

	async ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	onMinionClick(cardId: string, side: 'player' | 'opponent', minionIndex: number) {
		this.stateUpdater.next(new BgsCustomSimulationMinionChosenEvent(cardId, side, minionIndex));
	}

	dismiss() {
		console.debug('dismissing');
		this.stateUpdater.next(new BgsCustomSimulationCloseSidePanelEvent());
	}

	buildTitle(picker: BgsCustomSimulationPicker) {
		switch (picker?.type) {
			case 'minion':
				return `Choose a minion for position ${picker.minionIndex + 1}`;
			case 'minion-update':
				return `Update minion at position ${picker.minionIndex + 1}`;
			case 'hero':
				return 'Choose a hero';
			default:
				return null;
		}
	}
}
