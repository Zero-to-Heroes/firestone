import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Input,
	Renderer2,
} from '@angular/core';
import { BgsGame } from '../../../models/battlegrounds/bgs-game';
import { BgsPlayer } from '../../../models/battlegrounds/bgs-player';
import { BgsNextOpponentOverviewPanel } from '../../../models/battlegrounds/in-game/bgs-next-opponent-overview-panel';
import { OpponentFaceOff } from './opponent-face-off';
import { BattleResult, OpponentInfo } from './opponent-info';

declare let amplitude: any;

@Component({
	selector: 'bgs-next-opponent-overview',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/battlegrounds/in-game/bgs-next-opponent-overview.component.scss`,
		`../../../../css/global/scrollbar.scss`,
	],
	template: `
		<div class="container">
			<div class="left">
				<div class="title" helpTooltip="Recap of all the encounters you had with the other players">
					Score Board
				</div>
				<bgs-hero-face-offs [opponentFaceOffs]="opponentFaceOffs"></bgs-hero-face-offs>
			</div>
			<div class="content" *ngIf="opponents.length > 0">
				<bgs-opponent-overview-big
					[opponent]="opponents[0]"
					[currentTurn]="currentTurn"
					[nextBattle]="nextBattle"
					[battleSimulationStatus]="battleSimulationStatus"
				></bgs-opponent-overview-big>
				<div class="other-opponents">
					<div class="subtitle">Other opponents</div>
					<div class="opponents">
						<bgs-opponent-overview
							*ngFor="let opponentInfo of opponentInfos.slice(1); trackBy: trackByOpponentInfoFn"
							[opponentInfo]="opponentInfo"
							[currentTurn]="currentTurn"
						></bgs-opponent-overview>
					</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsNextOpponentOverviewComponent implements AfterViewInit {
	opponentInfos: readonly OpponentInfo[] = [];
	opponents: readonly BgsPlayer[];
	opponentFaceOffs: readonly OpponentFaceOff[];
	currentTurn: number;
	nextBattle: BattleResult;
	battleSimulationStatus: 'empty' | 'waiting-for-result' | 'done';

	private _panel: BgsNextOpponentOverviewPanel;
	private _game: BgsGame;

	@Input() set panel(value: BgsNextOpponentOverviewPanel) {
		this._panel = value;
		this.updateInfo();
	}

	@Input() set game(value: BgsGame) {
		this._game = value;
		this.updateInfo();
	}

	constructor(
		private readonly el: ElementRef,
		private readonly renderer: Renderer2,
		private readonly cdr: ChangeDetectorRef,
	) {}

	async ngAfterViewInit() {
		console.log('after view init');
	}

	previousFirstBoardWidth: number;

	// @HostListener('window:resize')
	trackByOpponentInfoFn(index, item: OpponentInfo) {
		return item.id;
	}

	private updateInfo() {
		if (!this._panel || !this._game || !this._panel.opponentOverview) {
			return;
		}
		this.currentTurn = this._game.currentTurn;
		const nextOpponent = this._game.players.find(player => player.cardId === this._panel.opponentOverview.cardId);
		if (!nextOpponent) {
			return;
		}
		// console.log('next opponent', nextOpponent?.getLastBoardStateTurn());
		const opponents = this._game.players
			.filter(player => !player.isMainPlayer)
			.sort((a, b) => {
				if (a.leaderboardPlace < b.leaderboardPlace) {
					return -1;
				}
				if (b.leaderboardPlace < a.leaderboardPlace) {
					return 1;
				}
				if (a.damageTaken < b.damageTaken) {
					return -1;
				}
				if (b.damageTaken < a.damageTaken) {
					return 1;
				}
				return 0;
			});
		// console.log('opponents', opponents);
		this.nextBattle = this._game.battleResult;
		this.battleSimulationStatus = this._game.battleInfoStatus;
		this.opponents = opponents.sort((a, b) =>
			a.cardId === this._panel.opponentOverview.cardId
				? -1
				: b.cardId === this._panel.opponentOverview.cardId
				? 1
				: 0,
		);

		this.opponentInfos = opponents
			.map(
				opponent =>
					({
						id: opponent.cardId,
						icon: `https://static.zerotoheroes.com/hearthstone/fullcard/en/256/battlegrounds/${opponent.cardId}.png`,
						heroPowerCardId: opponent.heroPowerCardId,
						name: opponent.name,
						health: opponent.initialHealth - opponent.damageTaken,
						maxHealth: opponent.initialHealth,
						tavernTier: '' + opponent.getCurrentTavernTier(),
						boardMinions: opponent.getLastKnownBoardState(),
						boardTurn: opponent.getLastBoardStateTurn(),
						tavernUpgrades: [...opponent.tavernUpgradeHistory],
						triples: [...opponent.tripleHistory],
						// isNextOpponent: opponent.cardId === this._panel.opponentOverview.cardId,
					} as OpponentInfo),
			)
			.sort((a, b) =>
				a.id === this._panel.opponentOverview.cardId
					? -1
					: b.id === this._panel.opponentOverview.cardId
					? 1
					: 0,
			);
		// console.log('oponentInfos', this.opponentInfos);

		this.opponentFaceOffs = opponents.map(
			opp =>
				({
					name: opp.name,
					cardId: opp.cardId,
					heroPowerCardId: opp.heroPowerCardId,
					health: opp.initialHealth - opp.damageTaken,
					maxHealth: opp.initialHealth,
					wins: this._game.faceOffs
						.filter(faceOff => faceOff.playerCardId === this._game.getMainPlayer().cardId)
						.filter(faceOff => faceOff.opponentCardId === opp.cardId)
						.filter(faceOff => faceOff.result === 'won').length,
					losses: this._game.faceOffs
						.filter(faceOff => faceOff.playerCardId === this._game.getMainPlayer().cardId)
						.filter(faceOff => faceOff.opponentCardId === opp.cardId)
						.filter(faceOff => faceOff.result === 'lost').length,
					ties: this._game.faceOffs
						.filter(faceOff => faceOff.playerCardId === this._game.getMainPlayer().cardId)
						.filter(faceOff => faceOff.opponentCardId === opp.cardId)
						.filter(faceOff => faceOff.result === 'tied').length,
					isNextOpponent: opp.cardId === this._panel.opponentOverview.cardId,
				} as OpponentFaceOff),
		);
	}
}
