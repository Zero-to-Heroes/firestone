import { Overlay, OverlayPositionBuilder, OverlayRef, PositionStrategy } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	Output,
	ViewRef,
} from '@angular/core';
import { GameTag } from '@firestone-hs/reference-data';
import { Entity } from '@firestone-hs/replay-parser';
import { BgsBattleInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-battle-info';
import { BgsBoardInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-board-info';
import { BgsPlayerEntity } from '@firestone-hs/simulate-bgs-battle/dist/bgs-player-entity';
import { BoardEntity } from '@firestone-hs/simulate-bgs-battle/dist/board-entity';
import { BgsFaceOffWithSimulation } from '../../../models/battlegrounds/bgs-face-off-with-simulation';
import { BgsBattleSimulationService } from '../../../services/battlegrounds/bgs-battle-simulation.service';
import { getHeroPower } from '../../../services/battlegrounds/bgs-utils';
import { OverwolfService } from '../../../services/overwolf.service';
import { PreferencesService } from '../../../services/preferences.service';
import { ChangeMinionRequest } from './bgs-battle-side.component';
import { BgsSimulatorHeroPowerSelectionComponent } from './bgs-simulator-hero-power-selection.component';
import { BgsSimulatorHeroSelectionComponent } from './bgs-simulator-hero-selection.component';

declare let amplitude;
@Component({
	selector: 'bgs-battle',
	styleUrls: [
		`../../../../css/global/reset-styles.scss`,
		`../../../../css/global/scrollbar.scss`,
		`../../../../css/component/battlegrounds/battles/bgs-battle.component.scss`,
	],
	template: `
		<div class="bgs-battle" [ngClass]="{ 'full-screen-mode': fullScreenMode }">
			<div class="turn-label" *ngIf="turnNumber">
				<div class="turn">Turn {{ turnNumber }}</div>
				<div class="result {{ actualResult }}" *ngIf="actualResult">{{ actualResult }}</div>
			</div>
			<div class="battle-content">
				<div class="battle-boards">
					<bgs-battle-side
						class="opponent"
						[player]="opponent"
						[showTavernTier]="showTavernTier"
						[clickToChange]="clickToChange"
						[allowClickToAdd]="allowClickToAdd"
						[closeOnMinion]="closeOnMinion"
						[fullScreenMode]="fullScreenMode"
						[tooltipPosition]="'right'"
						(entitiesUpdated)="onOpponentEntitiesUpdated($event)"
						(portraitChangeRequested)="onPortraitChangeRequested('opponent')"
						(heroPowerChangeRequested)="onHeroPowerChangeRequested('opponent')"
						(changeMinionRequested)="onOpponentMinionChangeRequested($event)"
						(updateMinionRequested)="onOpponentMinionUpdateRequested($event)"
						(removeMinionRequested)="onOpponentMinionRemoveRequested($event)"
					></bgs-battle-side>
					<div class="versus" *ngIf="!fullScreenMode">Vs.</div>
					<div class="simulations" *ngIf="fullScreenMode">
						<div class="controls">
							<div
								class="button simulate"
								(click)="simulateNewBattle()"
								[helpTooltip]="tooltip"
								[ngClass]="{ 'disabled': !isPremium }"
							>
								{{ isPremium ? 'Simulate' : 'Subscribe' }}
							</div>
						</div>
						<div class="result new">
							<bgs-battle-status [showReplayLink]="true" [nextBattle]="newBattle"></bgs-battle-status>
						</div>
					</div>
					<bgs-battle-side
						class="player"
						[player]="player"
						[showTavernTier]="showTavernTier"
						[clickToChange]="clickToChange"
						[allowClickToAdd]="allowClickToAdd"
						[closeOnMinion]="closeOnMinion"
						[fullScreenMode]="fullScreenMode"
						[tooltipPosition]="'top-right'"
						(entitiesUpdated)="onPlayerEntitiesUpdated($event)"
						(portraitChangeRequested)="onPortraitChangeRequested('player')"
						(heroPowerChangeRequested)="onHeroPowerChangeRequested('player')"
						(changeMinionRequested)="onPlayerMinionChangeRequested($event)"
						(updateMinionRequested)="onPlayerMinionUpdateRequested($event)"
						(removeMinionRequested)="onPlayerMinionRemoveRequested($event)"
					></bgs-battle-side>
				</div>
				<div class="simulations" *ngIf="!fullScreenMode">
					<div class="result actual" *ngIf="!hideActualBattle">
						<div class="label">Actual</div>
						<bgs-battle-status [showReplayLink]="true" [nextBattle]="actualBattle"></bgs-battle-status>
					</div>
					<div class="result new">
						<div class="label">New</div>
						<bgs-battle-status [showReplayLink]="true" [nextBattle]="newBattle"></bgs-battle-status>
					</div>
					<div class="controls">
						<div class="button reset" (click)="resetBoards()">Reset boards</div>
						<div
							class="button simulate"
							(click)="simulateNewBattle()"
							[helpTooltip]="tooltip"
							[ngClass]="{ 'disabled': !isPremium }"
						>
							{{ isPremium ? 'Simulate' : 'Subscribe' }}
						</div>
					</div>
				</div>
				<div class="button reset" *ngIf="fullScreenMode" (click)="resetBoards()">
					<div class="icon" inlineSVG="assets/svg/restore.svg"></div>
					<div class="text">Reset</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsBattleComponent implements AfterViewInit {
	@Output() opponentPortraitChangeRequested: EventEmitter<void> = new EventEmitter<void>();
	@Output() playerPortraitChangeRequested: EventEmitter<void> = new EventEmitter<void>();

	@Output()
	opponentMinionChangeRequested: EventEmitter<ChangeMinionRequest> = new EventEmitter<ChangeMinionRequest>();
	@Output() playerMinionChangeRequested: EventEmitter<ChangeMinionRequest> = new EventEmitter<ChangeMinionRequest>();

	@Output()
	opponentMinionUpdateRequested: EventEmitter<ChangeMinionRequest> = new EventEmitter<ChangeMinionRequest>();
	@Output() playerMinionUpdateRequested: EventEmitter<ChangeMinionRequest> = new EventEmitter<ChangeMinionRequest>();

	@Output()
	opponentMinionRemoveRequested: EventEmitter<ChangeMinionRequest> = new EventEmitter<ChangeMinionRequest>();
	@Output() playerMinionRemoveRequested: EventEmitter<ChangeMinionRequest> = new EventEmitter<ChangeMinionRequest>();

	@Input() set faceOff(value: BgsFaceOffWithSimulation) {
		this._faceOff = value;
		this.updateInfo();
	}

	@Input() fullScreenMode = false;
	@Input() hideActualBattle = false;
	@Input() clickToChange = false;
	@Input() allowClickToAdd = false;
	@Input() closeOnMinion = false;
	@Input() showTavernTier = true;
	@Input() simulationUpdater: (
		currentFaceOff: BgsFaceOffWithSimulation,
		partialUpdate: BgsFaceOffWithSimulation,
	) => void;

	turnNumber: number;
	_faceOff: BgsFaceOffWithSimulation;
	opponent: BgsBoardInfo;
	player: BgsBoardInfo;
	actualBattle: BgsFaceOffWithSimulation;
	actualResult: string;
	isPremium: boolean;
	tooltip: string;

	newBattle: BgsFaceOffWithSimulation;

	private newOpponentEntities: readonly Entity[];
	private newPlayerEntities: readonly Entity[];

	private overlayRef: OverlayRef;
	private positionStrategy: PositionStrategy;

	constructor(
		private readonly simulationService: BgsBattleSimulationService,
		private readonly prefs: PreferencesService,
		private readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly overlay: Overlay,
		private readonly overlayPositionBuilder: OverlayPositionBuilder,
	) {}

	async ngAfterViewInit() {
		this.positionStrategy = this.overlayPositionBuilder.global().centerHorizontally().centerVertically();
		this.overlayRef = this.overlay.create({ positionStrategy: this.positionStrategy, hasBackdrop: true });
		this.overlayRef.backdropClick().subscribe(() => {
			console.debug('background clicked');
			this.overlayRef.detach();
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		});

		this.isPremium = true; //this.turnNumber <= 5 || !(await this.adService.shouldDisplayAds());
		this.tooltip = this.isPremium
			? 'Simulate the battle with the new boards'
			: 'Click to subscribe and unlock this feature';
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	onOpponentEntitiesUpdated(newEntities: readonly Entity[]) {
		this.newOpponentEntities = newEntities;
	}

	onPlayerEntitiesUpdated(newEntities: readonly Entity[]) {
		this.newPlayerEntities = newEntities;
	}

	onPortraitChangeRequested(side: 'player' | 'opponent') {
		const portal = new ComponentPortal(BgsSimulatorHeroSelectionComponent);
		const modalRef = this.overlayRef.attach(portal);
		modalRef.instance.closeHandler = () => {
			this.overlayRef.detach();
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		};
		modalRef.instance.currentHero = side === 'player' ? this.player.player.cardId : this.opponent.player.cardId;
		modalRef.instance.applyHandler = (newHeroCardId: string) => {
			this.overlayRef.detach();
			side === 'player'
				? this.simulationUpdater(this._faceOff, {
						playerCardId: newHeroCardId,
						battleInfo: {
							playerBoard: {
								player: {
									cardId: newHeroCardId,
									heroPowerId: getHeroPower(newHeroCardId),
								},
							},
						},
				  } as BgsFaceOffWithSimulation)
				: this.simulationUpdater(this._faceOff, {
						opponentCardId: newHeroCardId,
						battleInfo: {
							opponentBoard: {
								player: {
									cardId: newHeroCardId,
									heroPowerId: getHeroPower(newHeroCardId),
								},
							},
						},
				  } as BgsFaceOffWithSimulation);
		};
		this.positionStrategy.apply();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	onHeroPowerChangeRequested(side: 'player' | 'opponent') {
		const portal = new ComponentPortal(BgsSimulatorHeroPowerSelectionComponent);
		const modalRef = this.overlayRef.attach(portal);
		modalRef.instance.closeHandler = () => {
			this.overlayRef.detach();
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		};
		modalRef.instance.currentHero =
			side === 'player' ? this.player.player.heroPowerId : this.opponent.player.heroPowerId;
		modalRef.instance.applyHandler = (newHeroCardId: string) => {
			this.overlayRef.detach();
			side === 'player'
				? this.simulationUpdater(this._faceOff, {
						battleInfo: {
							playerBoard: {
								player: {
									heroPowerId: newHeroCardId,
								},
							},
						},
				  } as BgsFaceOffWithSimulation)
				: this.simulationUpdater(this._faceOff, {
						opponentCardId: newHeroCardId,
						battleInfo: {
							opponentBoard: {
								player: {
									heroPowerId: newHeroCardId,
								},
							},
						},
				  } as BgsFaceOffWithSimulation);
		};
		this.positionStrategy.apply();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	onPlayerMinionChangeRequested(event) {
		this.playerMinionChangeRequested.next(event);
	}

	onOpponentMinionChangeRequested(event) {
		this.opponentMinionChangeRequested.next(event);
	}

	onPlayerMinionUpdateRequested(event) {
		this.playerMinionUpdateRequested.next(event);
	}

	onOpponentMinionUpdateRequested(event) {
		this.opponentMinionUpdateRequested.next(event);
	}

	onPlayerMinionRemoveRequested(event) {
		this.playerMinionRemoveRequested.next(event);
	}

	onOpponentMinionRemoveRequested(event) {
		this.opponentMinionRemoveRequested.next(event);
	}

	resetBoards() {
		this.newBattle = this.actualBattle;
		this.player = { ...this.player };
		this.opponent = { ...this.opponent };
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	// For now do it purely in the UI, let's see later on if we want to use the store
	async simulateNewBattle() {
		if (!this.isPremium) {
			amplitude.getInstance().logEvent('subscription-click', { 'page': 'replays-resim' });
			this.ow.openStore();
			return;
		}
		amplitude.getInstance().logEvent('battle-resim');
		this.newBattle = null;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}

		const prefs = await this.prefs.getPreferences();
		const battleInfo: BgsBattleInfo = {
			playerBoard: {
				player: this.player.player,
				secrets: this.player.secrets,
				board: this.newPlayerEntities ? this.buildBoard(this.newPlayerEntities) : this.player.board,
			},
			opponentBoard: {
				player: this.player.player,
				secrets: this.player.secrets,
				board: this.newOpponentEntities ? this.buildBoard(this.newOpponentEntities) : this.opponent.board,
			},
			options: {
				...this._faceOff.battleInfo.options,
				numberOfSimulations: prefs.bgsSimulatorNumberOfSims ?? 8000,
				maxAcceptableDuration: 6000,
			},
		};
		const newSim = await this.simulationService.simulateLocalBattle(battleInfo, prefs);
		this.newBattle = BgsFaceOffWithSimulation.create({
			battleInfoStatus: 'done',
			battleResult: newSim,
		} as BgsFaceOffWithSimulation);
		// this.newBattleStatus = 'done';
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private buildBoard(entities: readonly Entity[]): BoardEntity[] {
		return (entities ?? []).map((entity) => this.buildEntity(entity));
	}

	private buildEntity(entity: Entity): BoardEntity {
		// TODO: enchantments
		// console.error('still needs to build enchantments');
		return {
			entityId: entity.id,
			cardId: entity.cardID,
			attack: entity.getTag(GameTag.ATK),
			health: entity.getTag(GameTag.HEALTH),
			divineShield: entity.getTag(GameTag.DIVINE_SHIELD) === 1,
			friendly: true,
			megaWindfury: entity.getTag(GameTag.MEGA_WINDFURY) === 1,
			windfury: entity.getTag(GameTag.WINDFURY) === 1,
			poisonous: entity.getTag(GameTag.POISONOUS) === 1,
			reborn: entity.getTag(GameTag.REBORN) === 1,
			taunt: entity.getTag(GameTag.TAUNT) === 1,
			enchantments: entity['enchantments'],
			definitelyDead: false,
		};
	}

	private updateInfo() {
		if (!this._faceOff) {
			return;
		}

		this.opponent =
			this._faceOff.battleInfo?.opponentBoard ??
			({
				player: {
					cardId: this._faceOff.opponentCardId,
					hpLeft: this._faceOff.opponentHpLeft,
					tavernTier: this._faceOff.opponentTavern,
				} as BgsPlayerEntity,
			} as BgsBoardInfo);
		this.player =
			this._faceOff.battleInfo?.playerBoard ??
			({
				player: {
					cardId: this._faceOff.playerCardId,
					hpLeft: this._faceOff.playerHpLeft,
					tavernTier: this._faceOff.playerTavern,
				} as BgsPlayerEntity,
			} as BgsBoardInfo);
		this.actualBattle = this._faceOff;
		this.newBattle = this._faceOff;
		this.turnNumber = this._faceOff.turn;
		this.actualResult = this._faceOff.result;
	}
}
