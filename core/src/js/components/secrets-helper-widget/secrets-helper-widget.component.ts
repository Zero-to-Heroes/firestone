import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	EventEmitter,
	HostListener,
	OnDestroy,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { BehaviorSubject, Subscription } from 'rxjs';
import { GameState } from '../../models/decktracker/game-state';
import { GameEvent } from '../../models/game-event';
import { Preferences } from '../../models/preferences';
import { DebugService } from '../../services/debug.service';
import { OverwolfService } from '../../services/overwolf.service';
import { PreferencesService } from '../../services/preferences.service';

declare var amplitude;

@Component({
	selector: 'secrets-helper-widget',
	styleUrls: [
		'../../../css/global/components-global.scss',
		`../../../css/global/cdk-overlay.scss`,
		'../../../css/component/secrets-helper-widget/secrets-helper-widget.component.scss',
		`../../../css/themes/decktracker-theme.scss`,
	],
	template: `
		<div class="secrets-helper-widget" [ngClass]="{ 'active': active }" (click)="toggleSecretsHelper()">
			<div class="icon idle"></div>
			<div class="icon active"></div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SecretsHelperWidgetComponent implements AfterViewInit, OnDestroy {
	active: boolean;

	private gameInfoUpdatedListener: (message: any) => void;
	private deckSubscription: Subscription;
	private preferencesSubscription: Subscription;
	private windowId: string;
	private deckUpdater: EventEmitter<GameEvent>;

	constructor(
		private logger: NGXLogger,
		private prefs: PreferencesService,
		private cdr: ChangeDetectorRef,
		private ow: OverwolfService,
		private el: ElementRef,
		private renderer: Renderer2,
		private init_DebugService: DebugService,
	) {}

	async ngAfterViewInit() {
		this.deckUpdater = this.ow.getMainWindow().deckUpdater;
		this.windowId = (await this.ow.getCurrentWindow()).id;
		const deckEventBus: BehaviorSubject<any> = this.ow.getMainWindow().deckEventBus;
		this.deckSubscription = deckEventBus.subscribe(async event => {
			const gameState: GameState = event ? event.state : undefined;
			this.active = gameState && gameState.opponentDeck ? gameState.opponentDeck.secretHelperActive : false;
			console.log('game state', this.active, gameState);
			if (!(this.cdr as ViewRef).destroyed) {
				this.cdr.detectChanges();
			}
		});
		const preferencesEventBus: EventEmitter<any> = this.ow.getMainWindow().preferencesEventBus;
		this.preferencesSubscription = preferencesEventBus.subscribe(event => {
			this.handleDisplayPreferences(event.preferences);
		});
		this.gameInfoUpdatedListener = this.ow.addGameInfoUpdatedListener(async (res: any) => {
			if (res && res.resolutionChanged) {
				this.logger.debug('[decktracker-overlay] received new game info', res);
				// await this.changeWindowSize();
			}
		});

		// await this.changeWindowSize();
		await this.restoreWindowPosition();
		await this.handleDisplayPreferences();
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
		console.log('handled after view init');
	}

	ngOnDestroy(): void {
		this.ow.removeGameInfoUpdatedListener(this.gameInfoUpdatedListener);
		this.deckSubscription.unsubscribe();
		this.preferencesSubscription.unsubscribe();
	}

	toggleSecretsHelper() {
		this.deckUpdater.next(
			Object.assign(new GameEvent(), {
				type: 'TOGGLE_SECRET_HELPER',
			} as GameEvent),
		);
	}

	@HostListener('mousedown')
	dragMove() {
		this.ow.dragMove(this.windowId, async result => {
			const window = await this.ow.getCurrentWindow();
			if (!window) {
				return;
			}
			this.prefs.updateSecretsHelperWidgetPosition(window.left, window.top);
		});
	}

	@HostListener('mouseenter')
	onMouseEnter() {
		this.deckUpdater.next(
			Object.assign(new GameEvent(), {
				type: 'TOGGLE_SECRET_HELPER_HOVER_ON',
			} as GameEvent),
		);
	}

	@HostListener('mouseleave')
	onMouseLeave() {
		this.deckUpdater.next(
			Object.assign(new GameEvent(), {
				type: 'TOGGLE_SECRET_HELPER_HOVER_OFF',
			} as GameEvent),
		);
	}

	private async handleDisplayPreferences(preferences: Preferences = null) {
		// this.onResized();
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	// private onResized() {
	// 	const newScale = this.scale / 100;
	// 	const element = this.el.nativeElement.querySelector('.scalable');
	// 	this.renderer.setStyle(element, 'transform', `scale(${newScale})`);
	// 	if (!(this.cdr as ViewRef).destroyed) {
	// 		this.cdr.detectChanges();
	// 	}
	// }

	private async restoreWindowPosition(): Promise<void> {
		const width = 50;
		const gameInfo = await this.ow.getRunningGameInfo();
		if (!gameInfo) {
			return;
		}
		const gameWidth = gameInfo.logicalWidth;
		const prefs = await this.prefs.getPreferences();
		const widgetPosition = prefs.secretsHelperWidgetPosition;
		console.error('TODO: properly position widget');
		const newLeft = widgetPosition ? widgetPosition.left || 0 : 400;
		const newTop = widgetPosition ? widgetPosition.top || 0 : 200;
		console.log('updating widget position', newLeft, newTop);
		await this.ow.changeWindowPosition(this.windowId, newLeft, newTop);
		console.log('after window position update', await this.ow.getCurrentWindow());
	}
}
