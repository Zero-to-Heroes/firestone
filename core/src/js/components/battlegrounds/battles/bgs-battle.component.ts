import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { GameTag } from '@firestone-hs/reference-data';
import { Entity } from '@firestone-hs/replay-parser';
import { BgsBattleInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-battle-info';
import { BgsBoardInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-board-info';
import { BgsPlayerEntity } from '@firestone-hs/simulate-bgs-battle/dist/bgs-player-entity';
import { BoardEntity } from '@firestone-hs/simulate-bgs-battle/dist/board-entity';
import { BgsFaceOffWithSimulation } from '../../../models/battlegrounds/bgs-face-off-with-simulation';
import { AdService } from '../../../services/ad.service';
import { BgsBattleSimulationService } from '../../../services/battlegrounds/bgs-battle-simulation.service';
import { OverwolfService } from '../../../services/overwolf.service';
import { PreferencesService } from '../../../services/preferences.service';

declare let amplitude;
@Component({
	selector: 'bgs-battle',
	styleUrls: [
		`../../../../css/global/reset-styles.scss`,
		`../../../../css/global/scrollbar.scss`,
		`../../../../css/component/battlegrounds/battles/bgs-battle.component.scss`,
	],
	template: `
		<div class="bgs-battle">
			<div class="turn-label">
				<div class="turn">Turn {{ turnNumber }}</div>
				<div class="result {{ actualResult }}" *ngIf="actualResult">{{ actualResult }}</div>
			</div>
			<div class="battle-content">
				<div class="battle-boards">
					<bgs-battle-side
						class="opponent"
						[player]="opponent"
						(entitiesUpdated)="onOpponentEntitiesUpdated($event)"
					></bgs-battle-side>
					<div class="versus">Vs.</div>
					<bgs-battle-side
						class="player"
						[player]="player"
						(entitiesUpdated)="onPlayerEntitiesUpdated($event)"
					></bgs-battle-side>
				</div>
				<div class="simulations">
					<div class="result actual">
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
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsBattleComponent implements AfterViewInit {
	@Input() set faceOff(value: BgsFaceOffWithSimulation) {
		this._faceOff = value;
		this.updateInfo();
	}

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

	constructor(
		private readonly simulationService: BgsBattleSimulationService,
		private readonly prefs: PreferencesService,
		private readonly cdr: ChangeDetectorRef,
		private readonly adService: AdService,
		private readonly ow: OverwolfService,
	) {}

	async ngAfterViewInit() {
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
		};
	}

	private updateInfo() {
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
