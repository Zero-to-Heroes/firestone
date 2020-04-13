import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Input,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { BgsPlayer } from '../../../models/battlegrounds/bgs-player';
import { BgsTavernUpgrade } from '../../../models/battlegrounds/in-game/bgs-tavern-upgrade';
import { BattleResult, OpponentInfo } from './opponent-info';

declare let amplitude: any;

@Component({
	selector: 'bgs-opponent-overview-big',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/battlegrounds/in-game/bgs-opponent-overview-big.component.scss`,
	],
	template: `
		<div class="opponent-overview">
			<div class="background-additions">
				<div class="top"></div>
				<div class="bottom"></div>
			</div>
			<div class="portrait">
				<bgs-hero-portrait
					class="icon"
					[icon]="_opponentInfo.icon"
					[health]="_opponentInfo.health"
					[maxHealth]="_opponentInfo.maxHealth"
					[cardTooltip]="_opponentInfo.heroPowerCardId"
					[cardTooltipText]="_opponentInfo.name"
					[cardTooltipClass]="'bgs-hero-power'"
				></bgs-hero-portrait>
				<!-- <div class="name">{{ _opponentInfo.name }}</div> -->
				<!-- <img [src]="taverTierIcon" class="tavern-tier" /> -->
				<tavern-level-icon [level]="_opponentInfo.tavernTier" class="tavern"></tavern-level-icon>
			</div>
			<div class="opponent-info">
				<div class="main-info">
					<bgs-board
						[entities]="_opponentInfo.boardMinions"
						[currentTurn]="currentTurn"
						[boardTurn]="_opponentInfo.boardTurn"
						[debug]="true"
						*ngIf="_opponentInfo.boardMinions"
					></bgs-board>
					<div class="bottom-info">
						<bgs-triples [opponentInfo]="_opponentInfo"></bgs-triples>
						<bgs-battle-status
							[nextBattle]="nextBattle"
							[battleSimulationStatus]="battleSimulationStatus"
						></bgs-battle-status>
					</div>
				</div>
				<div class="tavern-upgrades">
					<div class="title">Tavern upgrades</div>
					<div class="upgrades" *ngIf="_opponentInfo.tavernUpgrades?.length > 0">
						<div
							class="tavern-upgrade"
							*ngFor="let upgrade of _opponentInfo.tavernUpgrades; trackBy: trackByUpgradeFn"
						>
							<tavern-level-icon [level]="upgrade.tavernTier" class="tavern"></tavern-level-icon>
							<div class="label">Turn {{ upgrade.turn }}</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsOpponentOverviewBigComponent {
	_opponent: BgsPlayer;
	_opponentInfo: OpponentInfo;

	@Input() currentTurn: number;
	@Input() nextBattle: BattleResult;
	@Input() battleSimulationStatus: 'empty' | 'waiting-for-result' | 'done';

	// @Input() set opponentInfo(value: OpponentInfo) {
	@Input() set opponent(value: BgsPlayer) {
		if (value === this._opponent) {
			console.warn('using same big input', value, this._opponent);
			return;
		}
		// console.log('setting next opponent info', rdiff.getDiff(value, this._opponent), value, this._opponent);
		this._opponent = value;
		this._opponentInfo = {
			id: value.cardId,
			icon: `https://static.zerotoheroes.com/hearthstone/fullcard/en/256/battlegrounds/${value.cardId}.png`,
			heroPowerCardId: value.heroPowerCardId,
			name: value.name,
			health: value.initialHealth - value.damageTaken,
			maxHealth: value.initialHealth,
			tavernTier: '' + value.getCurrentTavernTier(),
			boardMinions: value.getLastKnownBoardState(),
			boardTurn: value.getLastBoardStateTurn(),
			tavernUpgrades: [...value.tavernUpgradeHistory],
			triples: [...value.tripleHistory],
			// isNextOpponent: opponent.cardId === this._panel.opponentOverview.cardId,
		} as OpponentInfo;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	constructor(private readonly cdr: ChangeDetectorRef, private el: ElementRef, private renderer: Renderer2) {}

	trackByUpgradeFn(index, item: BgsTavernUpgrade) {
		return item.tavernTier;
	}
}
