import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { CardIds, Race, ReferenceCard } from '@firestone-hs/reference-data';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { BoardEntity } from '@firestone-hs/simulate-bgs-battle/dist/board-entity';
import { CardTooltipPositionType } from '../../../../directives/card-tooltip-position.type';
import {
	BgsCustomSimulationPicker,
	BgsCustomSimulationState,
} from '../../../../models/mainwindow/battlegrounds/simulator/bgs-custom-simulation-state';
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
			<button class="close" (click)="dismiss()" *ngIf="this.picker?.type">
				<svg class="svg-icon-fill">
					<use
						xmlns:xlink="https://www.w3.org/1999/xlink"
						xlink:href="assets/svg/sprite.svg#window-control_close"
					></use>
				</svg>
			</button>
			<div class="title" *ngIf="title">{{ title }}</div>
			<div class="minion-selection" *ngIf="this.picker?.type === 'minion'" scrollable>
				<bgs-minions-group
					class="minion-group"
					*ngFor="let group of groups"
					[group]="group"
					[tooltipPosition]="tooltipPosition"
					[showTribesHighlight]="false"
					(minionClick)="onMinionClick($event)"
				></bgs-minions-group>
			</div>
			<div class="minion-update" *ngIf="this.picker?.type === 'minion-update'">
				<battlegrounds-simulator-details-entity-update
					[entity]="entityToUpdate"
					[picker]="picker"
				></battlegrounds-simulator-details-entity-update>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsSimulatorDetailsComponent implements AfterViewInit {
	@Input() set state(value: BgsCustomSimulationState) {
		console.debug('state', value);
		if (value === this._state) {
			return;
		}
		this._state = value;
		this.updateValues();
	}

	tooltipPosition: CardTooltipPositionType = 'left';
	groups: readonly BgsMinionsGroup[];
	title = 'Here be the picker';
	picker: BgsCustomSimulationPicker;
	entityToUpdate: BoardEntity;

	private _state: BgsCustomSimulationState;
	private cardsInGame: readonly ReferenceCard[];
	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private readonly ow: OverwolfService, private readonly allCards: AllCardsService) {}

	async ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
		await this.allCards.initializeCardsDb();
		if (!this.cardsInGame?.length) {
			this.updateAvailableCards();
		}

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
	}

	onMinionClick(cardId: string) {
		console.debug('clicked', cardId);
		this.stateUpdater.next(
			new BgsCustomSimulationMinionChosenEvent(cardId, this.picker.side, this.picker.minionIndex),
		);
	}

	dismiss() {
		this.stateUpdater.next(new BgsCustomSimulationCloseSidePanelEvent());
	}

	private async updateValues() {
		this.picker = this._state?.picker;
		this.title = this.buildTitle(this.picker);
		this.entityToUpdate =
			this.picker?.type === 'minion-update'
				? this._state.findEntity(this.picker.side, this.picker.minionIndex)
				: null;
	}

	private buildTitle(picker: BgsCustomSimulationPicker) {
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

	private updateAvailableCards() {
		if (!this.allCards.getCards()?.length) {
			return;
		}

		// For now we consider all tribes
		this.cardsInGame = [
			...getAllCardsInGame([], this.allCards),
			this.allCards.getCard(CardIds.NonCollectible.Neutral.AvatarOfNzoth_FishOfNzothTokenBattlegrounds),
			this.allCards.getCard(CardIds.NonCollectible.Neutral.Menagerist_AmalgamTokenBattlegrounds),
		];
	}
}
