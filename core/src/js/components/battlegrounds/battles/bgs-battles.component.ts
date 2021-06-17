import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostListener,
	Input,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { BgsFaceOffWithSimulation } from '../../../models/battlegrounds/bgs-face-off-with-simulation';
import { BgsGame } from '../../../models/battlegrounds/bgs-game';
import { BgsBattlesPanel } from '../../../models/battlegrounds/in-game/bgs-battles-panel';
import { AdService } from '../../../services/ad.service';

@Component({
	selector: 'bgs-battles',
	styleUrls: [
		`../../../../css/global/reset-styles.scss`,
		`../../../../css/global/scrollbar.scss`,
		`../../../../css/component/battlegrounds/battles/bgs-battles.component.scss`,
	],
	template: `
		<div class="container" [ngClass]="{ 'no-ads': !showAds }">
			<div class="content empty-state" *ngIf="!faceOffs?.length">
				<i>
					<svg>
						<use xlink:href="assets/svg/sprite.svg#empty_state_tracker" />
					</svg>
				</i>
				<span class="title">Nothing here yet</span>
				<span class="subtitle">Your first battle will show here after you face an opponent</span>
			</div>
			<div class="content" *ngIf="faceOffs?.length" scrollable>
				<div class="explanations">
					You can reorder your or your opponents minions and simualte the new battle to help you find the best
					positioning (requires premium for battles after turn 5). You can read more about the feature and its
					limitations
					<a
						href="https://github.com/Zero-to-Heroes/firestone/wiki/Battlegrounds---Battle-Resimulation"
						target="_blank"
						>here</a
					>.
				</div>
				<bgs-battle *ngFor="let faceOff of faceOffs" [faceOff]="faceOff"></bgs-battle>
			</div>
			<div class="left">
				<!-- <div class="title">Wazzup?</div> -->
				<div class="left-info"></div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsBattlesComponent implements OnDestroy {
	faceOffs: readonly BgsFaceOffWithSimulation[];
	showAds = true;

	private _panel: BgsBattlesPanel;
	private _game: BgsGame;

	@Input() set panel(value: BgsBattlesPanel) {
		this._panel = value;
		this.updateInfo();
	}

	@Input() set game(value: BgsGame) {
		this._game = value;
		this.updateInfo();
	}

	constructor(private readonly cdr: ChangeDetectorRef, private readonly ads: AdService) {
		this.init();
	}

	@HostListener('window:beforeunload')
	ngOnDestroy(): void {
		this._game = null;
		this._panel = null;
	}

	private updateInfo() {
		if (!this._panel || !this._game?.faceOffs?.length || this.faceOffs === this._game.faceOffs) {
			return;
		}
		this.faceOffs = this._game.faceOffs;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private async init() {
		this.showAds = await this.ads.shouldDisplayAds();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
