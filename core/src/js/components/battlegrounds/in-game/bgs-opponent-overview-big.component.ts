import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
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
				<img [src]="_opponentInfo.icon" class="icon" />
				<div class="name">{{ _opponentInfo.name }}</div>
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
							<div class="triple-tiers">
								<div
									*ngFor="let triple of tierTriples"
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
						<div class="battle-simulation" *ngIf="_opponentInfo.nextBattle">
							<div class="winning-chance">
								<div class="label">Your chance of winning</div>
								<div class="value">{{ _opponentInfo.nextBattle.wonPercent?.toFixed(1) }}%</div>
							</div>
							<div class="damage">
								<div class="label">Avg damage</div>
								<div class="win" helpTooltip="Expected average damage in case you win the fight">
									{{ _opponentInfo.nextBattle.averageDamageWon?.toFixed(1) }}
								</div>
								/
								<div class="lose" helpTooltip="Expected average damage in case you lose the fight">
									{{ _opponentInfo.nextBattle.averageDamageLost?.toFixed(1) }}
								</div>
							</div>
						</div>
					</div>
				</div>
				<div class="tavern-upgrades">
					<div class="title">Tavern upgrades</div>
					<div class="upgrades">
						<div class="tavern-upgrade" *ngFor="let upgrade of _opponentInfo.tavernUpgrades">
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
	tierTriples: { minionTier: number; quantity: number }[];
	_opponentInfo: OpponentInfo;

	@Input() currentTurn: number;

	@Input() set opponentInfo(value: OpponentInfo) {
		this._opponentInfo = value;
		const triplesSinceLastBoard = value.triples.filter(triple => triple.turn >= value.boardTurn);
		const groupedByTier = groupByFunction((triple: BgsTriple) => '' + triple.tierOfTripledMinion)(
			triplesSinceLastBoard,
		);
		this.tierTriples = Object.keys(groupedByTier).map(minionTier => ({
			minionTier: parseInt(minionTier),
			quantity: groupedByTier[minionTier].length as number,
		}));
	}

	constructor(private readonly cdr: ChangeDetectorRef) {}
}
