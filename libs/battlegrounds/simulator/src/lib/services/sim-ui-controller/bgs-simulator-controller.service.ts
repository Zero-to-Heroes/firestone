/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { EventEmitter, Injectable } from '@angular/core';
import { CardIds } from '@firestone-hs/reference-data';
import { Entity } from '@firestone-hs/replay-parser';
import { BoardEntity } from '@firestone-hs/simulate-bgs-battle/dist/board-entity';
import { BgsFaceOffWithSimulation } from '@firestone/battlegrounds/common';
import { BehaviorSubject } from 'rxjs';
import { StateManagerService } from './state-manager.service';

// TODO: store the full battle state here?
@Injectable()
export class BgsSimulatorControllerService {
	public faceOff$$ = new BehaviorSubject<BgsFaceOffWithSimulation | null>(null);

	public portraitChangeRequested: EventEmitter<HeroChangeRequest> = new EventEmitter<HeroChangeRequest>();
	public heroPowerChangeRequested: EventEmitter<HeroPowerChangeRequest> = new EventEmitter<HeroPowerChangeRequest>();
	public questRewardChangeRequested: EventEmitter<QuestRewardChangeRequest> =
		new EventEmitter<QuestRewardChangeRequest>();
	public minionAddRequested: EventEmitter<MinionAddRequest> = new EventEmitter<MinionAddRequest>();
	public minionUpdateRequested: EventEmitter<MinionUpdateRequest> = new EventEmitter<MinionUpdateRequest>();
	public minionRemoveRequested: EventEmitter<MinionRemoveRequest> = new EventEmitter<MinionRemoveRequest>();

	constructor(private readonly stateManager: StateManagerService) {}

	public initBattleWithSideEffects(battle: BgsFaceOffWithSimulation) {
		const faceOff = this.stateManager.buildInitialBattle(battle);
		this.faceOff$$.next(faceOff);
		return faceOff;
	}

	public resetBattle(battle: BgsFaceOffWithSimulation) {
		this.faceOff$$.next(battle);
	}

	public requestHeroChange(side: Side) {
		this.portraitChangeRequested.next({
			side: side,
			heroCardId: this.getSide(side)?.player.cardId ?? CardIds.Kelthuzad_TB_BaconShop_HERO_KelThuzad,
		});
	}
	public updateHero(side: Side, heroCardId: string) {
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
		const faceOff = this.stateManager.updateHeroPower(this.faceOff$$.value!, side, heroPowerCardId, heroPowerInfo);
		this.faceOff$$.next(faceOff);
	}

	public requestQuestRewardChange(side: Side) {
		this.questRewardChangeRequested.next({
			side: side,
			questRewardCardIds: this.getSide(side)?.player.questRewards ?? [],
		});
	}
	public updateQuestRewards(side: Side, questRewardCardId: string | null) {
		const faceOff = this.stateManager.updateQuestReward(this.faceOff$$.value!, side, questRewardCardId);
		this.faceOff$$.next(faceOff);
	}

	public requestAddMinion(side: Side) {
		this.minionAddRequested.next({
			side: side,
			entityId: this.getNextEntityId(),
		});
	}
	public addMinion(side: Side, entity: BoardEntity) {
		const faceOff = this.stateManager.addMinion(this.faceOff$$.value!, side, entity);
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
		const faceOff = this.stateManager.removeMinion(this.faceOff$$.value!, side, index);
		this.faceOff$$.next(faceOff);
	}

	public updateBoard(side: Side, newBoard: readonly Entity[]) {
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
export interface HeroPowerChangeRequest {
	side: Side;
	heroPowerCardId: string | null;
	heroPowerInfo: number;
}
export interface QuestRewardChangeRequest {
	side: Side;
	questRewardCardIds: readonly string[];
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
