import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, Renderer2 } from '@angular/core';
import { BgsFaceOff } from '../../../models/battlegrounds/bgs-face-off';
import { BgsGame } from '../../../models/battlegrounds/bgs-game';
import { BgsPlayer } from '../../../models/battlegrounds/bgs-player';
import { BgsNextOpponentOverviewPanel } from '../../../models/battlegrounds/in-game/bgs-next-opponent-overview-panel';
import { BattleResult } from './opponent-info';

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
				<bgs-hero-face-offs
					[faceOffs]="faceOffs"
					[players]="players"
					[nextOpponentCardId]="nextOpponentCardId"
				></bgs-hero-face-offs>
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
					<div class="opponents" scrollable>
						<bgs-opponent-overview
							*ngFor="let opponent of opponents.slice(1); trackBy: trackByOpponentInfoFn"
							[opponent]="opponent"
							[currentTurn]="currentTurn"
						></bgs-opponent-overview>
					</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsNextOpponentOverviewComponent {
	// opponentInfos: readonly OpponentInfo[] = [];
	players: readonly BgsPlayer[];
	opponents: readonly BgsPlayer[];
	faceOffs: readonly BgsFaceOff[];
	// opponentFaceOffs: readonly OpponentFaceOff[];
	currentTurn: number;
	nextBattle: BattleResult;
	battleSimulationStatus: 'empty' | 'waiting-for-result' | 'done';
	nextOpponentCardId: string;

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

	trackByOpponentInfoFn(index, item: BgsPlayer) {
		return item.cardId;
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
		this.players = this._game.players;
		this.nextOpponentCardId = this._panel.opponentOverview.cardId;
		this.nextBattle = this._game.battleResult;
		this.battleSimulationStatus = this._game.battleInfoStatus;
		this.faceOffs = this._game.faceOffs;
		this.opponents = this._game.players
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
			})
			.sort((a, b) => (a.cardId === this.nextOpponentCardId ? -1 : b.cardId === this.nextOpponentCardId ? 1 : 0));
	}
}
