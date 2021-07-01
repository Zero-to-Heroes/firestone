import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	ViewRef,
} from '@angular/core';
import { GameTag, ReferenceCard } from '@firestone-hs/reference-data';
import { AllCardsService, Entity, EntityAsJS } from '@firestone-hs/replay-parser';
import { BoardEntity } from '@firestone-hs/simulate-bgs-battle/dist/board-entity';
import { BgsCustomSimulationPicker } from '../../../../models/mainwindow/battlegrounds/simulator/bgs-custom-simulation-state';
import { BgsCustomSimulationUpdateMinionEvent } from '../../../../services/mainwindow/store/events/battlegrounds/simulator/bgs-custom-simulation-update-minion-event';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../../services/overwolf.service';

@Component({
	selector: 'battlegrounds-simulator-details-entity-update',
	styleUrls: [
		`../../../../../css/global/components-global.scss`,
		`../../../../../css/component/battlegrounds/desktop/secondary/battlegrounds-simulator-details-entity-update.component.scss`,
	],
	template: `
		<div class="battlegrounds-simulator-details-entity-update">
			<div class="info">
				<div class="card-view-container">
					<bgs-card-tooltip [config]="card" [visible]="true"></bgs-card-tooltip>
				</div>
				<div class="info-container">
					<checkbox
						[label]="'Premium'"
						[value]="premium"
						(valueChanged)="onPremiumChanged($event)"
					></checkbox>
					<checkbox
						[label]="'Divine Shield'"
						[value]="divineShield"
						(valueChanged)="onDivineShieldChanged($event)"
					></checkbox>
					<checkbox
						[label]="'Poisonous'"
						[value]="poisonous"
						(valueChanged)="onPoisonousChanged($event)"
					></checkbox>
					<checkbox [label]="'Reborn'" [value]="reborn" (valueChanged)="onRebornChanged($event)"></checkbox>
					<checkbox [label]="'Taunt'" [value]="taunt" (valueChanged)="onTauntChanged($event)"></checkbox>
					<div class="stats">
						<div class="input attack">
							<div class="label">Attack</div>
							<input
								[ngModel]="attack"
								(ngModelChange)="onAttackChanged($event)"
								(mousedown)="preventDrag($event)"
							/>
						</div>
						<div class="input health">
							<div class="label">Health</div>
							<input
								[ngModel]="health"
								(ngModelChange)="onHealthChanged($event)"
								(mousedown)="preventDrag($event)"
							/>
						</div>
					</div>
				</div>
			</div>
			<div class="controls">
				<div class="button simulate" (click)="validate()">Ok</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsSimulatorDetailsEntityUpdateComponent implements AfterViewInit {
	@Input() set entity(value: BoardEntity) {
		if (value === this._entity) {
			return;
		}
		this._entity = value;
		this.updateValues();
	}

	@Input() set picker(value: BgsCustomSimulationPicker) {
		if (value === this._picker) {
			return;
		}
		this._picker = value;
		this.updateValues();
	}

	cardId: string;
	premium: boolean;
	divineShield: boolean;
	poisonous: boolean;
	reborn: boolean;
	taunt: boolean;
	attack: number;
	health: number;
	card: Entity;

	private ref: ReferenceCard;
	private _entity: BoardEntity;
	private _picker: BgsCustomSimulationPicker;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly ow: OverwolfService,
		private readonly allCards: AllCardsService,
		private readonly cdr: ChangeDetectorRef,
	) {}

	async ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	onPremiumChanged(value: boolean) {
		this.premium = value;
		if (value) {
			this.cardId = this.ref.battlegroundsNormalDbfId
				? this.ref.id
				: this.allCards.getCardFromDbfId(this.ref.battlegroundsPremiumDbfId).id;
		} else {
			this.cardId = this.ref.battlegroundsNormalDbfId
				? this.allCards.getCardFromDbfId(this.ref.battlegroundsNormalDbfId).id
				: this.cardId;
		}
		this.ref = this.allCards.getCard(this.cardId);
		this.attack = this.ref.attack;
		this.health = this.ref.health;
		this.divineShield = this.ref.mechanics?.includes(GameTag[GameTag.DIVINE_SHIELD]);
		this.poisonous = this.ref.mechanics?.includes(GameTag[GameTag.POISONOUS]);
		this.taunt = this.ref.mechanics?.includes(GameTag[GameTag.TAUNT]);
		this.updateCard();
	}

	onDivineShieldChanged(value: boolean) {
		this.divineShield = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	onPoisonousChanged(value: boolean) {
		this.poisonous = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	onRebornChanged(value: boolean) {
		this.reborn = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	onTauntChanged(value: boolean) {
		this.taunt = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	onAttackChanged(value: number) {
		this.attack = value;
		this.updateCard();
	}

	onHealthChanged(value: number) {
		this.health = value;
		this.updateCard();
	}

	validate() {
		this.stateUpdater.next(
			new BgsCustomSimulationUpdateMinionEvent(this._picker.side, this._picker.minionIndex, {
				cardId: this.cardId,
				attack: this.attack,
				health: this.health,
				divineShield: this.divineShield,
				poisonous: this.poisonous,
				taunt: this.taunt,
				reborn: this.reborn,
			} as BoardEntity),
		);
	}

	preventDrag(event: MouseEvent) {
		event.stopPropagation();
	}

	private async updateValues() {
		if (!this._entity || !this._picker) {
			return;
		}

		this.cardId = this._entity.cardId;
		this.ref = this.allCards.getCard(this.cardId);
		this.premium = this.ref.battlegroundsNormalDbfId > 0;
		this.attack = this.ref.attack;
		this.health = this.ref.health;
		this.divineShield = this._entity.divineShield;
		this.poisonous = this._entity.poisonous;
		this.taunt = this._entity.taunt;
		this.updateCard();
	}

	private updateCard() {
		this.card = Entity.fromJS({
			cardID: this.cardId,
			tags: {
				[GameTag[GameTag.ATK]]: this.attack,
				[GameTag[GameTag.HEALTH]]: this.health,
				[GameTag[GameTag.PREMIUM]]: this.premium ? 1 : 0,
			},
		} as EntityAsJS);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
