import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { OpponentInfo } from './opponent-info';

declare let amplitude: any;

@Component({
	selector: 'bgs-opponent-overview',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/battlegrounds/in-game/bgs-opponent-overview.component.scss`,
	],
	template: `
		<div class="opponent-overview">
			<div class="header" (click)="toggleDisplayBody(opponentInfo)">
				<div class="portrait">
					<img [src]="opponentInfo.icon" class="icon" />
					<div class="name">{{ opponentInfo.name }}</div>
					<!-- <img [src]="taverTierIcon" class="tavern-tier" /> -->
					<div class="tavern-tier">Tavern: {{ opponentInfo.tavernTier }}</div>
				</div>
				<board [entities]="opponentInfo.boardMinions" *ngIf="opponentInfo.boardMinions"></board>
				<div class="board-turn">
					Board as seen at turn {{ opponentInfo.boardTurn }} ({{ currentTurn - opponentInfo.boardTurn }})
					turns ago)
				</div>
				<div class="body" *ngIf="opponentInfo.displayBody">
					<div class="tavern-upgrades">
						<div *ngFor="let upgrade of opponentInfo.tavernUpgrades">
							Turn {{ upgrade.turn }}: Upgrade tier {{ upgrade.tavernTier }}
						</div>
					</div>
					<div class="triple-tiers">
						<div *ngFor="let triple of opponentInfo.triples">
							Turn {{ triple.turn }}: One tier {{ triple.tierOfTripledMinion }} triple
						</div>
					</div>
					<div class="next-battle" *ngIf="opponentInfo.nextBattle">
						<div class="win-chance">
							Chances to win: {{ opponentInfo.nextBattle.wonPercent?.toFixed(1) }} (for
							{{ opponentInfo.nextBattle.averageDamageWon?.toFixed(1) }} damage)
						</div>
						<div class="loss-chance">
							Chances to lose: {{ opponentInfo.nextBattle.lostPercent?.toFixed(1) }} (for
							{{ opponentInfo.nextBattle.averageDamageLost?.toFixed(1) }} damage)
						</div>
					</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsOpponentOverviewComponent {
	@Input() opponentInfo: OpponentInfo;
	@Input() currentTurn: number;

	constructor(private readonly cdr: ChangeDetectorRef) {}

	toggleDisplayBody(opponentInfo: OpponentInfo) {
		opponentInfo.displayBody = !opponentInfo.displayBody;
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}
}
