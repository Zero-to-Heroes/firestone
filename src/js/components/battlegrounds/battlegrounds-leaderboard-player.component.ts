import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, ViewRef } from '@angular/core';
import { BattlegroundsPlayer } from '../../models/battlegrounds/battlegrounds-player';
import { GameEvent } from '../../models/game-event';
import { BattlegroundsEvent } from '../../services/battlegrounds/events/battlegrounds-event';
import { BattlegroundsShowPlayerInfoEvent } from '../../services/battlegrounds/events/battlegrounds-show-player-info-event';
import { OverwolfService } from '../../services/overwolf.service';
import { BattlegroundsHidePlayerInfoEvent } from '../../services/battlegrounds/events/battlegrounds-hide-player-info-event';

@Component({
	selector: 'battlegrounds-leaderboard-player',
	styleUrls: [
		'../../../css/global/components-global.scss',
		`../../../css/global/cdk-overlay.scss`,
		'../../../css/component/battlegrounds/battlegrounds-leaderboard-player.component.scss',
	],
	template: `
		<div class="battlegrounds-leaderboard-player">
			<div class="attention-icon-container" (mouseenter)="onMouseEnter()" (mouseleave)="onMouseLeave()">
				<div class="attention-icon">
					I
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsLeaderboardPlayerComponent {
	cardId: string;

	@Input() set player(value: BattlegroundsPlayer) {
		if (this.cardId !== value.cardId) {
			this.cardId = value.cardId;
			if (!(this.cdr as ViewRef).destroyed) {
				this.cdr.detectChanges();
			}
		}
	}

	private stateUpdater: EventEmitter<GameEvent | BattlegroundsEvent>;

	constructor(private ow: OverwolfService, private cdr: ChangeDetectorRef) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().battlegroundsUpdater;
		console.log('after leaderboard player overlay init');
		this.cdr.detach();
	}

	// @HostListener('mouseenter')
	onMouseEnter() {
		console.log('mouseenter');
		this.stateUpdater.next(new BattlegroundsShowPlayerInfoEvent(this.cardId));
	}

	// @HostListener('mouseleave')
	onMouseLeave() {
		console.log('mouseleave');
		this.stateUpdater.next(new BattlegroundsHidePlayerInfoEvent());
	}
}
