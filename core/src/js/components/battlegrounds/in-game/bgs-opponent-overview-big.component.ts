import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component, Input, ViewRef
} from '@angular/core';
import { Entity } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { BgsFaceOffWithSimulation } from '../../../models/battlegrounds/bgs-face-off-with-simulation';
import { BgsPlayer } from '../../../models/battlegrounds/bgs-player';
import { BgsTavernUpgrade } from '../../../models/battlegrounds/in-game/bgs-tavern-upgrade';
import { BgsTriple } from '../../../models/battlegrounds/in-game/bgs-triple';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';

@Component({
	selector: 'bgs-opponent-overview-big',
	styleUrls: [
		`../../../../css/global/reset-styles.scss`,
		`../../../../css/component/battlegrounds/in-game/bgs-opponent-overview-big.component.scss`,
	],
	template: `
		<bgs-player-capsule
			[player]="_opponent"
			[displayTavernTier]="true"
			[showLastOpponentIcon]="showLastOpponentIcon"
			class="opponent-overview"
		>
			<div class="main-info">
				<bgs-board
					[entities]="boardMinions"
					[currentTurn]="currentTurn"
					[boardTurn]="boardTurn"
					[maxBoardHeight]="-1"
				></bgs-board>
				<div class="bottom-info">
					<bgs-triples [triples]="triples" [boardTurn]="boardTurn"></bgs-triples>
					<bgs-battle-status
						*ngIf="enableSimulation"
						[nextBattle]="nextBattle"
						[showReplayLink]="true"
					></bgs-battle-status>
				</div>
			</div>
			<div class="tavern-upgrades" *ngIf="showTavernsIfEmpty || tavernUpgrades?.length">
				<div class="title">{{ tavernTitle }}</div>
				<div class="upgrades">
					<div class="tavern-upgrade" *ngFor="let upgrade of tavernUpgrades || []; trackBy: trackByUpgradeFn">
						<tavern-level-icon [level]="upgrade.tavernTier" class="tavern"></tavern-level-icon>
						<div
							class="label"
							[owTranslate]="'battlegrounds.battle.turn'"
							[translateParams]="{ value: upgrade.turn }"
						></div>
					</div>
				</div>
			</div>
		</bgs-player-capsule>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsOpponentOverviewBigComponent {
	_opponent: BgsPlayer;
	boardMinions: readonly Entity[];
	boardTurn: number;
	tavernUpgrades: readonly BgsTavernUpgrade[];
	triples: readonly BgsTriple[];

	@Input() rating: number;
	@Input() debug: boolean;
	@Input() enableSimulation: boolean;
	@Input() currentTurn: number;
	@Input() nextBattle: BgsFaceOffWithSimulation;
	@Input() maxBoardHeight = 1;
	@Input() tavernTitle = this.i18n.translateString('battlegrounds.in-game.opponents.tavern-upgrade-title');
	@Input() showTavernsIfEmpty = true;
	@Input() showLastOpponentIcon: boolean;

	@Input() set opponent(value: BgsPlayer) {
		if (value === this._opponent) {
			return;
		}

		this._opponent = value;
		if (!value) {
			console.warn('[opponent-big] setting empty value');
			return;
		}

		this.boardMinions = value.getLastKnownBoardState();
		this.boardTurn = value.getLastBoardStateTurn();
		this.triples = value.tripleHistory;
		this.tavernUpgrades = value.tavernUpgradeHistory;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	constructor(private readonly cdr: ChangeDetectorRef, private readonly i18n: LocalizationFacadeService) {}

	trackByUpgradeFn(index, item: BgsTavernUpgrade) {
		return item.tavernTier;
	}
}
