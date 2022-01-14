import { Overlay, OverlayPositionBuilder, OverlayRef, PositionStrategy } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostListener,
	Input,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { GameTag } from '@firestone-hs/reference-data';
import { Entity } from '@firestone-hs/replay-parser';
import { BgsBattleInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-battle-info';
import { BgsBoardInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-board-info';
import { BoardEntity } from '@firestone-hs/simulate-bgs-battle/dist/board-entity';
import { Subscription } from 'rxjs';
import { BgsFaceOffWithSimulation } from '../../../models/battlegrounds/bgs-face-off-with-simulation';
import { ApiRunner } from '../../../services/api-runner';
import {
	BgsBattlePositioningService,
	PermutationResult,
	ProcessingStatus,
} from '../../../services/battlegrounds/bgs-battle-positioning.service';
import { BgsBattleSimulationService } from '../../../services/battlegrounds/bgs-battle-simulation.service';
import { getHeroPower } from '../../../services/battlegrounds/bgs-utils';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
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
				<div
					class="turn"
					[owTranslate]="'battlegrounds.battle.turn'"
					[translateParams]="{ value: turnNumber }"
				></div>
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
					<div class="versus" *ngIf="!fullScreenMode" [owTranslate]="'battlegrounds.sim.versus'"></div>
					<div class="simulations" *ngIf="fullScreenMode">
						<div class="controls">
							<div
								class="button simulate"
								(click)="simulateNewBattle()"
								[helpTooltip]="tooltip"
								[owTranslate]="'battlegrounds.sim.simulate-button'"
							></div>
						</div>
						<div class="result new">
							<bgs-battle-status [showReplayLink]="true" [nextBattle]="newBattle"></bgs-battle-status>
						</div>
						<div class="controls position" [ngClass]="{ 'busy': processingReposition }">
							<div
								class="button best-position cancel"
								[owTranslate]="'battlegrounds.sim.reposition-button-cancel'"
								[helpTooltip]="'battlegrounds.sim.reposition-button-tooltip-cancel' | owTranslate"
								(click)="cancelPositioning()"
							></div>
							<div
								class="button best-position"
								(click)="findBestPositioning()"
								[helpTooltip]="repositionButtonTooltipKey | owTranslate"
								[owTranslate]="repositionButtonTextKey"
							></div>
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
						<div class="label" [owTranslate]="'battlegrounds.sim.actual'"></div>
						<bgs-battle-status [showReplayLink]="true" [nextBattle]="actualBattle"></bgs-battle-status>
					</div>
					<div class="result new">
						<div class="label" [owTranslate]="'battlegrounds.sim.simulated'"></div>
						<bgs-battle-status [showReplayLink]="true" [nextBattle]="newBattle"></bgs-battle-status>
					</div>
					<div class="controls">
						<div
							class="button simulate"
							(click)="simulateNewBattle()"
							[helpTooltip]="tooltip"
							[owTranslate]="'battlegrounds.sim.simulate-button'"
						></div>
						<div class="side-buttons">
							<div
								class="export"
								(click)="exportBoards()"
								[helpTooltip]="exportConfirmationText"
								[helpTooltipOnlyShowOnClick]="true"
								[helpTooltipClickTimeout]="exportConfirmationTimeout"
							>
								<div class="icon" inlineSVG="assets/svg/copy.svg"></div>
								<div
									class="text"
									[owTranslate]="'battlegrounds.sim.export-button'"
									[helpTooltip]="'battlegrounds.sim.export-button-tooltip' | owTranslate"
								></div>
							</div>
							<div class="reset" (click)="resetBoards()">
								<div class="icon" inlineSVG="assets/svg/restore.svg"></div>
								<div class="text" [owTranslate]="'battlegrounds.sim.reset-button'"></div>
							</div>
						</div>
					</div>
				</div>
				<div class="side-buttons" *ngIf="fullScreenMode">
					<div
						class="button import"
						(click)="importBoards()"
						[helpTooltip]="importConfirmationText"
						[helpTooltipOnlyShowOnClick]="true"
						[helpTooltipClickTimeout]="importConfirmationTimeout"
					>
						<div class="icon" inlineSVG="assets/svg/import_deckstring.svg"></div>
						<div class="text" [owTranslate]="'battlegrounds.sim.import-button'"></div>
					</div>
					<div
						class="button export"
						(click)="exportBoards()"
						[helpTooltip]="exportConfirmationText"
						[helpTooltipOnlyShowOnClick]="true"
						[helpTooltipClickTimeout]="exportConfirmationTimeout"
					>
						<div class="icon" inlineSVG="assets/svg/copy.svg"></div>
						<div class="text" [owTranslate]="'battlegrounds.sim.export-button'"></div>
					</div>
					<div class="button reset" (click)="resetBoards()">
						<div class="icon" inlineSVG="assets/svg/restore.svg"></div>
						<div class="text" [owTranslate]="'battlegrounds.sim.reset-button'"></div>
					</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsBattleComponent implements AfterViewInit, OnDestroy {
	@Input() simulationUpdater: (
		currentFaceOff: BgsFaceOffWithSimulation,
		partialUpdate: BgsFaceOffWithSimulation,
	) => void;

	@Input() simulationReset: (faceOffId: string) => void;

	@Input() set faceOff(value: BgsFaceOffWithSimulation) {
		console.debug('setting faceOff', value);
		this._faceOff = value;
		if (!this._faceOff) {
			return;
		}
		if (!this._faceOff.battleInfo) {
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

	tooltip: string;
	exportConfirmationText = this.i18n.translateString('battlegrounds.sim.exporting');
	exportConfirmationTimeout = 4_000;
	importConfirmationText = this.i18n.translateString('battlegrounds.sim.importing');
	importConfirmationTimeout = 4_000;

	repositionButtonTextKey = 'battlegrounds.sim.reposition-button';
	repositionButtonTooltipKey = 'battlegrounds.sim.reposition-button-tooltip';
	processingReposition = false;

	newBattle: BgsFaceOffWithSimulation;

	private overlayRef: OverlayRef;
	private positionStrategy: PositionStrategy;

	private sub$$: Subscription;

	constructor(
		private readonly simulationService: BgsBattleSimulationService,
		private readonly positioningService: BgsBattlePositioningService,
		private readonly prefs: PreferencesService,
		private readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly overlay: Overlay,
		private readonly overlayPositionBuilder: OverlayPositionBuilder,
		private readonly ow: OverwolfService,
		private readonly api: ApiRunner,
	) {}

	async ngAfterViewInit() {
		this.positionStrategy = this.overlayPositionBuilder.global().centerHorizontally().centerVertically();
		this.overlayRef = this.overlay.create({ positionStrategy: this.positionStrategy, hasBackdrop: true });
		this.sub$$ = this.overlayRef.backdropClick().subscribe(() => {
			this.overlayRef.detach();
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		});

		this.tooltip = this.i18n.translateString('battlegrounds.sim.simulate-button-tooltip');
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		this.sub$$.unsubscribe();
	}

	onEntitiesUpdated(side: 'player' | 'opponent', newEntities: readonly Entity[]) {
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
		const portal = new ComponentPortal(BgsSimulatorMinionSelectionComponent);
		const modalRef = this.overlayRef.attach(portal);
		modalRef.instance.closeHandler = () => {
			this.overlayRef.detach();
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		};
		modalRef.instance.currentMinion = null;
		modalRef.instance.entityId = this._faceOff.getNextEntityId();
		modalRef.instance.applyHandler = (newEntity: BoardEntity) => {
			this.overlayRef.detach();
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
		const existingSide =
			side === 'player' ? this._faceOff.battleInfo.playerBoard : this._faceOff.battleInfo.opponentBoard;
		const minionIndex = event?.index ?? existingSide.board.length;
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

	async importBoards() {
		const fromClipboard = await this.ow.getFromClipboard();
		try {
			const shortCode = atob(fromClipboard);
			console.debug('shortCode', shortCode);
			const boardId = shortCode.split('simBoard')[1];
			console.debug('boardId', boardId);
			if (!boardId) {
				return;
			}
			const url = `https://static-api.firestoneapp.com/retrieveBgsSimulationSample/${boardId}`;
			console.debug('calling url', url);
			const code = await this.api.get(url);
			console.debug('code', code);
			const faceOffStr = atob(code);
			const faceOff = JSON.parse(faceOffStr) as BgsFaceOffWithSimulation;
			this.simulationUpdater(null, faceOff);
			amplitude.getInstance().logEvent('import-bgs-sim-code');
		} catch (e) {
			console.warn('could not import from clipboard', fromClipboard, e);
		}
	}

	async exportBoards() {
		amplitude.getInstance().logEvent('export-bgs-sim-code');
		this.exportConfirmationText = this.i18n.translateString('battlegrounds.sim.exporting');
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
		const sim: BgsFaceOffWithSimulation = {
			...this._faceOff,
			battleResult: undefined,
			battleInfoStatus: undefined,
			battleInfoMesage: undefined,
		} as BgsFaceOffWithSimulation;
		const code = btoa(JSON.stringify(sim));
		console.debug('code', code);
		const shortCode = await this.simulationService.getIdForSimulationSample(code as any);
		console.debug('shortCode', shortCode);
		this.ow.placeOnClipboard(btoa(`simBoard${shortCode}`));
		this.exportConfirmationText = this.i18n.translateString('battlegrounds.sim.export-confirmation');
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
		setTimeout(() => {
			this.exportConfirmationText = this.i18n.translateString('battlegrounds.sim.exporting');
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		}, this.exportConfirmationTimeout);
		amplitude.getInstance().logEvent('export-bgs-sim-code');
	}

	// For now do it purely in the UI, let's see later on if we want to use the store
	async simulateNewBattle() {
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

	cancelPositioning() {
		console.log('cancelling');
		this.repositionButtonTextKey = `battlegrounds.sim.reposition-button-cancelling`;
		this.repositionButtonTooltipKey = `battlegrounds.sim.reposition-button-tooltip-cancelling`;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
		this.positioningService.cancel();
		this.processingReposition = false;
		this.repositionButtonTextKey = 'battlegrounds.sim.reposition-button';
	}

	async findBestPositioning() {
		if (this.processingReposition) {
			this.cancelPositioning();
			return;
		}

		this.processingReposition = true;
		amplitude.getInstance().logEvent('battle-reposition');
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
		// console.log('no-format', '[bgs-simulation-desktop] battle simulation request prepared', battleInfo);
		const it = this.positioningService.findBestPositioning(battleInfo, prefs);
		while (true) {
			const value = await it.next();
			console.debug('got next value', value);
			const status: ProcessingStatus = value.value[0];
			const result: PermutationResult = value.value[1];
			if (!!result) {
				this.simulationUpdater(
					null,
					BgsFaceOffWithSimulation.create({
						battleInfoStatus: 'done',
						battleInfo: result.battleInfo,
						battleResult: result.result,
					} as BgsFaceOffWithSimulation),
				);
				this.processingReposition = false;
				this.repositionButtonTextKey = 'battlegrounds.sim.reposition-button';
				break;
			}
			this.repositionButtonTextKey = `battlegrounds.sim.reposition-button-${ProcessingStatus[
				status
			].toLowerCase()}`;
			this.repositionButtonTooltipKey = `battlegrounds.sim.reposition-button-tooltip-${ProcessingStatus[
				status
			].toLowerCase()}`;
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		}
		// const result = await this.positioningService.findBestPositioning(battleInfo, prefs);
		// // console.log('no-format', '[bgs-simulation-desktop] battle simulation result', newSim);
		// this.simulationUpdater(
		// 	null,
		// 	BgsFaceOffWithSimulation.create({
		// 		battleInfoStatus: 'done',
		// 		battleInfo: result.battleInfo,
		// 		battleResult: result.result,
		// 	} as BgsFaceOffWithSimulation),
		// );
		// this.newBattleStatus = 'done';
		// if (!(this.cdr as ViewRef)?.destroyed) {
		// 	this.cdr.detectChanges();
		// }
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
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
