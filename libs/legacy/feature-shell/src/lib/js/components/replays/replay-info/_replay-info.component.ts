import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { isMercenaries } from '@firestone/mercenaries/common';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { GameStat, StatGameModeType } from '@firestone/stats/data-access';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';

@Component({
	standalone: false,
	selector: 'replay-info',
	styleUrls: [
		`../../../../css/global/menu.scss`,
		`../../../../css/component/replays/replay-info/replay-info.component.scss`,
	],
	template: `
		<replay-info-ranked
			*ngIf="gameMode === 'ranked'"
			[showStatsLabel]="showStatsLabel"
			[showReplayLabel]="showReplayLabel"
			[displayCoin]="displayCoin"
			[displayTime]="displayTime"
			[replay]="replayInfo"
			[clickToWatch]="clickToWatch"
		></replay-info-ranked>
		<replay-info-battlegrounds
			*ngIf="
				gameMode === 'battlegrounds' ||
				gameMode === 'battlegrounds-friendly' ||
				gameMode === 'battlegrounds-duo'
			"
			[showStatsLabel]="showStatsLabel"
			[showReplayLabel]="showReplayLabel"
			[displayTime]="displayTime"
			[replay]="replayInfo"
		></replay-info-battlegrounds>
		<replay-info-mercenaries
			*ngIf="isMercenaries"
			[showStatsLabel]="showStatsLabel"
			[showReplayLabel]="showReplayLabel"
			[displayTime]="displayTime"
			[replay]="replayInfo"
		></replay-info-mercenaries>
		<replay-info-generic
			*ngIf="
				gameMode !== 'ranked' &&
				gameMode !== 'battlegrounds' &&
				gameMode !== 'battlegrounds-friendly' &&
				gameMode !== 'battlegrounds-duo' &&
				!isMercenaries
			"
			[showStatsLabel]="showStatsLabel"
			[showReplayLabel]="showReplayLabel"
			[replay]="replayInfo"
			[displayCoin]="displayCoin"
			[displayTime]="displayTime"
		></replay-info-generic>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReplayInfoComponent extends AbstractSubscriptionComponent {
	@Input() showStatsLabel = this.i18n.translateString('app.replays.replay-info.show-stats-button');
	@Input() showReplayLabel = this.i18n.translateString('app.replays.replay-info.watch-replay-button');
	@Input() displayCoin = true;
	@Input() displayTime = true;
	@Input() displayLoot: boolean;
	@Input() displayShortLoot: boolean;
	@Input() clickToWatch: boolean;

	@Input() set replay(value: GameStat) {
		this.replayInfo = value;
		this.updateInfo();
	}

	gameMode: StatGameModeType;
	isMercenaries: boolean;
	replayInfo: GameStat;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
	) {
		super(cdr);
	}

	private updateInfo() {
		if (!this.replayInfo) {
			return;
		}
		this.gameMode = this.replayInfo.gameMode;
		this.isMercenaries = isMercenaries(this.gameMode);
	}
}
