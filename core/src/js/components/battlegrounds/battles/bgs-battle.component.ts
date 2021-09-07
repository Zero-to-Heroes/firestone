import { Overlay, OverlayPositionBuilder, OverlayRef, PositionStrategy } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { GameTag } from '@firestone-hs/reference-data';
import { Entity } from '@firestone-hs/replay-parser';
import { BgsBattleInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-battle-info';
import { BgsBoardInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-board-info';
import { BoardEntity } from '@firestone-hs/simulate-bgs-battle/dist/board-entity';
import { BgsFaceOffWithSimulation } from '../../../models/battlegrounds/bgs-face-off-with-simulation';
import { BgsBattleSimulationService } from '../../../services/battlegrounds/bgs-battle-simulation.service';
import { getHeroPower } from '../../../services/battlegrounds/bgs-utils';
import { OverwolfService } from '../../../services/overwolf.service';
import { PreferencesService } from '../../../services/preferences.service';
import { removeFromReadonlyArray, replaceInArray } from '../../../services/utils';
import { BgsSimulatorHeroPowerSelectionComponent } from './bgs-simulator-hero-power-selection.component';
import { BgsSimulatorHeroSelectionComponent } from './bgs-simulator-hero-selection.component';
import { BgsSimulatorMinionSelectionComponent } from './bgs-simulator-minion-selection.component';

declare let amplitude;
@Component({
	selector: 'bgs-battle',
	styleUrls: [
		`../../../../css/global/reset-styles.scss`,
		`../../../../css/global/scrollbar.scss`,
		`../../../../css/component/battlegrounds/battles/bgs-battle.component.scss`,
	],
	template: `
		<div class="bgs-battle {{ additionalClass }}" [ngClass]="{ 'full-screen-mode': fullScreenMode }">
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
						(entitiesUpdated)="onEntitiesUpdated('opponent', $event)"
						(portraitChangeRequested)="onPortraitChangeRequested('opponent')"
						(heroPowerChangeRequested)="onHeroPowerChangeRequested('opponent')"
						(addMinionRequested)="onMinionAddRequested('opponent')"
						(updateMinionRequested)="onMinionUpdateRequested('opponent', $event)"
						(removeMinionRequested)="onMinionRemoveRequested('opponent', $event)"
					></bgs-battle-side>
					<div class="versus" *ngIf="!fullScreenMode">VS</div>
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
						(entitiesUpdated)="onEntitiesUpdated('player', $event)"
						(portraitChangeRequested)="onPortraitChangeRequested('player')"
						(heroPowerChangeRequested)="onHeroPowerChangeRequested('player')"
						(addMinionRequested)="onMinionAddRequested('player')"
						(updateMinionRequested)="onMinionUpdateRequested('player', $event)"
						(removeMinionRequested)="onMinionRemoveRequested('player', $event)"
					></bgs-battle-side>
				</div>
				<div class="simulations" *ngIf="!fullScreenMode">
					<div class="result actual" *ngIf="!hideActualBattle">
						<div class="label">Actual</div>
						<bgs-battle-status [showReplayLink]="true" [nextBattle]="actualBattle"></bgs-battle-status>
					</div>
					<div class="result new">
						<div class="label">Simulated</div>
						<bgs-battle-status [showReplayLink]="true" [nextBattle]="newBattle"></bgs-battle-status>
					</div>
					<div class="controls">
						<div class="button simulate" (click)="simulateNewBattle()" [helpTooltip]="tooltip">
							Simulate
						</div>
						<div class="reset" (click)="resetBoards()">
							<div class="icon" inlineSVG="assets/svg/restore.svg"></div>
							<div class="text">Reset</div>
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
	@Input() simulationUpdater: (
		currentFaceOff: BgsFaceOffWithSimulation,
		partialUpdate: BgsFaceOffWithSimulation,
	) => void;

	@Input() simulationReset: (faceOffId: string) => void;

	@Input() set faceOff(value: BgsFaceOffWithSimulation) {
		this._faceOff = value;
		if (!this._faceOff.battleInfo) {
			console.debug('no battle info, filling in the details to allow early simulation');
			this._faceOff = this._faceOff.update({
				battleInfo: {
					playerBoard: {
						board: [],
						player: {
							cardId: this._faceOff.playerCardId ?? 'TB_BaconShop_HERO_KelThuzad',
							hpLeft: this._faceOff.playerHpLeft ?? 40,
							tavernTier: this._faceOff.playerTavern ?? 6,
							heroPowerId: null,
							heroPowerUsed: true,
						},
					},
					opponentBoard: {
						board: [],
						player: {
							cardId: this._faceOff.opponentCardId ?? 'TB_BaconShop_HERO_KelThuzad',
							hpLeft: this._faceOff.opponentHpLeft ?? 40,
							tavernTier: this._faceOff.opponentTavern ?? 6,
							heroPowerId: null,
							heroPowerUsed: true,
						},
					},
					options: {
						numberOfSimulations: 8000,
						maxAcceptableDuration: 6000,
						// No restrictions on tribes yet
						validTribes: undefined,
					},
				},
			} as BgsFaceOffWithSimulation);
			console.debug('no battle info, filling in the details to allow early simulation', this._faceOff, value);
		}
		this.updateInfo();
	}

	@Input() actualBattle: BgsFaceOffWithSimulation;
	@Input() fullScreenMode = false;
	@Input() hideActualBattle = false;
	@Input() clickToChange = false;
	@Input() allowClickToAdd = false;
	@Input() closeOnMinion = false;
	@Input() showTavernTier = false;
	@Input() additionalClass: string;

	turnNumber: number;
	_faceOff: BgsFaceOffWithSimulation;
	opponent: BgsBoardInfo;
	player: BgsBoardInfo;

	isPremium: boolean;
	tooltip: string;

	newBattle: BgsFaceOffWithSimulation;

	// private newOpponentEntities: readonly Entity[];
	// private newPlayerEntities: readonly Entity[];

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

	onEntitiesUpdated(side: 'player' | 'opponent', newEntities: readonly Entity[]) {
		console.debug('onEntitiesUpdated', side, newEntities);
		const existingSide =
			side === 'player' ? this._faceOff.battleInfo.playerBoard : this._faceOff.battleInfo.opponentBoard;
		console.debug('minionIndex', side, existingSide, this._faceOff);
		side === 'player'
			? this.simulationUpdater(this._faceOff, {
					battleInfo: {
						playerBoard: {
							board: this.buildBoard(newEntities),
						} as BgsBoardInfo,
					},
			  } as BgsFaceOffWithSimulation)
			: this.simulationUpdater(this._faceOff, {
					battleInfo: {
						opponentBoard: {
							board: this.buildBoard(newEntities),
						} as BgsBoardInfo,
					},
			  } as BgsFaceOffWithSimulation);
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

	onMinionAddRequested(side: 'player' | 'opponent') {
		console.debug('onMinionAddRequested', side);
		const portal = new ComponentPortal(BgsSimulatorMinionSelectionComponent);
		const modalRef = this.overlayRef.attach(portal);
		modalRef.instance.closeHandler = () => {
			this.overlayRef.detach();
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		};
		const existingSide =
			side === 'player' ? this._faceOff.battleInfo.playerBoard : this._faceOff.battleInfo.opponentBoard;
		modalRef.instance.currentMinion = null;
		modalRef.instance.entityId = this._faceOff.getNextEntityId();
		modalRef.instance.applyHandler = (newEntity: BoardEntity) => {
			this.overlayRef.detach();
			console.debug('minionIndex', existingSide);
			side === 'player'
				? this.simulationUpdater(this._faceOff, {
						battleInfo: {
							playerBoard: {
								board: [
									...this._faceOff.battleInfo.playerBoard.board,
									newEntity,
								] as readonly BoardEntity[],
							} as BgsBoardInfo,
						},
				  } as BgsFaceOffWithSimulation)
				: this.simulationUpdater(this._faceOff, {
						battleInfo: {
							opponentBoard: {
								board: [
									...this._faceOff.battleInfo.opponentBoard.board,
									newEntity,
								] as readonly BoardEntity[],
							} as BgsBoardInfo,
						},
				  } as BgsFaceOffWithSimulation);
		};
		this.positionStrategy.apply();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	onMinionUpdateRequested(side: 'player' | 'opponent', event: { index: number }) {
		console.debug('onMinionUpdateRequested', side, event);
		const portal = new ComponentPortal(BgsSimulatorMinionSelectionComponent);
		const modalRef = this.overlayRef.attach(portal);
		modalRef.instance.closeHandler = () => {
			this.overlayRef.detach();
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		};
		const existingSide =
			side === 'player' ? this._faceOff.battleInfo.playerBoard : this._faceOff.battleInfo.opponentBoard;
		modalRef.instance.currentMinion = existingSide.board[event.index];
		modalRef.instance.entityId = this._faceOff.getNextEntityId();
		modalRef.instance.applyHandler = (newEntity: BoardEntity) => {
			this.overlayRef.detach();
			const minionIndex = event?.index;
			console.debug(
				'minionIndex',
				minionIndex,
				event,
				existingSide,
				...this._faceOff.battleInfo.opponentBoard.board.slice(0, minionIndex),
				newEntity,
				...this._faceOff.battleInfo.opponentBoard.board.slice(minionIndex + 1),
			);
			side === 'player'
				? this.simulationUpdater(this._faceOff, {
						battleInfo: {
							playerBoard: {
								board: replaceInArray(
									this._faceOff.battleInfo.playerBoard.board,
									minionIndex,
									newEntity,
								),
							} as BgsBoardInfo,
						},
				  } as BgsFaceOffWithSimulation)
				: this.simulationUpdater(this._faceOff, {
						battleInfo: {
							opponentBoard: {
								board: replaceInArray(
									this._faceOff.battleInfo.opponentBoard.board,
									minionIndex,
									newEntity,
								),
							} as BgsBoardInfo,
						},
				  } as BgsFaceOffWithSimulation);
		};
		this.positionStrategy.apply();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	onMinionRemoveRequested(side: 'player' | 'opponent', event: { index: number }) {
		console.debug('onMinionRemoveRequested', side, event);
		const existingSide =
			side === 'player' ? this._faceOff.battleInfo.playerBoard : this._faceOff.battleInfo.opponentBoard;
		const minionIndex = event?.index ?? existingSide.board.length;
		console.debug(
			'minionIndex',
			minionIndex,
			side,
			event,
			existingSide,
			this._faceOff,
			[...this._faceOff.battleInfo.opponentBoard.board].splice(minionIndex, 1),
		);

		side === 'player'
			? this.simulationUpdater(this._faceOff, {
					battleInfo: {
						playerBoard: {
							board: [
								...removeFromReadonlyArray(this._faceOff.battleInfo.playerBoard.board, minionIndex),
							] as readonly BoardEntity[],
						} as BgsBoardInfo,
					},
			  } as BgsFaceOffWithSimulation)
			: this.simulationUpdater(this._faceOff, {
					battleInfo: {
						opponentBoard: {
							board: [
								...removeFromReadonlyArray(this._faceOff.battleInfo.opponentBoard.board, minionIndex),
							] as readonly BoardEntity[],
						} as BgsBoardInfo,
					},
			  } as BgsFaceOffWithSimulation);
	}

	resetBoards() {
		this.simulationReset(this._faceOff.id);
	}

	// For now do it purely in the UI, let's see later on if we want to use the store
	async simulateNewBattle() {
		if (!this.isPremium) {
			amplitude.getInstance().logEvent('subscription-click', { 'page': 'replays-resim' });
			this.ow.openStore();
			return;
		}
		amplitude.getInstance().logEvent('battle-resim');
		this.newBattle = BgsFaceOffWithSimulation.create({
			battleInfoStatus: 'waiting-for-result',
			battleResult: null,
		} as BgsFaceOffWithSimulation);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}

		const prefs = await this.prefs.getPreferences();
		const battleInfo: BgsBattleInfo = {
			playerBoard: {
				player: this.player.player,
				secrets: this.player.secrets,
				board: this.player.board,
			},
			opponentBoard: {
				player: this.opponent.player,
				secrets: this.opponent.secrets,
				board: this.opponent.board,
			},
			options: {
				...this._faceOff.battleInfo.options,
				numberOfSimulations: prefs.bgsSimulatorNumberOfSims ?? 8000,
				maxAcceptableDuration: 6000,
			},
		};
		console.log('no-format', '[bgs-simulation-desktop] battle simulation request prepared', battleInfo);
		const newSim = await this.simulationService.simulateLocalBattle(battleInfo, prefs);
		console.log('no-format', '[bgs-simulation-desktop] battle simulation result', newSim);
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

		this.opponent = this._faceOff.battleInfo.opponentBoard;
		this.player = this._faceOff.battleInfo.playerBoard;
		this.newBattle = this._faceOff;
		this.turnNumber = this._faceOff.turn;
	}
}
