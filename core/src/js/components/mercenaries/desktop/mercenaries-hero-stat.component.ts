import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MercenariesHeroSelectedEvent } from '../../../services/mainwindow/store/events/mercenaries/mercenaries-hero-selected-event';
import { OverwolfService } from '../../../services/overwolf.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { capitalizeFirstLetter } from '../../../services/utils';
import { MercenaryInfo } from './mercenary-info';

@Component({
	selector: 'mercenaries-hero-stat',
	styleUrls: [
		`../../../../css/component/app-section.component.scss`,
		`../../../../css/component/menu-selection.component.scss`,
		`../../../../css/component/mercenaries/desktop/mercenaries-hero-stat.component.scss`,
	],
	template: `
		<div class="mercenaries-hero-stat" (click)="select()">
			<div class="name-container">
				<div class="name" [helpTooltip]="role + ' - ' + name">{{ name }}</div>
				<div class="info" [helpTooltip]="numberOfGamesTooltip">
					<svg>
						<use xlink:href="assets/svg/sprite.svg#info" />
					</svg>
				</div>
			</div>
			<!-- <div class="portrait">
				<img [src]="portraitUrl" />
			</div> -->
			<div class="portrait" [cardTooltip]="cardId">
				<img class="icon" [src]="portraitUrl" />
				<img class="frame" [src]="frameUrl" />
			</div>
			<div class="stats">
				<div class="item winrate">
					<div class="label">Global winrate</div>
					<div class="values">
						<div class="value player">{{ buildPercents(globalWinrate) }}</div>
					</div>
				</div>
				<div class="item winrate">
					<div class="label">Your winrate</div>
					<div class="values">
						<div class="value player">
							{{ playerWinrate != null ? buildPercents(playerWinrate) : '--' }}
						</div>
					</div>
				</div>
				<div class="stats">
					<div class="item popularity">
						<div class="label">Games played</div>
						<div class="values">
							<div class="value player">{{ buildValue(playerGamesPlayed, 0) }}</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercenariesHeroStatComponent {
	@Input() set stat(value: MercenaryInfo) {
		this.cardId = value.id;
		this.role = capitalizeFirstLetter(value.role);
		this.name = value.name;
		this.portraitUrl = `https://static.zerotoheroes.com/hearthstone/cardart/256x/${value.id}.jpg`;
		this.frameUrl = `https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_hero_frame_golden_${value.role}.png?v=2`;
		this.numberOfGamesTooltip = `${value.globalTotalMatches.toLocaleString()} matches recorded (${this.buildPercents(
			value.globalPopularity,
		)} popularity)`;
		this.globalWinrate = value.globalWinrate;
		this.playerWinrate = value.playerWinrate;
		this.playerGamesPlayed = value.playerTotalMatches;
	}

	cardId: string;
	name: string;
	role: string;
	portraitUrl: string;
	frameUrl: string;
	numberOfGamesTooltip: string;
	globalWinrate: number;
	playerWinrate: number;
	playerGamesPlayed: number;

	constructor(private readonly ow: OverwolfService, private readonly store: AppUiStoreFacadeService) {}

	select() {
		this.store.send(new MercenariesHeroSelectedEvent(this.cardId));
	}

	buildPercents(value: number): string {
		return value == null ? '-' : value.toFixed(1) + '%';
	}

	buildValue(value: number, decimal = 2): string {
		return value == null ? '-' : value === 0 ? '0' : value.toFixed(decimal);
	}
}
