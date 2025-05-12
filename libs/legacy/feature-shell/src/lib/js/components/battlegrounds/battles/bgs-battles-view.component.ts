import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
} from '@angular/core';
import { BattleResultHistory } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { BgsFaceOffWithSimulation } from '@firestone/game-state';
import { sleep } from '@firestone/shared/framework/common';
import { AnalyticsService, OverwolfService, OwUtilsService } from '@firestone/shared/framework/core';
import { BattlegroundsStoreEvent } from '@services/battlegrounds/store/events/_battlegrounds-store-event';
import { BgsSelectBattleEvent } from '@services/battlegrounds/store/events/bgs-select-battle-event';
import domtoimage from 'dom-to-image-more';
import { BehaviorSubject, Observable } from 'rxjs';
import { BattlegroundsMainWindowSelectBattleEvent } from '../../../services/mainwindow/store/events/battlegrounds/battlegrounds-main-window-select-battle-event';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../abstract-subscription-store.component';

@Component({
	selector: 'bgs-battles-view',
	styleUrls: [
		`../../../../css/component/controls/controls.scss`,
		`../../../../css/component/controls/control-close.component.scss`,
		`./bgs-battles-view.component.scss`,
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
					<div class="screenshot-container">
						<div class="text" *ngIf="screenshotText$ | async as text">{{ text }}</div>
						<div class="screenshot-icon" (click)="takeScreenshotDomToImage()">
							<div
								class="icon"
								inlineSVG="assets/svg/social/clipboard.svg"
								[helpTooltip]="screenshotTooltip$ | async"
							></div>
						</div>
					</div>
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
export class BgsBattlesViewComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterViewInit, AfterContentInit
{
	screenshotText$: Observable<string>;
	screenshotTooltip$: Observable<string>;

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

	private screenshotText$$ = new BehaviorSubject<string>(null);
	private screenshotTooltip$$ = new BehaviorSubject<string>('Copy the list of battles to your clipboard');

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly analytics: AnalyticsService,
		private readonly owUtils: OwUtilsService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit(): void {
		this.screenshotText$ = this.screenshotText$$.asObservable();
		this.screenshotTooltip$ = this.screenshotTooltip$$.asObservable();
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

	async takeScreenshotDomToImage() {
		this.screenshotText$$.next('Taking high-res screenshot...');
		this.screenshotTooltip$$.next('It can take a few seconds, thanks for waiting :)');
		this.analytics.trackEvent('screenshot', { origin: 'bgs-battles-view' });
		await sleep(100);
		const captureElement: HTMLElement = document.querySelector('.battles-list');
		const computedStyles = getComputedStyle(captureElement);
		const backgroundImage = computedStyles.getPropertyValue('--window-background-image');

		const messageTimeout = setTimeout(() => {
			this.screenshotText$$.next('Still working...');
		}, 4000);

		const scale = 4;
		domtoimage
			.toJpeg(captureElement, {
				width: scale * captureElement.scrollWidth,
				height: scale * (captureElement.scrollHeight + 20),
				style: {
					'padding-top': '10px',
					'background-size': 'cover',
					'background-image': backgroundImage,
					transform: `scale(${scale})`,
					'transform-origin': 'top left',
				},
			})
			.then(async (dataUrl) => {
				await this.owUtils.copyImageDataUrlToClipboard(dataUrl);
				clearTimeout(messageTimeout);
				this.screenshotText$$.next('Copied to clipboard!');
				this.screenshotTooltip$$.next('You can now paste it to your favorite social network');
				await sleep(3000);
				this.screenshotText$$.next(null);
				this.screenshotTooltip$$.next('Copy the list of battles to your clipboard');
			});
	}
}
