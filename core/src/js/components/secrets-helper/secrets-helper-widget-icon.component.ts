import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	HostListener,
	Input,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { GameEvent } from '../../models/game-event';
import { OverwolfService } from '../../services/overwolf.service';
import { PreferencesService } from '../../services/preferences.service';

declare var amplitude;

@Component({
	selector: 'secrets-helper-widget-icon',
	styleUrls: [
		'../../../css/global/components-global.scss',
		'../../../css/component/secrets-helper/secrets-helper-widget-icon.component.scss',
		`../../../css/themes/decktracker-theme.scss`,
	],
	template: `
		<div class="secrets-helper-widget" [ngClass]="{ 'active': active }" (mouseup)="toggleSecretsHelper($event)">
			<div class="icon idle"></div>
			<div class="icon active"></div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SecretsHelperWidgetIconComponent implements AfterViewInit, OnDestroy {
	@Input() active: boolean;

	// private gameInfoUpdatedListener: (message: any) => void;
	// private deckSubscription: Subscription;
	// private preferencesSubscription: Subscription;
	private windowId: string;
	private deckUpdater: EventEmitter<GameEvent>;
	private showTimeout;
	private draggingTimeout;
	private isDragging: boolean;

	constructor(
		private logger: NGXLogger,
		private prefs: PreferencesService,
		private cdr: ChangeDetectorRef,
		private ow: OverwolfService,
	) {}

	async ngAfterViewInit() {
		this.deckUpdater = this.ow.getMainWindow().deckUpdater;
		this.windowId = (await this.ow.getCurrentWindow()).id;
		// const deckEventBus: BehaviorSubject<any> = this.ow.getMainWindow().deckEventBus;
		// this.deckSubscription = deckEventBus.subscribe(async event => {
		// 	const gameState: GameState = event ? event.state : undefined;
		// 	// this.active = gameState && gameState.opponentDeck ? !gameState.opponentDeck.secretHelperActive : false;
		// 	// console.log('game state', this.active, gameState);
		// 	if (!(this.cdr as ViewRef).destroyed) {
		// 		this.cdr.detectChanges();
		// 	}
		// });
		// const preferencesEventBus: EventEmitter<any> = this.ow.getMainWindow().preferencesEventBus;
		// this.preferencesSubscription = preferencesEventBus.subscribe(event => {
		// 	this.handleDisplayPreferences(event.preferences);
		// });
		// this.gameInfoUpdatedListener = this.ow.addGameInfoUpdatedListener(async (res: any) => {
		// 	if (res && res.resolutionChanged) {
		// 		this.logger.debug('[decktracker-overlay] received new game info', res);
		// 		// await this.changeWindowSize();
		// 	}
		// });

		// await this.changeWindowSize();
		// await this.restoreWindowPosition();
		// await this.handleDisplayPreferences();
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
		console.log('handled after view init');
	}

	ngOnDestroy(): void {
		// this.ow.removeGameInfoUpdatedListener(this.gameInfoUpdatedListener);
		// this.deckSubscription.unsubscribe();
		// this.preferencesSubscription.unsubscribe();
	}

	toggleSecretsHelper(event: MouseEvent) {
		// this.showTimeout = setTimeout(() => {
		// console.log('event for toggle', event);
		console.log('toggling', this.isDragging);
		if (this.isDragging) {
			return;
		}
		this.deckUpdater.next(
			Object.assign(new GameEvent(), {
				type: 'TOGGLE_SECRET_HELPER',
			} as GameEvent),
		);
		// }, 200);
	}

	@HostListener('mousedown', ['$event'])
	dragMove(event: MouseEvent) {
		// console.log('event for drag', event);
		// this.cancelTimeout = setTimeout(() => {
		// 	if (this.showTimeout) {
		// 		clearTimeout(this.showTimeout);
		// 	}
		// }, 100);
		this.draggingTimeout = setTimeout(() => {
			console.log('setting draggin to true', this.isDragging);
			this.isDragging = true;
		}, 500);
		this.ow.dragMove(this.windowId, async result => {
			clearTimeout(this.draggingTimeout);
			this.isDragging = false;
			console.log('dragmove', result, this.isDragging);
			const window = await this.ow.getCurrentWindow();
			if (!window) {
				return;
			}
			this.prefs.updateSecretsHelperWidgetPosition(window.left, window.top);
		});
	}

	// @HostListener('mouseup', ['$event'])
	// mouseUp(event: MouseEvent) {
	// 	// console.log('mouseup', event);
	// 	clearTimeout(this.cancelTimeout);
	// }

	// @HostListener('mouseenter')
	// onMouseEnter() {
	// 	this.deckUpdater.next(
	// 		Object.assign(new GameEvent(), {
	// 			type: 'TOGGLE_SECRET_HELPER_HOVER_ON',
	// 		} as GameEvent),
	// 	);
	// }

	// @HostListener('mouseleave')
	// onMouseLeave() {
	// 	this.deckUpdater.next(
	// 		Object.assign(new GameEvent(), {
	// 			type: 'TOGGLE_SECRET_HELPER_HOVER_OFF',
	// 		} as GameEvent),
	// 	);
	// }

	// private async handleDisplayPreferences(preferences: Preferences = null) {
	// 	// this.onResized();
	// 	if (!(this.cdr as ViewRef).destroyed) {
	// 		this.cdr.detectChanges();
	// 	}
	// }

	// private onResized() {
	// 	const newScale = this.scale / 100;
	// 	const element = this.el.nativeElement.querySelector('.scalable');
	// 	this.renderer.setStyle(element, 'transform', `scale(${newScale})`);
	// 	if (!(this.cdr as ViewRef).destroyed) {
	// 		this.cdr.detectChanges();
	// 	}
	// }

	// private async restoreWindowPosition(): Promise<void> {
	// 	const width = 50;
	// 	const gameInfo = await this.ow.getRunningGameInfo();
	// 	if (!gameInfo) {
	// 		return;
	// 	}
	// 	const gameWidth = gameInfo.logicalWidth;
	// 	const prefs = await this.prefs.getPreferences();
	// 	const widgetPosition = prefs.secretsHelperWidgetPosition;
	// 	// console.error('TODO: properly position widget');
	// 	const newLeft = (widgetPosition && widgetPosition.left) || (await this.buildDefaultLeft());
	// 	const newTop = (widgetPosition && widgetPosition.top) || (await this.buildDefaultTop());
	// 	// console.log('updating widget position', newLeft, newTop);
	// 	await this.ow.changeWindowPosition(this.windowId, newLeft, newTop);
	// 	// console.log('after window position update', await this.ow.getCurrentWindow());
	// }

	// private async buildDefaultLeft(): Promise<number> {
	// 	const gameInfo = await this.ow.getRunningGameInfo();
	// 	const gameWidth = gameInfo.logicalWidth;
	// 	const dpi = gameWidth / gameInfo.width;
	// 	// Use the height as a way to change the position, as the width can expand around the play
	// 	// area based on the screen resolution
	// 	return gameWidth / 2 - 40 * dpi - gameInfo.logicalHeight * 0.2;
	// }

	// private async buildDefaultTop(): Promise<number> {
	// 	const gameInfo = await this.ow.getRunningGameInfo();
	// 	return gameInfo.logicalHeight * 0.15;
	// }
}
