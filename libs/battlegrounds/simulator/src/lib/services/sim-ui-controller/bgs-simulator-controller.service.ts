/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { EventEmitter, Injectable } from '@angular/core';
import { CardIds, TrinketSlot } from '@firestone-hs/reference-data';
import { BgsPlayerGlobalInfo, BoardTrinket } from '@firestone-hs/simulate-bgs-battle/dist/bgs-player-entity';
import type { BoardEntity } from '@firestone-hs/simulate-bgs-battle/dist/board-entity';
import { BgsFaceOffWithSimulation } from '@firestone/game-state';
import { Entity } from '@firestone/replay/replay-parser';
import {
	AbstractFacadeService,
	AppInjector,
	CardsFacadeService,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';
import { StateManagerService } from './state-manager.service';

@Injectable()
export class BgsSimulatorControllerService extends AbstractFacadeService<BgsSimulatorControllerService> {
	public faceOff$$: BehaviorSubject<BgsFaceOffWithSimulation | null>;

	public portraitChangeRequested: EventEmitter<HeroChangeRequest> = new EventEmitter<HeroChangeRequest>();
	public globalInfoChangeRequested: EventEmitter<GlobalInfoChangeRequest> =
		new EventEmitter<GlobalInfoChangeRequest>();
	public heroPowerChangeRequested: EventEmitter<HeroPowerChangeRequest> = new EventEmitter<HeroPowerChangeRequest>();
	public questRewardChangeRequested: EventEmitter<QuestRewardChangeRequest> =
		new EventEmitter<QuestRewardChangeRequest>();
	public greaterTrinketChangeRequested: EventEmitter<TrinketChangeRequest> = new EventEmitter<TrinketChangeRequest>();
	public lesserTrinketChangeRequested: EventEmitter<TrinketChangeRequest> = new EventEmitter<TrinketChangeRequest>();
	public minionAddRequested: EventEmitter<MinionAddRequest> = new EventEmitter<MinionAddRequest>();
	public minionUpdateRequested: EventEmitter<MinionUpdateRequest> = new EventEmitter<MinionUpdateRequest>();
	public minionRemoveRequested: EventEmitter<MinionRemoveRequest> = new EventEmitter<MinionRemoveRequest>();

	private stateManager: StateManagerService;
	private allCards: CardsFacadeService;

	private initialBattle: BgsFaceOffWithSimulation | null;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'BgsSimulatorControllerService', () => !!this.faceOff$$);
	}

	protected override assignSubjects() {
		this.faceOff$$ = this.mainInstance.faceOff$$;
	}

	protected async init() {
		this.allCards = AppInjector.get(CardsFacadeService);
		this.stateManager = AppInjector.get(StateManagerService);
		await this.allCards.waitForReady();

		this.faceOff$$ = new BehaviorSubject<BgsFaceOffWithSimulation | null>(
			this.stateManager.buildInitialBattle(null),
		);
		this.faceOff$$.subscribe((faceOff) => console.debug('[simulator] updated faceOff', faceOff));
	}

	protected override initElectronSubjects(): void {
		this.setupElectronSubject(this.faceOff$$, 'BgsSimulatorControllerService-faceOff');
	}

	protected override createElectronProxy(ipcRenderer: any): void | Promise<void> {
		this.faceOff$$ = new BehaviorSubject<BgsFaceOffWithSimulation | null>(null);
	}

	protected override async initElectronMainProcess(): Promise<void> {
		this.registerMainProcessMethod(
			'initBattleWithSideEffectsInternal',
			(battle: BgsFaceOffWithSimulation, setInitialBattle: boolean = true) =>
				this.initBattleWithSideEffectsInternal(battle, setInitialBattle),
		);
		this.registerMainProcessMethod('setInitialBattleInternal', (battle: BgsFaceOffWithSimulation) =>
			this.setInitialBattleInternal(battle),
		);
		this.registerMainProcessMethod('resetBattleInternal', () => this.resetBattleInternal());
		this.registerMainProcessMethod('clearBattleInternal', () => this.clearBattleInternal());
		this.registerMainProcessMethod('updateHeroInternal', (side: Side, heroCardId: string) =>
			this.updateHeroInternal(side, heroCardId),
		);
		this.registerMainProcessMethod(
			'updateHeroPowerInternal',
			(side: Side, heroPowerCardId: string | null, heroPowerInfo: number) =>
				this.updateHeroPowerInternal(side, heroPowerCardId, heroPowerInfo),
		);
		this.registerMainProcessMethod('updateGlobalInfoInternal', (side: Side, globalInfo: BgsPlayerGlobalInfo | null) =>
			this.updateGlobalInfoInternal(side, globalInfo),
		);
		this.registerMainProcessMethod('updateQuestRewardsInternal', (side: Side, questRewardCardId: string | null) =>
			this.updateQuestRewardsInternal(side, questRewardCardId),
		);
		this.registerMainProcessMethod('updateGreaterTrinketInternal', (side: Side, trinket: BoardTrinket | null) =>
			this.updateGreaterTrinketInternal(side, trinket),
		);
		this.registerMainProcessMethod('updateLesserTrinketInternal', (side: Side, trinket: BoardTrinket | null) =>
			this.updateLesserTrinketInternal(side, trinket),
		);
		this.registerMainProcessMethod('addMinionInternal', (side: Side, entity: BoardEntity) =>
			this.addMinionInternal(side, entity),
		);
		this.registerMainProcessMethod('addTeammateInternal', (side: Side) => this.addTeammateInternal(side));
		this.registerMainProcessMethod('removeTeammateInternal', (side: Side) => this.removeTeammateInternal(side));
		this.registerMainProcessMethod('switchTeammatesInternal', (side: Side) => this.switchTeammatesInternal(side));
		this.registerMainProcessMethod('updateMinionInternal', (side: Side, index: number, entity: BoardEntity | null) =>
			this.updateMinionInternal(side, index, entity),
		);
		this.registerMainProcessMethod('removeMinionInternal', (side: Side, index: number) =>
			this.removeMinionInternal(side, index),
		);
		this.registerMainProcessMethod('updateBoardInternal', (side: Side, newBoard: readonly Entity[]) =>
			this.updateBoardInternal(side, newBoard),
		);
	}

	public initBattleWithSideEffects(battle: BgsFaceOffWithSimulation, setInitialBattle: boolean = true) {
		void this.callOnMainProcess('initBattleWithSideEffectsInternal', battle, setInitialBattle);
	}
	private initBattleWithSideEffectsInternal(battle: BgsFaceOffWithSimulation, setInitialBattle: boolean = true) {
		console.debug('[simulator] initBattleWithSideEffects', battle);
		const faceOff = this.stateManager.buildInitialBattle(battle);
		this.faceOff$$.next(faceOff);
		if (setInitialBattle) {
			this.initialBattle = faceOff;
		}
		return faceOff;
	}

	public setInitialBattle(battle: BgsFaceOffWithSimulation) {
		void this.callOnMainProcess('setInitialBattleInternal', battle);
	}
	private setInitialBattleInternal(battle: BgsFaceOffWithSimulation) {
		this.initialBattle = battle;
	}

	public resetBattle() {
		void this.callOnMainProcess('resetBattleInternal');
	}
	private resetBattleInternal() {
		this.faceOff$$.next(this.initialBattle ?? this.stateManager.buildInitialBattle(null));
	}

	public clearBattle() {
		void this.callOnMainProcess('clearBattleInternal');
	}
	private clearBattleInternal() {
		this.faceOff$$.next(this.stateManager.buildInitialBattle(null));
	}

	public requestHeroChange(side: Side) {
		this.portraitChangeRequested.next({
			side: side,
			heroCardId: this.getSide(side)?.player.cardId ?? CardIds.Kelthuzad_TB_BaconShop_HERO_KelThuzad,
		});
	}
	public updateHero(side: Side, heroCardId: string) {
		void this.callOnMainProcess('updateHeroInternal', side, heroCardId);
	}
	private updateHeroInternal(side: Side, heroCardId: string) {
		const faceOff = this.stateManager.updateHero(this.faceOff$$.value!, side, heroCardId);
		this.faceOff$$.next(faceOff);
	}

	public requestHeroPowerChange(side: Side) {
		this.heroPowerChangeRequested.next({
			side: side,
			heroPowerCardId: this.getSide(side)?.player.heroPowerId ?? null,
			heroPowerInfo: +(this.getSide(side)?.player.heroPowerInfo ?? 0),
		});
	}
	public updateHeroPower(side: Side, heroPowerCardId: string | null, heroPowerInfo: number) {
		void this.callOnMainProcess('updateHeroPowerInternal', side, heroPowerCardId, heroPowerInfo);
	}
	private updateHeroPowerInternal(side: Side, heroPowerCardId: string | null, heroPowerInfo: number) {
		const faceOff = this.stateManager.updateHeroPower(this.faceOff$$.value!, side, heroPowerCardId, heroPowerInfo);
		this.faceOff$$.next(faceOff);
	}

	public requestGlobalInfoChange(side: Side) {
		this.globalInfoChangeRequested.next({
			side: side,
			globalInfo: this.getSide(side)?.player.globalInfo,
		});
	}
	public updateGlobalInfo(side: Side, globalInfo: BgsPlayerGlobalInfo | null) {
		void this.callOnMainProcess('updateGlobalInfoInternal', side, globalInfo);
	}
	private updateGlobalInfoInternal(side: Side, globalInfo: BgsPlayerGlobalInfo | null) {
		const faceOff = this.stateManager.updateGlobalInfo(this.faceOff$$.value!, side, globalInfo);
		this.faceOff$$.next(faceOff);
	}

	public requestQuestRewardChange(side: Side) {
		this.questRewardChangeRequested.next({
			side: side,
			questRewardCardIds: this.getSide(side)?.player.questRewards ?? [],
		});
	}
	public updateQuestRewards(side: Side, questRewardCardId: string | null) {
		void this.callOnMainProcess('updateQuestRewardsInternal', side, questRewardCardId);
	}
	private updateQuestRewardsInternal(side: Side, questRewardCardId: string | null) {
		const faceOff = this.stateManager.updateQuestReward(this.faceOff$$.value!, side, questRewardCardId);
		this.faceOff$$.next(faceOff);
	}

	public requestGreaterTrinketChange(side: Side) {
		this.greaterTrinketChangeRequested.next({
			side: side,
			trinket: this.getSide(side)?.player.trinkets?.find((t) => t.scriptDataNum6 === TrinketSlot.GREATER),
		});
	}
	public updateGreaterTrinket(side: Side, trinket: BoardTrinket | null) {
		void this.callOnMainProcess('updateGreaterTrinketInternal', side, trinket);
	}
	private updateGreaterTrinketInternal(side: Side, trinket: BoardTrinket | null) {
		const faceOff = this.stateManager.updateGreaterTrinket(this.faceOff$$.value!, side, trinket);
		this.faceOff$$.next(faceOff);
	}

	public requestLesserTrinketChange(side: Side) {
		this.lesserTrinketChangeRequested.next({
			side: side,
			trinket: this.getSide(side)?.player.trinkets?.find((t) => t.scriptDataNum6 === TrinketSlot.LESSER),
		});
	}
	public updateLesserTrinket(side: Side, trinket: BoardTrinket | null) {
		void this.callOnMainProcess('updateLesserTrinketInternal', side, trinket);
	}
	private updateLesserTrinketInternal(side: Side, trinket: BoardTrinket | null) {
		const faceOff = this.stateManager.updateLesserTrinket(this.faceOff$$.value!, side, trinket);
		this.faceOff$$.next(faceOff);
	}

	public requestAddMinion(side: Side) {
		this.minionAddRequested.next({
			side: side,
			entityId: this.getNextEntityId(),
		});
	}
	public addMinion(side: Side, entity: BoardEntity) {
		void this.callOnMainProcess('addMinionInternal', side, entity);
	}
	private addMinionInternal(side: Side, entity: BoardEntity) {
		const faceOff = this.stateManager.addMinion(this.faceOff$$.value!, side, entity);
		this.faceOff$$.next(faceOff);
	}

	public addTeammate(side: Side) {
		void this.callOnMainProcess('addTeammateInternal', side);
	}
	private addTeammateInternal(side: Side) {
		const faceOff = this.stateManager.addTeammate(this.faceOff$$.value!, side);
		this.faceOff$$.next(faceOff);
	}

	public removeTeammate(side: Side) {
		void this.callOnMainProcess('removeTeammateInternal', side);
	}
	private removeTeammateInternal(side: Side) {
		const faceOff = this.stateManager.removeTeammate(this.faceOff$$.value!, side);
		this.faceOff$$.next(faceOff);
	}

	public switchTeammates(side: Side) {
		void this.callOnMainProcess('switchTeammatesInternal', side);
	}
	private switchTeammatesInternal(side: Side) {
		const faceOff = this.stateManager.switchTeammates(this.faceOff$$.value!, side);
		this.faceOff$$.next(faceOff);
	}

	public requestUpdateMinion(side: Side, index: number) {
		const entity = this.getSide(side)?.board[index] ?? null;
		this.minionUpdateRequested.next({
			side: side,
			index: index,
			entity: entity,
		});
	}
	public updateMinion(side: Side, index: number, entity: BoardEntity | null) {
		void this.callOnMainProcess('updateMinionInternal', side, index, entity);
	}
	private updateMinionInternal(side: Side, index: number, entity: BoardEntity | null) {
		const faceOff = this.stateManager.updateMinion(this.faceOff$$.value!, side, index, entity);
		this.faceOff$$.next(faceOff);
	}

	public requestRemoveMinion(side: Side, index: number) {
		this.minionRemoveRequested.next({
			side: side,
			index: index,
		});
	}
	public removeMinion(side: Side, index: number) {
		void this.callOnMainProcess('removeMinionInternal', side, index);
	}
	private removeMinionInternal(side: Side, index: number) {
		const faceOff = this.stateManager.removeMinion(this.faceOff$$.value!, side, index);
		this.faceOff$$.next(faceOff);
	}

	public updateBoard(side: Side, newBoard: readonly Entity[]) {
		void this.callOnMainProcess('updateBoardInternal', side, newBoard);
	}
	private updateBoardInternal(side: Side, newBoard: readonly Entity[]) {
		const faceOff = this.stateManager.updateBoard(this.faceOff$$.value!, side, newBoard);
		this.faceOff$$.next(faceOff);
	}

	private getSide(side: 'player' | 'opponent') {
		return side === 'player'
			? this.faceOff$$.value?.battleInfo?.playerBoard
			: this.faceOff$$.value?.battleInfo?.opponentBoard;
	}
	private getNextEntityId(): number {
		return this.faceOff$$.value?.getNextEntityId() ?? 1;
	}
}

export type Side = 'player' | 'opponent';
export interface HeroChangeRequest {
	side: Side;
	heroCardId: string;
}
export interface GlobalInfoChangeRequest {
	side: Side;
	globalInfo: BgsPlayerGlobalInfo | undefined;
}
export interface HeroPowerChangeRequest {
	side: Side;
	heroPowerCardId: string | null;
	heroPowerInfo: number;
}
export interface QuestRewardChangeRequest {
	side: Side;
	questRewardCardIds: readonly string[];
}
export interface TrinketChangeRequest {
	side: Side;
	trinket: BoardTrinket | null | undefined;
}
export interface MinionAddRequest {
	side: Side;
	entityId: number;
}
export interface MinionUpdateRequest {
	side: Side;
	index: number;
	entity: BoardEntity | null;
}
export interface MinionRemoveRequest {
	side: Side;
	index: number;
}
