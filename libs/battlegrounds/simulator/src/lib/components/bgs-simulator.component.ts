/* eslint-disable no-mixed-spaces-and-tabs */
import { Overlay, OverlayPositionBuilder, OverlayRef, PositionStrategy } from '@angular/cdk/overlay';
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
// import {
// 	BgsSimulatorKeyboardControl,
// 	BgsSimulatorKeyboardControls,
// } from '@components/battlegrounds/battles/simulator-keyboard-controls.service';
import { GameTag, GameType, defaultStartingHp, getHeroPower } from '@firestone-hs/reference-data';
import { Entity } from '@firestone-hs/replay-parser';
import { BgsBattleInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-battle-info';
import { BgsBoardInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-board-info';
import { BoardEntity } from '@firestone-hs/simulate-bgs-battle/dist/board-entity';
import { BgsFaceOffWithSimulation } from '@firestone/battlegrounds/common';
import { PreferencesService } from '@firestone/shared/common/service';
import { removeFromReadonlyArray, replaceInArray } from '@firestone/shared/framework/common';
import { ApiRunner, CardsFacadeService, ILocalizationService, OverwolfService } from '@firestone/shared/framework/core';
import { Subscription } from 'rxjs';
// import { BgsSimulatorHeroPowerSelectionComponent } from './bgs-simulator-hero-power-selection.component';
// import { BgsSimulatorHeroSelectionComponent } from './bgs-simulator-hero-selection.component';
// import { BgsSimulatorMinionSelectionComponent } from './bgs-simulator-minion-selection.component';
// import { BgsSimulatorQuestRewardSelectionComponent } from './bgs-simulator-quest-reward-selection.component';

@Component({
	selector: 'bgs-simulator',
	styleUrls: [`./bgs-simulator.component.scss`],
	template: `
		<!-- <div class="battle-simulator">
			<div class="battle-boards">
				<bgs-battle-side
					class="side opponent"
					[player]="opponent"
					[showTavernTier]="showTavernTier"
					[clickToChange]="clickToChange"
					[allowClickToAdd]="allowClickToAdd"
					[closeOnMinion]="closeOnMinion"
					[fullScreenMode]="true"
					[tooltipPosition]="'right'"
					(entitiesUpdated)="onEntitiesUpdated('opponent', $event)"
					(portraitChangeRequested)="onPortraitChangeRequested('opponent')"
					(heroPowerChangeRequested)="onHeroPowerChangeRequested('opponent')"
					(questRewardChangeRequested)="onQuestRewardChangeRequested('opponent')"
					(undeadArmyChanged)="onUndeadArmyChanged('opponent', $event)"
					(eternalLegionChanged)="onEternalLegionChanged('opponent', $event)"
					(addMinionRequested)="onMinionAddRequested('opponent')"
					(updateMinionRequested)="onMinionUpdateRequested('opponent', $event)"
					(removeMinionRequested)="onMinionRemoveRequested('opponent', $event)"
				></bgs-battle-side>
				<div class="simulations">
					<div class="controls">
						<div
							class="button simulate"
							[ngClass]="{ disabled: simulateButtonDisabled }"
							(click)="simulateNewBattle()"
							[helpTooltip]="tooltip"
						>
							{{ simulateButtonLabel }}
						</div>
					</div>
					<div class="result new">
						<bgs-battle-status [showReplayLink]="true" [nextBattle]="newBattle"></bgs-battle-status>
					</div>
					<div class="controls position" [ngClass]="{ busy: processingReposition }">
						<div
							class="button best-position cancel"
							[fsTranslate]="'battlegrounds.sim.reposition-button-cancel'"
							[helpTooltip]="'battlegrounds.sim.reposition-button-tooltip-cancel' | fsTranslate"
							(click)="cancelPositioning()"
						></div>
						<div
							class="button best-position"
							(click)="findBestPositioning()"
							[helpTooltip]="repositionButtonTooltipKey | fsTranslate"
							[fsTranslate]="repositionButtonTextKey"
						></div>
					</div>
				</div>
				<bgs-battle-side
					class="side player"
					[player]="player"
					[showTavernTier]="showTavernTier"
					[clickToChange]="clickToChange"
					[allowClickToAdd]="allowClickToAdd"
					[closeOnMinion]="closeOnMinion"
					[fullScreenMode]="true"
					[tooltipPosition]="'top-right'"
					(entitiesUpdated)="onEntitiesUpdated('player', $event)"
					(portraitChangeRequested)="onPortraitChangeRequested('player')"
					(heroPowerChangeRequested)="onHeroPowerChangeRequested('player')"
					(questRewardChangeRequested)="onQuestRewardChangeRequested('player')"
					(undeadArmyChanged)="onUndeadArmyChanged('player', $event)"
					(eternalLegionChanged)="onEternalLegionChanged('player', $event)"
					(addMinionRequested)="onMinionAddRequested('player')"
					(updateMinionRequested)="onMinionUpdateRequested('player', $event)"
					(removeMinionRequested)="onMinionRemoveRequested('player', $event)"
				></bgs-battle-side>
			</div>
			<div class="side-buttons">
				<div
					class="button import"
					(click)="importBoards()"
					[helpTooltip]="importConfirmationText"
					[helpTooltipOnlyShowOnClick]="true"
					[helpTooltipClickTimeout]="importConfirmationTimeout"
				>
					<div class="icon" inlineSVG="assets/svg/import_deckstring.svg"></div>
					<div class="text" [fsTranslate]="'battlegrounds.sim.import-button'"></div>
				</div>
				<div
					class="button export"
					(click)="exportBoards()"
					[helpTooltip]="exportConfirmationText"
					[helpTooltipOnlyShowOnClick]="true"
					[helpTooltipClickTimeout]="exportConfirmationTimeout"
				>
					<div class="icon" inlineSVG="assets/svg/copy.svg"></div>
					<div class="text" [fsTranslate]="'battlegrounds.sim.export-button'"></div>
				</div>
				<div class="button reset" (click)="resetBoards()">
					<div class="icon" inlineSVG="assets/svg/restore.svg"></div>
					<div class="text" [fsTranslate]="'battlegrounds.sim.reset-button'"></div>
				</div>
			</div>
		</div> -->
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsSimulatorComponent implements AfterViewInit, OnDestroy {
	@Input() simulationUpdater: (
		currentFaceOff: BgsFaceOffWithSimulation | null,
		partialUpdate: BgsFaceOffWithSimulation,
	) => void;

	@Input() simulationReset: (faceOffId: string) => void;

	@Input() set faceOff(value: BgsFaceOffWithSimulation) {
		// Make sure we have an instance of the class, and not just a data structure
		this._faceOff = BgsFaceOffWithSimulation.create(value);
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
							hpLeft:
								this._faceOff.playerHpLeft ??
								defaultStartingHp(
									GameType.GT_BATTLEGROUNDS,
									this._faceOff.playerCardId ?? 'TB_BaconShop_HERO_KelThuzad',
									this.allCards,
								),
							tavernTier: this._faceOff.playerTavern ?? 6,
							heroPowerId: null,
							heroPowerUsed: true,
							heroPowerInfo: 0,
							heroPowerInfo2: 0,
							questRewards: undefined,
							questEntities: [],
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
							heroPowerInfo: 0,
							heroPowerInfo2: 0,
							questRewards: undefined,
							questEntities: [],
						},
					},
					options: {
						numberOfSimulations: 8000,
						maxAcceptableDuration: 6000,
						skipInfoLogs: true,
					},
					gameState: {
						// No restrictions on tribes yet
						validTribes: undefined,
						currentTurn: 0,
						anomalies: [],
					},
				},
			});
		}
		this.updateInfo();
	}

	@Input() actualBattle: BgsFaceOffWithSimulation;
	@Input() hideActualBattle = false;
	@Input() clickToChange = false;
	@Input() allowClickToAdd = false;
	@Input() closeOnMinion = false;
	@Input() showTavernTier = false;
	@Input() allowKeyboardControl = false;
	@Input() additionalClass: string;

	turnNumber: number;
	_faceOff: BgsFaceOffWithSimulation;
	opponent: BgsBoardInfo;
	player: BgsBoardInfo;

	tooltip: string | null;
	exportConfirmationText = this.i18n.translateString('battlegrounds.sim.exporting');
	exportConfirmationTimeout = 4_000;
	importConfirmationText = this.i18n.translateString('battlegrounds.sim.importing');
	importConfirmationTimeout = 4_000;
	simulateButtonLabel = this.i18n.translateString('battlegrounds.sim.simulate-button');
	simulateButtonDisabled = false;

	repositionButtonTextKey = 'battlegrounds.sim.reposition-button';
	repositionButtonTooltipKey = 'battlegrounds.sim.reposition-button-tooltip';
	processingReposition = false;

	newBattle: BgsFaceOffWithSimulation;

	private overlayRef: OverlayRef;
	private positionStrategy: PositionStrategy;

	private sub$$: Subscription;

	constructor(
		// private readonly simulationService: BgsBattleSimulationService,
		// private readonly positioningService: BgsBattlePositioningService,
		private readonly prefs: PreferencesService,
		private readonly cdr: ChangeDetectorRef,
		private readonly i18n: ILocalizationService,
		private readonly overlay: Overlay,
		private readonly overlayPositionBuilder: OverlayPositionBuilder,
		private readonly ow: OverwolfService,
		private readonly api: ApiRunner,
		private readonly allCards: CardsFacadeService, // private readonly simulatorKeyboardControls: BgsSimulatorKeyboardControls,
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
		this.initKeyboardControls();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		// this.simulatorKeyboardControls.tearDown();
		this.sub$$?.unsubscribe();
	}

	private initKeyboardControls() {
		// this.simulatorKeyboardControls
		// 	.init(this.allowKeyboardControl)
		// 	.control(BgsSimulatorKeyboardControl.PlayerHero, () => this.onPortraitChangeRequested('player'))
		// 	.control(BgsSimulatorKeyboardControl.OpponentHero, () => this.onPortraitChangeRequested('opponent'))
		// 	.control(BgsSimulatorKeyboardControl.PlayerHeroPower, () => this.onHeroPowerChangeRequested('player'))
		// 	.control(BgsSimulatorKeyboardControl.OpponentHeroPower, () => this.onHeroPowerChangeRequested('opponent'))
		// 	.control(BgsSimulatorKeyboardControl.PlayerQuestReward, () => this.onQuestRewardChangeRequested('player'))
		// 	.control(BgsSimulatorKeyboardControl.OpponentQuestReward, () =>
		// 		this.onQuestRewardChangeRequested('opponent'),
		// 	)
		// 	.control(BgsSimulatorKeyboardControl.PlayerAddMinion, () => this.onMinionAddRequested('player'))
		// 	.control(BgsSimulatorKeyboardControl.OpponentAddMinion, () => this.onMinionAddRequested('opponent'));
	}

	@HostListener('document:keyup', ['$event'])
	handleKeyboardControl(event: KeyboardEvent) {
		if (!this.allowKeyboardControl) {
			return;
		}

		// Control is back to the overlay
		if (this.overlayRef.hasAttached()) {
			return;
		}
		// this.simulatorKeyboardControls.handleKeyDown(event);
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

	onUndeadArmyChanged(side: 'player' | 'opponent', newValue: number) {
		const request =
			side === 'player'
				? ({
						battleInfo: {
							playerBoard: {
								player: {
									globalInfo: {
										UndeadAttackBonus: newValue,
									},
								},
							},
						},
				  } as BgsFaceOffWithSimulation)
				: ({
						battleInfo: {
							opponentBoard: {
								player: {
									globalInfo: {
										UndeadAttackBonus: newValue,
									},
								},
							},
						},
				  } as BgsFaceOffWithSimulation);
		console.debug('updating undead army', side, newValue, request);
		this.simulationUpdater(this._faceOff, request);
	}

	onEternalLegionChanged(side: 'player' | 'opponent', newValue: number) {
		const request =
			side === 'player'
				? ({
						battleInfo: {
							playerBoard: {
								player: {
									globalInfo: {
										EternalKnightsDeadThisGame: newValue,
									},
								},
							},
						},
				  } as BgsFaceOffWithSimulation)
				: ({
						battleInfo: {
							opponentBoard: {
								player: {
									globalInfo: {
										EternalKnightsDeadThisGame: newValue,
									},
								},
							},
						},
				  } as BgsFaceOffWithSimulation);
		console.debug('updating eternal legion', side, newValue, request);
		this.simulationUpdater(this._faceOff, request);
	}

	onPortraitChangeRequested(side: 'player' | 'opponent') {
		const portal = null; // new ComponentPortal(BgsSimulatorHeroSelectionComponent);
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
									heroPowerId: getHeroPower(newHeroCardId, this.allCards.getService()),
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
									heroPowerId: getHeroPower(newHeroCardId, this.allCards.getService()),
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

	onQuestRewardChangeRequested(side: 'player' | 'opponent') {
		const portal = null; // new ComponentPortal(BgsSimulatorQuestRewardSelectionComponent);
		const modalRef = this.overlayRef.attach(portal);
		modalRef.instance.closeHandler = () => {
			this.overlayRef.detach();
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		};
		modalRef.instance.currentReward =
			side === 'player'
				? (this.player.player.questRewards ?? [])[0]
				: (this.opponent.player.questRewards ?? [])[0];
		modalRef.instance.applyHandler = (newQuestRewardId: string) => {
			this.overlayRef.detach();
			side === 'player'
				? this.simulationUpdater(this._faceOff, {
						battleInfo: {
							playerBoard: {
								player: {
									questRewards: [newQuestRewardId] as readonly string[],
								},
							},
						},
				  } as BgsFaceOffWithSimulation)
				: this.simulationUpdater(this._faceOff, {
						battleInfo: {
							opponentBoard: {
								player: {
									questRewards: [newQuestRewardId] as readonly string[],
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
		const portal = null; // new ComponentPortal(BgsSimulatorHeroPowerSelectionComponent);
		const modalRef = this.overlayRef.attach(portal);
		modalRef.instance.closeHandler = () => {
			this.overlayRef.detach();
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		};
		modalRef.instance.currentHero =
			side === 'player' ? this.player.player.heroPowerId : this.opponent.player.heroPowerId;
		modalRef.instance.heroPowerData =
			side === 'player' ? +(this.player.player.heroPowerInfo ?? -1) : +(this.opponent.player.heroPowerInfo ?? -1);
		modalRef.instance.applyHandler = (newHeroPowerCardId: string, heroPowerInfo: number) => {
			this.overlayRef.detach();
			side === 'player'
				? this.simulationUpdater(this._faceOff, {
						battleInfo: {
							playerBoard: {
								player: {
									heroPowerId: newHeroPowerCardId,
									heroPowerInfo: heroPowerInfo,
								},
							},
						},
				  } as BgsFaceOffWithSimulation)
				: this.simulationUpdater(this._faceOff, {
						battleInfo: {
							opponentBoard: {
								player: {
									heroPowerId: newHeroPowerCardId,
									heroPowerInfo: heroPowerInfo,
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
		const portal = null; // new ComponentPortal(BgsSimulatorMinionSelectionComponent);
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
									...(this._faceOff.battleInfo?.playerBoard.board ?? []),
									newEntity,
								] as readonly BoardEntity[],
							} as BgsBoardInfo,
						},
				  } as BgsFaceOffWithSimulation)
				: this.simulationUpdater(this._faceOff, {
						battleInfo: {
							opponentBoard: {
								board: [
									...(this._faceOff.battleInfo?.opponentBoard.board ?? []),
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
		const portal = null; // new ComponentPortal(BgsSimulatorMinionSelectionComponent);
		const modalRef = this.overlayRef.attach(portal);
		modalRef.instance.closeHandler = () => {
			this.overlayRef.detach();
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		};
		const existingSide =
			side === 'player' ? this._faceOff.battleInfo?.playerBoard : this._faceOff.battleInfo?.opponentBoard;
		modalRef.instance.currentMinion = existingSide?.board[event.index];
		modalRef.instance.entityId = this._faceOff.getNextEntityId();
		modalRef.instance.applyHandler = (newEntity: BoardEntity) => {
			this.overlayRef.detach();
			const minionIndex = event?.index;
			side === 'player'
				? this.simulationUpdater(this._faceOff, {
						battleInfo: {
							playerBoard: {
								board: replaceInArray(
									this._faceOff.battleInfo?.playerBoard.board ?? [],
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
									this._faceOff.battleInfo?.opponentBoard.board ?? [],
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
			side === 'player' ? this._faceOff.battleInfo?.playerBoard : this._faceOff.battleInfo?.opponentBoard;
		const minionIndex = event?.index ?? existingSide?.board.length;
		side === 'player'
			? this.simulationUpdater(this._faceOff, {
					battleInfo: {
						playerBoard: {
							board: [
								...removeFromReadonlyArray(
									this._faceOff.battleInfo?.playerBoard.board ?? [],
									minionIndex,
								),
							] as readonly BoardEntity[],
						} as BgsBoardInfo,
					},
			  } as BgsFaceOffWithSimulation)
			: this.simulationUpdater(this._faceOff, {
					battleInfo: {
						opponentBoard: {
							board: [
								...removeFromReadonlyArray(
									this._faceOff.battleInfo?.opponentBoard.board ?? [],
									minionIndex,
								),
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
			const boardId = shortCode.split('simBoard')[1];
			if (!boardId) {
				return;
			}
			const url = `https://h7h6lfnlmd7vstumpqiz74xqoq0vhsnm.lambda-url.us-west-2.on.aws/${boardId}`;
			const code = await this.api.get(url);
			const faceOffStr = atob(code ?? '');
			const faceOff = JSON.parse(faceOffStr) as BgsFaceOffWithSimulation;
			this.simulationUpdater(null, faceOff);
		} catch (e) {
			console.warn('could not import from clipboard', fromClipboard, e);
		}
	}

	async exportBoards() {
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
		const shortCode = null; // await this.simulationService.getIdForSimulationSample(code as any);
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
	}

	// For now do it purely in the UI, let's see later on if we want to use the store
	async simulateNewBattle() {
		if (this.simulateButtonDisabled || !this._faceOff.battleInfo) {
			return;
		}

		this.newBattle = BgsFaceOffWithSimulation.create({
			battleInfoStatus: 'waiting-for-result',
			battleResult: undefined,
		});
		this.simulateButtonLabel = this.i18n.translateString('battlegrounds.sim.simulating-button');
		this.simulateButtonDisabled = true;
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
				maxAcceptableDuration: 8000,
			},
			gameState: {
				...this._faceOff.battleInfo.gameState,
				// No restrictions on tribes yet
				validTribes: undefined,
				currentTurn: 0,
			},
		};
		console.log('[bgs-simulation-desktop] battle simulation request prepared');
		console.debug('no-format', '[bgs-simulation-desktop] battle simulation request prepared', battleInfo);
		const newSim = undefined; // await this.simulationService.simulateLocalBattle(battleInfo, prefs);
		console.log('no-format', '[bgs-simulation-desktop] battle simulation result', newSim);
		this.newBattle = BgsFaceOffWithSimulation.create({
			battleInfoStatus: 'done',
			battleResult: newSim,
		});
		this.simulateButtonLabel = this.i18n.translateString('battlegrounds.sim.simulate-button');
		this.simulateButtonDisabled = false;
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
		// this.positioningService.cancel();
		this.processingReposition = false;
		this.repositionButtonTextKey = 'battlegrounds.sim.reposition-button';
		this.repositionButtonTooltipKey = 'battlegrounds.sim.reposition-button-tooltip';
	}

	async findBestPositioning() {
		if (this.processingReposition) {
			this.cancelPositioning();
			return;
		}

		if (!this._faceOff.battleInfo) {
			return;
		}

		this.processingReposition = true;
		this.newBattle = BgsFaceOffWithSimulation.create({
			battleInfoStatus: 'waiting-for-result',
			battleResult: undefined,
		});
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
			gameState: {
				// No restrictions on tribes yet
				validTribes: undefined,
				currentTurn: 0,
			},
		};
		// console.log('no-format', '[bgs-simulation-desktop] battle simulation request prepared', battleInfo);
		// const it = this.positioningService.findBestPositioning(battleInfo);
		// // eslint-disable-next-line no-constant-condition
		// while (true) {
		// 	const value = await it.next();
		// 	const status: ProcessingStatus = value.value[0];
		// 	const result: PermutationResult = value.value[1];
		// 	if (!!result) {
		// 		this.simulationUpdater(
		// 			null,
		// 			BgsFaceOffWithSimulation.create({
		// 				battleInfoStatus: 'done',
		// 				battleInfo: result.battleInfo,
		// 				battleResult: result.result,
		// 			} as BgsFaceOffWithSimulation),
		// 		);
		// 		this.processingReposition = false;
		// 		this.repositionButtonTextKey = 'battlegrounds.sim.reposition-button';
		// 		this.repositionButtonTooltipKey = 'battlegrounds.sim.reposition-button-tooltip';
		// 		break;
		// 	}
		// 	this.repositionButtonTextKey = `battlegrounds.sim.reposition-button-${ProcessingStatus[
		// 		status
		// 	].toLowerCase()}`;
		// 	this.repositionButtonTooltipKey = `battlegrounds.sim.reposition-button-tooltip-${ProcessingStatus[
		// 		status
		// 	].toLowerCase()}`;
		// 	if (!(this.cdr as ViewRef)?.destroyed) {
		// 		this.cdr.detectChanges();
		// 	}
		// }
	}

	private buildBoard(entities: readonly Entity[]): BoardEntity[] {
		const result = (entities ?? []).map((entity) => this.buildEntity(entity));
		return result;
	}

	private buildEntity(entity: Entity): BoardEntity {
		return {
			entityId: entity.id,
			cardId: entity.cardID,
			attack: entity.getTag(GameTag.ATK),
			health: entity.getTag(GameTag.HEALTH),
			divineShield: entity.getTag(GameTag.DIVINE_SHIELD) === 1,
			friendly: true,
			windfury: entity.getTag(GameTag.WINDFURY) === 1 || entity.getTag(GameTag.MEGA_WINDFURY) === 1,
			stealth: entity.getTag(GameTag.STEALTH) === 1,
			poisonous: entity.getTag(GameTag.POISONOUS) === 1,
			venomous: entity.getTag(GameTag.VENOMOUS) === 1,
			reborn: entity.getTag(GameTag.REBORN) === 1,
			taunt: entity.getTag(GameTag.TAUNT) === 1,
			enchantments: entity['enchantments'],
			definitelyDead: false,
			immuneWhenAttackCharges: 0,
		};
	}

	private updateInfo() {
		if (!this._faceOff || !this._faceOff.battleInfo) {
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
