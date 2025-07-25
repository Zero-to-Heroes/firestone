import { ChangeDetectionStrategy, Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { ILocalizationService } from '@firestone/shared/framework/core';
import { GroupDetail } from './arena-current-session-widget.component';

@Component({
	standalone: false,
	selector: 'arena-current-session-tooltip',
	styleUrls: [`./arena-current-session-tooltip.component.scss`],
	template: `
		<div class="arena-info tooltip-mouse-over-target">
			<div class="title">{{ deckName }}</div>
			<div class="score" *ngIf="deckScore">
				<div class="image" [inlineSVG]="'assets/svg/star.svg'"></div>
				<div class="value">{{ deckScore.toFixed(1) }}</div>
			</div>
			<deck-list-basic class="deck-list" [deckstring]="deckstring"></deck-list-basic>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaCurrentSessionTooltipComponent {
	@Output() mouseLeave = new EventEmitter<MouseEvent>();

	@Input() set config(value: GroupDetail) {
		this.deckstring = value.deckstring;
		this.deckName = this.i18n.translateString('session.groups.arena.deck-title', {
			wins: `${value.wins} - ${value.losses}`,
		});
		this.deckScore = value.deckScore;
	}

	deckstring: string;
	deckName: string;
	deckScore: number;

	constructor(private readonly i18n: ILocalizationService) {}

	@HostListener('mouseleave', ['$event'])
	onMouseLeave(event: MouseEvent) {
		this.mouseLeave.next(event);
	}
}
