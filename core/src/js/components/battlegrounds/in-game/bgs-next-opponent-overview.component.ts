import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	HostListener,
	Input,
	Renderer2,
} from '@angular/core';
import { BgsGame } from '../../../models/battlegrounds/bgs-game';
import { BgsNextOpponentOverviewPanel } from '../../../models/battlegrounds/in-game/bgs-next-opponent-overview-panel';
import { OpponentFaceOff } from './opponent-face-off';
import { OpponentInfo } from './opponent-info';

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
				<bgs-hero-face-off *ngFor="let faceOff of opponentFaceOffs" [faceOff]="faceOff"></bgs-hero-face-off>
			</div>
			<div class="content" *ngIf="opponentInfos.length > 0">
				<bgs-opponent-overview
					[opponentInfo]="opponentInfos[0]"
					[currentTurn]="currentTurn"
				></bgs-opponent-overview>
				<div class="subtitle">Other opponents</div>
				<bgs-opponent-overview
					*ngFor="let opponentInfo of opponentInfos.slice(1)"
					[opponentInfo]="opponentInfo"
					[currentTurn]="currentTurn"
				></bgs-opponent-overview>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsNextOpponentOverviewComponent implements AfterViewInit {
	opponentInfos: readonly OpponentInfo[] = [];
	opponentFaceOffs: readonly OpponentFaceOff[];
	currentTurn: number;

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
		setTimeout(() => {
			this.onResize();
		}, 100);
	}

	@HostListener('window:resize')
	onResize() {
		const boardContainers = this.el.nativeElement.querySelectorAll('board');
		for (const boardContainer of boardContainers) {
			const rect = boardContainer.getBoundingClientRect();
			// console.log('boardContainer', boardContainer, rect);
			// const constrainedByWidth = rect.width <
			const cardElements = boardContainer.querySelectorAll('li');
			// 	console.log('cardElements', cardElements);
			let cardWidth = rect.width / 8;
			let cardHeight = 1.48 * cardWidth;
			if (cardHeight > rect.height) {
				cardHeight = rect.height;
				cardWidth = cardHeight / 1.48;
			}
			for (const cardElement of cardElements) {
				this.renderer.setStyle(cardElement, 'width', cardWidth + 'px');
				this.renderer.setStyle(cardElement, 'height', cardHeight + 'px');
			}
		}
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
		const opponents = this._game.players.filter(player => !player.isMainPlayer);
		this.opponentInfos = opponents
			.map(
				opponent =>
					({
						id: opponent.cardId,
						icon: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${opponent.cardId}.jpg`,
						name: opponent.name,
						tavernTier: '' + opponent.getCurrentTavernTier(),
						boardMinions: opponent.getLastKnownBoardState(),
						boardTurn: opponent.getLastBoardStateTurn(),
						tavernUpgrades: [...opponent.tavernUpgradeHistory].reverse(),
						triples: [...opponent.tripleHistory].reverse(),
						displayBody: opponent.cardId === this._panel.opponentOverview.cardId,
						nextBattle: opponent.cardId === this._panel.opponentOverview.cardId && this._game.battleResult,
					} as OpponentInfo),
			)
			.sort((a, b) =>
				a.id === this._panel.opponentOverview.cardId
					? -1
					: b.id === this._panel.opponentOverview.cardId
					? 1
					: 0,
			);

		this.opponentFaceOffs = opponents.map(
			opp =>
				({
					cardId: opp.cardId,
					wins: this._game.faceOffs
						.filter(faceOff => faceOff.playerCardId === this._game.getMainPlayer().cardId)
						.filter(faceOff => faceOff.opponentCardId === opp.cardId)
						.filter(faceOff => faceOff.result === 'won').length,
					losses: this._game.faceOffs
						.filter(faceOff => faceOff.playerCardId === this._game.getMainPlayer().cardId)
						.filter(faceOff => faceOff.opponentCardId === opp.cardId)
						.filter(faceOff => faceOff.result === 'lost').length,
				} as OpponentFaceOff),
		);
		setTimeout(() => {
			this.onResize();
		}, 100);
	}
}
