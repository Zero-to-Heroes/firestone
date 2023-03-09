import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { GameStat, StatGameModeType } from '@firestone/stats/data-access';
import { isDuels } from '@services/duels/duels-utils';
import { isMercenaries } from '@services/mercenaries/mercenaries-utils';
import { RunStep } from '../../../models/duels/run-step';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../abstract-subscription-store.component';

@Component({
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
		></replay-info-ranked>
		<replay-info-battlegrounds
			*ngIf="gameMode === 'battlegrounds' || gameMode === 'battlegrounds-friendly'"
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
		<replay-info-duels
			*ngIf="isDuels"
			[showStatsLabel]="showStatsLabel"
			[showReplayLabel]="showReplayLabel"
			[replay]="replayInfo"
			[displayLoot]="displayLoot"
			[displayShortLoot]="displayShortLoot"
			[displayCoin]="displayCoin"
			[displayTime]="displayTime"
		></replay-info-duels>
		<replay-info-generic
			*ngIf="
				gameMode !== 'ranked' &&
				gameMode !== 'battlegrounds' &&
				gameMode !== 'battlegrounds-friendly' &&
				!isMercenaries &&
				!isDuels
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
export class ReplayInfoComponent extends AbstractSubscriptionStoreComponent {
	@Input() showStatsLabel = this.i18n.translateString('app.replays.replay-info.show-stats-button');
	@Input() showReplayLabel = this.i18n.translateString('app.replays.replay-info.watch-replay-button');
	@Input() displayCoin = true;
	@Input() displayTime = true;
	@Input() displayLoot: boolean;
	@Input() displayShortLoot: boolean;

	@Input() set replay(value: GameStat | RunStep) {
		this.replayInfo = value;
		this.updateInfo();
	}

	gameMode: StatGameModeType;
	isMercenaries: boolean;
	isDuels: boolean;
	replayInfo: GameStat;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
	) {
		super(store, cdr);
	}

	private updateInfo() {
		if (!this.replayInfo) {
			return;
		}
		this.gameMode = this.replayInfo.gameMode;
		this.isMercenaries = isMercenaries(this.gameMode);
		this.isDuels = isDuels(this.gameMode);
	}
}
