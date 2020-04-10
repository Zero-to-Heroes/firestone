import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Input,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { BgsTavernUpgrade } from '../../../models/battlegrounds/in-game/bgs-tavern-upgrade';
import { BgsTriple } from '../../../models/battlegrounds/in-game/bgs-triple';
import { groupByFunction } from '../../../services/utils';
import { OpponentInfo } from './opponent-info';

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
						*ngIf="_opponentInfo.boardMinions"
					></bgs-board>
					<div class="bottom-info">
						<div class="triples-section">
							<div class="title">Triples since last encounter</div>
							<div class="triple-tiers" *ngIf="tierTriples?.length">
								<div
									*ngFor="let triple of tierTriples; trackBy: trackByTripleFn"
									class="triple"
									[helpTooltip]="
										'That player got ' +
										triple.quantity +
										' tier ' +
										triple.minionTier +
										' minions since last time you fought them'
									"
								>
									<div class="number">x{{ triple.quantity }}</div>
									<tavern-level-icon [level]="triple.minionTier" class="tavern"></tavern-level-icon>
								</div>
							</div>
						</div>
						<div class="battle-simulation">
							<div class="winning-chance">
								<div class="label">Your chance of winning</div>
								<div class="value" [helpTooltip]="temporaryBattleTooltip">
									{{ battleSimulationResult }}%
								</div>
							</div>
							<div class="damage">
								<div class="label">Avg damage</div>
								<div class="win" helpTooltip="Expected average damage in case you win the fight">
									{{
										_opponentInfo.nextBattle
											? _opponentInfo.nextBattle.averageDamageWon?.toFixed(1)
											: '...'
									}}
								</div>
								/
								<div class="lose" helpTooltip="Expected average damage in case you lose the fight">
									{{
										_opponentInfo.nextBattle
											? _opponentInfo.nextBattle.averageDamageLost?.toFixed(1)
											: '...'
									}}
								</div>
							</div>
						</div>
					</div>
				</div>
				<div class="tavern-upgrades">
					<div class="title">Tavern upgrades</div>
					<div class="upgrades" *ngIf="_opponentInfo.tavernUpgrades?.length">
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
export class BgsOpponentOverviewBigComponent implements AfterViewInit {
	tierTriples: { minionTier: number; quantity: number }[];
	_opponentInfo: OpponentInfo;

	battleSimulationResult: string;
	temporaryBattleTooltip: string;
	// temporaryWinValue: number;

	@Input() currentTurn: number;

	@Input() set opponentInfo(value: OpponentInfo) {
		console.log('setting next opponent info', value);
		this._opponentInfo = value;
		const triplesSinceLastBoard = value.triples.filter(triple => triple.turn >= value.boardTurn);
		const groupedByTier = groupByFunction((triple: BgsTriple) => '' + triple.tierOfTripledMinion)(
			triplesSinceLastBoard,
		);
		this.tierTriples = Object.keys(groupedByTier).map(minionTier => ({
			minionTier: parseInt(minionTier),
			quantity: groupedByTier[minionTier].length as number,
		}));

		if (value.battleSimulationStatus === 'empty') {
			if (this.tempInterval) {
				clearInterval(this.tempInterval);
			}
			this.temporaryBattleTooltip = null;
			this.battleSimulationResult = '--';
		} else if (value.battleSimulationStatus === 'waiting-for-result') {
			this.temporaryBattleTooltip = 'Battle simulation is running, results will arrive soon';
			this.tempInterval = setInterval(() => {
				this.battleSimulationResult = (99 * Math.random()).toFixed(1);
				if (!(this.cdr as ViewRef)?.destroyed) {
					this.cdr.detectChanges();
				}
			}, 30);
		} else {
			if (this.tempInterval) {
				clearInterval(this.tempInterval);
			}
			this.temporaryBattleTooltip = null;
			this.battleSimulationResult = this._opponentInfo.nextBattle?.wonPercent?.toFixed(1);
		}
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
		setTimeout(() => {
			console.log('will resize after setting opponent info');
			this.onResize();
		}, 300);
	}

	private tempInterval;

	private previousBoardWidth: number;

	constructor(private readonly cdr: ChangeDetectorRef, private el: ElementRef, private renderer: Renderer2) {}

	ngAfterViewInit() {
		setTimeout(() => {
			this.onResize();
		}, 100);
		// Using HostListener bugs when moving back and forth between the tabs (maybe there is an
		// issue when destroying / recreating the view?)
		window.addEventListener('resize', () => {
			console.log('detected window resize');
			this.onResize();
		});
	}

	onResize() {
		console.log('on window resize');
		const boardContainer = this.el.nativeElement.querySelector('.board');
		if (!boardContainer) {
			return;
		}
		const rect = boardContainer.getBoundingClientRect();
		if (this.previousBoardWidth === rect.width) {
			return;
		}
		console.log('keeping the resize loop', this.previousBoardWidth, rect.width, rect);
		this.previousBoardWidth = rect.width;
		// console.log('boardContainer', boardContainer, rect);
		// const constrainedByWidth = rect.width <
		const cardElements = boardContainer.querySelectorAll('li');
		// 	console.log('cardElements', cardElements);
		let cardWidth = rect.width / 8;
		let cardHeight = 1.48 * cardWidth;
		// if (i === 0) {
		// 	console.log('first card width', cardWidth, cardHeight, rect.height);
		// }
		if (cardHeight > rect.height) {
			cardHeight = rect.height;
			cardWidth = cardHeight / 1.48;
		}
		// if (i === 0) {
		// 	console.log('card width', cardWidth, cardHeight);
		// }
		for (const cardElement of cardElements) {
			this.renderer.setStyle(cardElement, 'width', cardWidth + 'px');
			this.renderer.setStyle(cardElement, 'height', cardHeight + 'px');
		}
		setTimeout(() => this.onResize(), 300);
	}

	trackByTripleFn(index, item: { minionTier: number; quantity: number }) {
		return item.minionTier;
	}

	trackByUpgradeFn(index, item: BgsTavernUpgrade) {
		return item.tavernTier;
	}
}
