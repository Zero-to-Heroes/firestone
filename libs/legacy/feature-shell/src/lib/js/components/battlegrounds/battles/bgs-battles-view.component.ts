import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	EventEmitter,
	Input,
} from '@angular/core';
import { BattleResultHistory } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { BgsFaceOffWithSimulation } from '@firestone/battlegrounds/core';
import { AnalyticsService, OverwolfService } from '@firestone/shared/framework/core';
import { BattlegroundsStoreEvent } from '@services/battlegrounds/store/events/_battlegrounds-store-event';
import { BgsSelectBattleEvent } from '@services/battlegrounds/store/events/bgs-select-battle-event';
import domtoimage from 'dom-to-image-more';
import html2canvas from 'html2canvas';
import { BattlegroundsMainWindowSelectBattleEvent } from '../../../services/mainwindow/store/events/battlegrounds/battlegrounds-main-window-select-battle-event';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../abstract-subscription-store.component';

@Component({
	selector: 'bgs-battles-view',
	styleUrls: [
		`../../../../css/component/controls/controls.scss`,
		`../../../../css/component/controls/control-close.component.scss`,
		`../../../../css/component/battlegrounds/battles/bgs-battles-view.component.scss`,
	],
	template: `
		<div class="container">
			<div class="content empty-state" *ngIf="!faceOffs?.length">
				<i>
					<svg>
						<use xlink:href="assets/svg/sprite.svg#empty_state_tracker" />
					</svg>
				</i>
				<span class="title" [owTranslate]="'battlegrounds.sim.empty-state-title'"></span>
				<span class="subtitle" [owTranslate]="'battlegrounds.sim.empty-state-subtitle'"></span>
			</div>
			<ng-container>
				<div class="content" *ngIf="faceOffs?.length">
					<!-- <div class="screenshot-container" (click)="takeScreenshot()">Screenshot</div>
					<div class="screenshot-container" (click)="takeScreenshotDomToImage()">ScreenshotDomToImage</div> -->
					<div class="battles-list" scrollable>
						<bgs-battle-recap
							*ngFor="let faceOff of faceOffs; trackBy: trackByFn"
							[faceOff]="faceOff"
							[selectable]="true || canSelectBattle"
							(click)="selectBattle(faceOff)"
							[ngClass]="{
								highlighted: selectedFaceOff?.id && faceOff.id === selectedFaceOff.id
							}"
						></bgs-battle-recap>
					</div>
				</div>
			</ng-container>
			<div class="left" *ngIf="!showAds">
				<div class="header" [owTranslate]="'battlegrounds.sim.turn-winrate-graph-title'"></div>
				<div class="left-info">
					<bgs-winrate-chart class="chart" [battleResultHistory]="battleResultHistory"></bgs-winrate-chart>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
// TODO: remove store and use stateUpdater instead
export class BgsBattlesViewComponent extends AbstractSubscriptionStoreComponent implements AfterViewInit {
	@Input() faceOffs: readonly BgsFaceOffWithSimulation[];
	@Input() selectedFaceOff: BgsFaceOffWithSimulation;
	@Input() actualBattle: BgsFaceOffWithSimulation;
	@Input() battleResultHistory: readonly BattleResultHistory[];
	@Input() showAds: boolean;
	@Input() canSelectBattle = true;

	@Input() set isMainWindow(value: boolean) {
		this._isMainWindow = value;
		this.ngAfterViewInit();
	}

	private _isMainWindow: boolean;
	private battlegroundsUpdater: EventEmitter<BattlegroundsStoreEvent>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly analytics: AnalyticsService,
		private readonly el: ElementRef,
	) {
		super(store, cdr);
	}

	async ngAfterViewInit() {
		this.battlegroundsUpdater = (await this.ow.getMainWindow()).battlegroundsUpdater;
	}

	selectBattle(faceOff: BgsFaceOffWithSimulation) {
		if (this._isMainWindow) {
			this.analytics.trackEvent('select-battle', { origin: 'bgs-battles-view-main-window' });
			this.store.send(new BattlegroundsMainWindowSelectBattleEvent(faceOff));
		} else {
			this.analytics.trackEvent('select-battle', { origin: 'bgs-battles-view-bg-window' });
			this.store.send(new BattlegroundsMainWindowSelectBattleEvent(faceOff));
		}
	}

	closeBattle() {
		this.battlegroundsUpdater.next(new BgsSelectBattleEvent(null));
	}

	trackByFn(index: number, item: BgsFaceOffWithSimulation) {
		return item.id;
	}

	takeScreenshot() {
		const captureElement: HTMLElement = document.querySelector('.battles-list');
		html2canvas(captureElement).then((canvas) => {
			console.debug('finished capturing canvas', canvas);
			// Copy the resulting image to the clipboard
			canvas.toBlob((blob) => {
				const item = new ClipboardItem({ 'image/png': blob });
				console.debug('item', item);
				navigator.clipboard.write([item]).then(
					() => {
						console.log('Screenshot copied to clipboard');
					},
					(err) => {
						console.error('Could not copy screenshot to clipboard', err);
					},
				);
			});

			// And save it to the disk
			const imageData = canvas.toDataURL('image/png');
			console.debug('imageData', imageData);
			const link = document.createElement('a');
			link.setAttribute('download', 'screenshot.png');
			link.setAttribute('href', imageData);
			link.click();
		});
	}

	// TODO: add proper header
	takeScreenshotDomToImage() {
		const captureElement: HTMLElement = document.querySelector('.battles-list');
		// Change the background before taking the screenshot
		captureElement.style.backgroundSize = 'cover';
		// Doesn't work, but we should be able to get the value with javascript from the CSS?
		// captureElement.style.backgroundImage = 'var(--window-background-image)';
		captureElement.style.backgroundImage =
			'radial-gradient(44.58% 50% at 50% 50%, rgba(48, 35, 128, 0.7) 0%, rgba(24, 24, 43, 0.7) 100% ), url("https://static.zerotoheroes.com/hearthstone/asset/firestone/images/backgrounds/decktracker_main_window.png")';
		setTimeout(() => {
			domtoimage
				.toJpeg(captureElement, {
					with: captureElement.scrollWidth,
					height: captureElement.scrollHeight,
					quality: 0.95,
				})
				.then(function (dataUrl) {
					captureElement.style.background = 'transparent';
					console.debug('dataUrl', dataUrl);
				});
		}); // Delay in milliseconds
	}
}
