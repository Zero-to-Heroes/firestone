import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, Renderer2 } from '@angular/core';
import { BgsPlayer } from '../../../models/battlegrounds/bgs-player';
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
				<tavern-level-icon [level]="_opponentInfo.tavernTier" class="tavern"></tavern-level-icon>
			</div>
			<div class="main-info">
				<bgs-board
					[entities]="_opponentInfo.boardMinions"
					[currentTurn]="currentTurn"
					[boardTurn]="_opponentInfo.boardTurn"
					[tooltipPosition]="'top'"
				></bgs-board>
			</div>
			<bgs-triples [opponentInfo]="_opponentInfo"></bgs-triples>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsOpponentOverviewComponent {
	_opponentInfo: OpponentInfo;

	@Input() currentTurn: number;

	@Input() set opponent(value: BgsPlayer) {
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
		} as OpponentInfo;
	}

	constructor(private readonly cdr: ChangeDetectorRef, private el: ElementRef, private renderer: Renderer2) {}
}
