import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ViewRef,
} from '@angular/core';
import { BattleResultHistory, BgsBattleSimulationResult } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { BgsFaceOffWithSimulation, GameStateFacadeService } from '@firestone/game-state';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { Observable, of } from 'rxjs';
import { auditTime, filter } from 'rxjs/operators';
import { AdService } from '../../../services/ad.service';

@Component({
	selector: 'bgs-battles',
	styleUrls: [
		`../../../../css/component/controls/controls.scss`,
		`../../../../css/component/controls/control-close.component.scss`,
		`../../../../css/component/battlegrounds/battles/bgs-battles.component.scss`,
	],
	template: `
		<bgs-battles-view
			*ngIf="{ selectedFaceOff: selectedFaceOff$ | async, faceOffs: faceOffs$ | async } as value"
			[faceOffs]="value.faceOffs"
			[selectedFaceOff]="value.selectedFaceOff"
			[actualBattle]="actualBattle$ | async"
			[battleResultHistory]="battleResultHistory$ | async"
			[canSelectBattle]="false"
			[showAds]="showAds$ | async"
		>
		</bgs-battles-view>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsBattlesComponent extends AbstractSubscriptionComponent implements AfterContentInit, AfterViewInit {
	simulationUpdater: (currentFaceOff: BgsFaceOffWithSimulation, partialUpdate: BgsFaceOffWithSimulation) => void;
	simulationReset: (faceOffId: string) => void;

	faceOffs$: Observable<readonly BgsFaceOffWithSimulation[]>;
	selectedFaceOff$: Observable<BgsFaceOffWithSimulation>;
	actualBattle$: Observable<BgsFaceOffWithSimulation>;
	battleResultHistory$: Observable<readonly BattleResultHistory[]>;
	showAds$: Observable<boolean>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly ads: AdService,
		private readonly gameState: GameStateFacadeService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.ads, this.gameState);

		this.faceOffs$ = this.gameState.gameState$$.pipe(
			auditTime(1000),
			filter((state) => !!state.bgState.currentGame?.faceOffs?.length),
			this.mapData((state) => state.bgState.currentGame.faceOffs),
			this.mapData((faceOffs) => faceOffs.slice().reverse()),
		);
		this.selectedFaceOff$ = of(null);
		this.actualBattle$ = of(null);
		this.battleResultHistory$ = this.gameState.gameState$$.pipe(
			auditTime(1000),
			filter((state) => !!state.bgState.currentGame?.faceOffs?.length),
			this.mapData((state) => state.bgState.currentGame.faceOffs),
			this.mapData((faceOffs) =>
				faceOffs.map(
					(faceOff) =>
						({
							turn: faceOff.turn,
							simulationResult: {
								wonPercent: faceOff.battleResult?.wonPercent,
							} as BgsBattleSimulationResult,
							actualResult: null,
						} as BattleResultHistory),
				),
			),
		);
		this.showAds$ = this.ads.hasPremiumSub$$.pipe(this.mapData((showAds) => !showAds));
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	async ngAfterViewInit() {
		// Not doing anything from the BG window
	}

	selectBattle(faceOff: BgsFaceOffWithSimulation) {
		// Not doing anything from the BG window
	}

	closeBattle(faceOff: BgsFaceOffWithSimulation) {
		// Not doing anything from the BG window
	}

	trackByFn(index: number, item: BgsFaceOffWithSimulation) {
		return item.id;
	}
}
