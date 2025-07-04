/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-mixed-spaces-and-tabs */
import { Overlay, OverlayPositionBuilder, OverlayRef, PositionStrategy } from '@angular/cdk/overlay';
import { ComponentPortal, ComponentType } from '@angular/cdk/portal';
import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ComponentRef,
	HostListener,
	Input,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { TrinketSlot } from '@firestone-hs/reference-data';
import { BgsBattleInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-battle-info';
import { BgsBoardInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-board-info';
import { BgsPlayerGlobalInfo, BoardTrinket } from '@firestone-hs/simulate-bgs-battle/dist/bgs-player-entity';
import { BoardEntity } from '@firestone-hs/simulate-bgs-battle/dist/board-entity';
import { BgsBattleSimulationService } from '@firestone/battlegrounds/core';
import { BgsFaceOffWithSimulation } from '@firestone/game-state';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import {
	ApiRunner,
	CardsFacadeService,
	ILocalizationService,
	OverwolfService,
	waitForReady,
} from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { PermutationResult, ProcessingStatus } from '../services/bgs-battle-positioning-executor.service';
import { BgsBattlePositioningService } from '../services/bgs-battle-positioning.service';
import {
	BgsSimulatorControllerService,
	GlobalInfoChangeRequest,
	HeroChangeRequest,
	HeroPowerChangeRequest,
	MinionAddRequest,
	MinionRemoveRequest,
	MinionUpdateRequest,
	QuestRewardChangeRequest,
	TrinketChangeRequest,
} from '../services/sim-ui-controller/bgs-simulator-controller.service';
import {
	BgsSimulatorKeyboardControl,
	BgsSimulatorKeyboardControls,
} from '../services/simulator-keyboard-controls.service';
import { BgsSimulatorGlobalInfoSelectionComponent } from './bgs-simulator-global-info-selection.component';
import { BgsSimulatorHeroPowerSelectionComponent } from './bgs-simulator-hero-power-selection.component';
import { BgsSimulatorHeroSelectionComponent } from './bgs-simulator-hero-selection.component';
import { BgsSimulatorMinionSelectionComponent } from './bgs-simulator-minion-selection.component';
import { BgsSimulatorQuestRewardSelectionComponent } from './bgs-simulator-quest-reward-selection.component';
import { BgsSimulatorTrinketSelectionComponent } from './bgs-simulator-trinket-selection.component';

@Component({
	selector: 'bgs-simulator',
	styleUrls: [`./bgs-simulator.component.scss`],
	template: `
		<div class="battle-simulator">
			<div class="battle-boards">
				<bgs-simulator-side
					class="side opponent"
					[player]="opponent$ | async"
					[teammate]="opponentTeammate$ | async"
					[side]="'opponent'"
					[tooltipPosition]="'right'"
				></bgs-simulator-side>
				<div class="simulations">
					<div class="controls">
						<div
							class="button simulate"
							[ngClass]="{ disabled: simulateButtonDisabled }"
							(click)="simulateWinOdds()"
							[helpTooltip]="tooltip"
						>
							{{ simulateButtonLabel }}
						</div>
					</div>
					<div class="result new">
						<bgs-battle-status
							[showReplayLink]="true"
							[nextBattle]="battleResult$ | async"
							[forceHidePremiumBanner]="true"
						></bgs-battle-status>
					</div>
					<div
						class="controls position"
						[ngClass]="{ busy: processingReposition }"
						*ngIf="(isDuos$ | async) === false"
					>
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
				<bgs-simulator-side
					class="side player"
					[player]="player$ | async"
					[teammate]="playerTeammate$ | async"
					[side]="'player'"
					[tooltipPosition]="'top-right'"
				></bgs-simulator-side>
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
				<div class="button clear" (click)="clearBoards()">
					<div class="icon" inlineSVG="assets/svg/bin.svg"></div>
					<div class="text" [fsTranslate]="'battlegrounds.sim.clear-button'"></div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsSimulatorComponent extends AbstractSubscriptionComponent implements AfterViewInit, OnDestroy {
	battleResult$: Observable<BgsFaceOffWithSimulation | null>;
	opponent$: Observable<BgsBoardInfo | null>;
	opponentTeammate$: Observable<BgsBoardInfo | null>;
	player$: Observable<BgsBoardInfo | null>;
	playerTeammate$: Observable<BgsBoardInfo | null>;
	turnNumber$: Observable<number | null>;
	isDuos$: Observable<boolean>;

	@Input() set faceOff(value: BgsFaceOffWithSimulation) {
		// Because it's already set in the controller state
		// this.setInitialBattle(value);
	}

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

	private overlayRef: OverlayRef;
	private positionStrategy: PositionStrategy;

	private sub$$: Subscription;
	private battleResult$$ = new BehaviorSubject<BgsFaceOffWithSimulation | null>(null);

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly simulationService: BgsBattleSimulationService,
		private readonly positioningService: BgsBattlePositioningService,
		private readonly prefs: PreferencesService,
		private readonly i18n: ILocalizationService,
		private readonly overlay: Overlay,
		private readonly overlayPositionBuilder: OverlayPositionBuilder,
		private readonly ow: OverwolfService,
		private readonly api: ApiRunner,
		private readonly allCards: CardsFacadeService,
		private readonly simulatorKeyboardControls: BgsSimulatorKeyboardControls,
		private readonly controller: BgsSimulatorControllerService,
	) {
		super(cdr);
	}

	async ngAfterViewInit() {
		await waitForReady(this.controller);

		this.tooltip = this.i18n.translateString('battlegrounds.sim.simulate-button-tooltip');
		this.positionStrategy = this.overlayPositionBuilder.global().centerHorizontally().centerVertically();
		this.overlayRef = this.overlay.create({ positionStrategy: this.positionStrategy, hasBackdrop: true });
		this.sub$$ = this.overlayRef.backdropClick().subscribe(() => {
			this.overlayRef.detach();
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		});

		this.battleResult$ = this.battleResult$$.asObservable();
		this.opponent$ = this.controller.faceOff$$.pipe(
			this.mapData((faceOff) => faceOff?.battleInfo?.opponentBoard ?? null),
		);
		this.opponentTeammate$ = this.controller.faceOff$$.pipe(
			this.mapData((faceOff) => faceOff?.battleInfo?.opponentTeammateBoard ?? null),
		);
		this.player$ = this.controller.faceOff$$.pipe(
			this.mapData((faceOff) => faceOff?.battleInfo?.playerBoard ?? null),
		);
		this.playerTeammate$ = this.controller.faceOff$$.pipe(
			this.mapData((faceOff) => faceOff?.battleInfo?.playerTeammateBoard ?? null),
		);
		this.turnNumber$ = this.controller.faceOff$$.pipe(this.mapData((faceOff) => faceOff?.turn ?? null));
		this.isDuos$ = this.controller.faceOff$$.pipe(
			this.mapData(
				(faceOff) =>
					(!!faceOff?.battleInfo?.playerTeammateBoard || !!faceOff?.battleInfo?.opponentTeammateBoard) ??
					false,
			),
		);

		this.initControllerRequests();

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@HostListener('window:beforeunload')
	override ngOnDestroy() {
		super.ngOnDestroy();
		this.simulatorKeyboardControls.tearDown();
		this.sub$$?.unsubscribe();
	}

	private async setInitialBattle(value: BgsFaceOffWithSimulation) {
		await waitForReady(this.controller);
		this.controller.initBattleWithSideEffects(value);
	}

	// TODO: adding minions to both boards lead to some lost info
	private initControllerRequests() {
		this.controller.portraitChangeRequested.subscribe((request) => this.onPortraitChangeRequested(request));
		this.controller.heroPowerChangeRequested.subscribe((request) => this.onHeroPowerChangeRequested(request));
		this.controller.globalInfoChangeRequested.subscribe((request) => this.onGlobalInfoChangeRequested(request));
		this.controller.questRewardChangeRequested.subscribe((request) => this.onQuestRewardChangeRequested(request));
		this.controller.greaterTrinketChangeRequested.subscribe((request) =>
			this.onGreaterTrinketChangeRequested(request),
		);
		this.controller.lesserTrinketChangeRequested.subscribe((request) =>
			this.onLesserTrinketChangeRequested(request),
		);
		this.controller.minionAddRequested.subscribe((request) => this.onMinionAddRequested(request));
		this.controller.minionUpdateRequested.subscribe((request) => this.onMinionUpdateRequested(request));
		this.controller.minionRemoveRequested.subscribe((request) => this.onMinionRemoveRequested(request));

		this.simulatorKeyboardControls
			.init(true)
			.control(BgsSimulatorKeyboardControl.PlayerHero, () => this.controller.requestHeroChange('player'))
			.control(BgsSimulatorKeyboardControl.OpponentHero, () => this.controller.requestHeroChange('opponent'))
			.control(BgsSimulatorKeyboardControl.PlayerHeroPower, () =>
				this.controller.requestHeroPowerChange('player'),
			)
			.control(BgsSimulatorKeyboardControl.OpponentHeroPower, () =>
				this.controller.requestHeroPowerChange('opponent'),
			)
			.control(BgsSimulatorKeyboardControl.PlayerQuestReward, () =>
				this.controller.requestQuestRewardChange('player'),
			)
			.control(BgsSimulatorKeyboardControl.OpponentQuestReward, () =>
				this.controller.requestQuestRewardChange('opponent'),
			)
			.control(BgsSimulatorKeyboardControl.PlayerAddMinion, () => this.controller.requestAddMinion('player'))
			.control(BgsSimulatorKeyboardControl.OpponentAddMinion, () => this.controller.requestAddMinion('opponent'));
	}

	@HostListener('document:keyup', ['$event'])
	handleKeyboardControl(event: KeyboardEvent) {
		// Control is back to the overlay
		if (this.overlayRef.hasAttached()) {
			return;
		}
		this.simulatorKeyboardControls.handleKeyDown(event);
	}

	// onUndeadArmyChanged(side: 'player' | 'opponent', newValue: number) {
	// 	const request =
	// 		side === 'player'
	// 			? ({
	// 					battleInfo: {
	// 						playerBoard: {
	// 							player: {
	// 								globalInfo: {
	// 									UndeadAttackBonus: newValue,
	// 								},
	// 							},
	// 						},
	// 					},
	// 			  } as BgsFaceOffWithSimulation)
	// 			: ({
	// 					battleInfo: {
	// 						opponentBoard: {
	// 							player: {
	// 								globalInfo: {
	// 									UndeadAttackBonus: newValue,
	// 								},
	// 							},
	// 						},
	// 					},
	// 			  } as BgsFaceOffWithSimulation);
	// 	console.debug('updating undead army', side, newValue, request);
	// 	this.simulationUpdater(this._faceOff, request);
	// }

	// onEternalLegionChanged(side: 'player' | 'opponent', newValue: number) {
	// 	const request =
	// 		side === 'player'
	// 			? ({
	// 					battleInfo: {
	// 						playerBoard: {
	// 							player: {
	// 								globalInfo: {
	// 									EternalKnightsDeadThisGame: newValue,
	// 								},
	// 							},
	// 						},
	// 					},
	// 			  } as BgsFaceOffWithSimulation)
	// 			: ({
	// 					battleInfo: {
	// 						opponentBoard: {
	// 							player: {
	// 								globalInfo: {
	// 									EternalKnightsDeadThisGame: newValue,
	// 								},
	// 							},
	// 						},
	// 					},
	// 			  } as BgsFaceOffWithSimulation);
	// 	console.debug('updating eternal legion', side, newValue, request);
	// 	this.simulationUpdater(this._faceOff, request);
	// }

	onPortraitChangeRequested(request: HeroChangeRequest) {
		const modalRef = this.createModal(BgsSimulatorHeroSelectionComponent);
		modalRef.instance.currentHero = request.heroCardId;
		modalRef.instance.applyHandler = (newHeroCardId: string) => {
			this.overlayRef.detach();
			this.controller.updateHero(request.side, newHeroCardId);
		};
	}

	onGlobalInfoChangeRequested(request: GlobalInfoChangeRequest) {
		const modalRef = this.createModal(BgsSimulatorGlobalInfoSelectionComponent);
		modalRef.instance.currentGlobalInfo = request.globalInfo;
		modalRef.instance.applyHandler = (newGlobalInfo: BgsPlayerGlobalInfo | null) => {
			this.overlayRef.detach();
			this.controller.updateGlobalInfo(request.side, newGlobalInfo);
		};
	}

	onHeroPowerChangeRequested(request: HeroPowerChangeRequest) {
		const modalRef = this.createModal(BgsSimulatorHeroPowerSelectionComponent);
		modalRef.instance.currentHeroPower = request.heroPowerCardId;
		modalRef.instance.heroPowerData = request.heroPowerInfo;
		modalRef.instance.applyHandler = (newHeroPowerCardId: string | null, heroPowerInfo: number) => {
			this.overlayRef.detach();
			this.controller.updateHeroPower(request.side, newHeroPowerCardId, heroPowerInfo);
		};
	}

	onGreaterTrinketChangeRequested(request: TrinketChangeRequest) {
		const modalRef = this.createModal(BgsSimulatorTrinketSelectionComponent);
		modalRef.instance.currentTrinket = request.trinket;
		modalRef.instance.trinketSlot = TrinketSlot.GREATER;
		modalRef.instance.applyHandler = (newTrinket: BoardTrinket | null) => {
			this.overlayRef.detach();
			this.controller.updateGreaterTrinket(request.side, newTrinket);
		};
	}

	onLesserTrinketChangeRequested(request: TrinketChangeRequest) {
		const modalRef = this.createModal(BgsSimulatorTrinketSelectionComponent);
		modalRef.instance.currentTrinket = request.trinket;
		modalRef.instance.trinketSlot = TrinketSlot.LESSER;
		modalRef.instance.applyHandler = (newTrinket: BoardTrinket | null) => {
			this.overlayRef.detach();
			this.controller.updateLesserTrinket(request.side, newTrinket);
		};
	}

	onQuestRewardChangeRequested(request: QuestRewardChangeRequest) {
		const modalRef = this.createModal(BgsSimulatorQuestRewardSelectionComponent);
		modalRef.instance.currentReward = request.questRewardCardIds?.[0] ?? null;
		modalRef.instance.applyHandler = (newQuestRewardId: string | null) => {
			this.overlayRef.detach();
			this.controller.updateQuestRewards(request.side, newQuestRewardId);
		};
	}

	onMinionAddRequested(request: MinionAddRequest) {
		const modalRef = this.createModal(BgsSimulatorMinionSelectionComponent);
		modalRef.instance.currentMinion = null;
		modalRef.instance.entityId = request.entityId;
		modalRef.instance.applyHandler = (newEntity: BoardEntity) => {
			this.overlayRef.detach();
			this.controller.addMinion(request.side, newEntity);
		};
	}

	onMinionUpdateRequested(request: MinionUpdateRequest) {
		const modalRef = this.createModal(BgsSimulatorMinionSelectionComponent);
		modalRef.instance.currentMinion = request.entity;
		modalRef.instance.entityId = request.entity?.entityId ?? 1;
		modalRef.instance.applyHandler = (newEntity: BoardEntity) => {
			this.overlayRef.detach();
			this.controller.updateMinion(request.side, request.index, newEntity);
		};
	}

	onMinionRemoveRequested(request: MinionRemoveRequest) {
		this.controller.removeMinion(request.side, request.index);
	}

	clearBoards() {
		this.controller.clearBattle();
	}

	resetBoards() {
		this.controller.resetBattle();
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
			this.controller.initBattleWithSideEffects(faceOff);
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
			...this.controller.faceOff$$.value,
			battleResult: undefined,
			battleInfoStatus: undefined,
			battleInfoMesage: undefined,
		} as BgsFaceOffWithSimulation;
		const code = btoa(JSON.stringify(sim));
		const shortCode = await this.simulationService.getIdForSimulationSample(code as any);
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

	async simulateWinOdds() {
		if (this.simulateButtonDisabled || !this.controller.faceOff$$.value?.battleInfo) {
			return;
		}

		this.battleResult$$.next(
			BgsFaceOffWithSimulation.create({
				battleInfoStatus: 'waiting-for-result',
				battleResult: undefined,
			}),
		);
		this.simulateButtonLabel = this.i18n.translateString('battlegrounds.sim.simulating-button');
		this.simulateButtonDisabled = true;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}

		const prefs = await this.prefs.getPreferences();
		const battleInfo: BgsBattleInfo = {
			...this.controller.faceOff$$.value.battleInfo,
			options: {
				...this.controller.faceOff$$.value.battleInfo?.options,
				numberOfSimulations: prefs.bgsSimulatorNumberOfSims ?? 8000,
				maxAcceptableDuration: prefs.bgsSimulatorMaxDurationInMillis ?? 8000,
			},
			gameState: {
				...this.controller.faceOff$$.value.battleInfo.gameState,
				// No restrictions on tribes yet
				validTribes: undefined,
				currentTurn: 0,
			},
		};
		console.log('[bgs-simulation-desktop] battle simulation request prepared');
		console.debug('no-format', '[bgs-simulation-desktop] battle simulation request prepared', battleInfo);
		this.simulationService.simulateLocalBattle(battleInfo, prefs, true, (newSim) => {
			if (!!newSim) {
				const intermediateResult = !newSim.outcomeSamples;
				this.battleResult$$.next(
					BgsFaceOffWithSimulation.create({
						battleInfoStatus: intermediateResult ? 'ongoing' : 'done',
						battleResult: newSim ?? undefined,
					}),
				);
				if (!intermediateResult) {
					console.log('no-format', '[bgs-simulation-desktop] battle simulation result', newSim);
					this.simulateButtonLabel = this.i18n.translateString('battlegrounds.sim.simulate-button');
					this.simulateButtonDisabled = false;
				}
			}
		});
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
		this.repositionButtonTooltipKey = 'battlegrounds.sim.reposition-button-tooltip';
	}

	async findBestPositioning() {
		if (this.processingReposition) {
			this.cancelPositioning();
			return;
		}

		if (!this.controller.faceOff$$.value?.battleInfo) {
			return;
		}

		this.processingReposition = true;
		this.battleResult$$.next(
			BgsFaceOffWithSimulation.create({
				battleInfoStatus: 'waiting-for-result',
				battleResult: undefined,
			}),
		);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}

		const prefs = await this.prefs.getPreferences();
		const battleInfo: BgsBattleInfo = {
			...this.controller.faceOff$$.value.battleInfo,
			options: {
				...this.controller.faceOff$$.value.battleInfo?.options,
				numberOfSimulations: prefs.bgsSimulatorNumberOfSims ?? 8000,
				maxAcceptableDuration: prefs.bgsSimulatorMaxDurationInMillis ?? 6000,
			},
			gameState: {
				...this.controller.faceOff$$.value.battleInfo.gameState,
				// No restrictions on tribes yet
				validTribes: undefined,
				currentTurn: 0,
			},
		};
		console.log('no-format', '[bgs-simulation-desktop] battle simulation request prepared', battleInfo);
		const it = this.positioningService.findBestPositioning(battleInfo);
		// eslint-disable-next-line no-constant-condition
		while (true) {
			const value = await it.next();
			const status: ProcessingStatus = value.value[0];
			const result: PermutationResult = value.value[1];
			if (!!result) {
				this.battleResult$$.next(
					BgsFaceOffWithSimulation.create({
						battleInfoStatus: 'done',
						battleInfo: result.battleInfo,
						battleResult: result.result,
					}),
				);
				this.controller.initBattleWithSideEffects(
					BgsFaceOffWithSimulation.create({
						battleInfoStatus: 'done',
						battleInfo: result.battleInfo,
						battleResult: result.result,
					}),
				);
				this.processingReposition = false;
				this.repositionButtonTextKey = 'battlegrounds.sim.reposition-button';
				this.repositionButtonTooltipKey = 'battlegrounds.sim.reposition-button-tooltip';
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
	}

	private createModal<T extends SimulatorModal>(type: ComponentType<T>): ComponentRef<T> {
		const portal = new ComponentPortal(type);
		const modalRef = this.overlayRef.attach(portal);
		modalRef.instance.closeHandler = () => {
			this.overlayRef.detach();
			// if (!(this.cdr as ViewRef)?.destroyed) {
			// 	this.cdr.detectChanges();
			// }
		};
		this.positionStrategy.apply();
		return modalRef;
	}
}

interface SimulatorModal {
	closeHandler: () => void;
}
