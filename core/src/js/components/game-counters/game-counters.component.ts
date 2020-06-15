import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	HostListener,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { BehaviorSubject, Subscription } from 'rxjs';
import { GameState } from '../../models/decktracker/game-state';
import { DebugService } from '../../services/debug.service';
import { OverwolfService } from '../../services/overwolf.service';
import { PreferencesService } from '../../services/preferences.service';

declare let amplitude;

@Component({
	selector: 'game-counters',
	styleUrls: [
		'../../../css/global/components-global.scss',
		`../../../css/global/cdk-overlay.scss`,
		'../../../css/component/game-counters/game-counters.component.scss',
		`../../../css/themes/decktracker-theme.scss`,
	],
	template: `
		<div class="root overlay-container-parent" [activeTheme]="'decktracker'">
			<galakrond-counter
				*ngIf="activeCounter === 'galakrond'"
				[state]="gameState"
				[side]="side"
			></galakrond-counter>
			<pogo-counter *ngIf="activeCounter === 'pogo'" [state]="gameState" [side]="side"></pogo-counter>
			<attack-counter *ngIf="activeCounter === 'attack'" [state]="gameState" [side]="side"></attack-counter>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameCountersComponent implements AfterViewInit, OnDestroy {
	gameState: GameState;
	activeCounter: 'galakrond' | 'pogo' | 'attack';
	side: 'player' | 'opponent';

	// private gameInfoUpdatedListener: (message: any) => void;
	private windowId: string;
	private deckSubscription: Subscription;
	private preferencesSubscription: Subscription;

	constructor(
		private prefs: PreferencesService,
		private cdr: ChangeDetectorRef,
		private ow: OverwolfService,
		private el: ElementRef,
		private init_DebugService: DebugService,
		private cards: AllCardsService,
	) {
		cards.initializeCardsDb();
		const nativeElement = el.nativeElement;
		this.activeCounter = nativeElement.getAttribute('counter');
		this.side = nativeElement.getAttribute('side');
	}

	async ngAfterViewInit() {
		const deckEventBus: BehaviorSubject<any> = this.ow.getMainWindow().deckEventBus;
		this.deckSubscription = deckEventBus.subscribe(async event => {
			this.gameState = event ? event.state : undefined;
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		});
		this.windowId = (await this.ow.getCurrentWindow()).id;
		await this.restoreWindowPosition();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	ngOnDestroy(): void {
		this.deckSubscription.unsubscribe();
		this.preferencesSubscription.unsubscribe();
	}

	@HostListener('mousedown')
	dragMove() {
		this.ow.dragMove(this.windowId, async result => {
			const window = await this.ow.getCurrentWindow();
			if (!window) {
				return;
			}
			this.prefs.updateCounterPosition(this.activeCounter, this.side, window.left, window.top);
		});
	}

	private async restoreWindowPosition(): Promise<void> {
		const gameInfo = await this.ow.getRunningGameInfo();
		if (!gameInfo) {
			return;
		}
		const trackerPosition = await this.prefs.getCounterPosition(this.activeCounter, this.side);
		const newLeft = (trackerPosition && trackerPosition.left) || (await this.getDefaultLeft());
		const newTop = (trackerPosition && trackerPosition.top) || (await this.getDefaultTop());
		await this.ow.changeWindowPosition(this.windowId, newLeft, newTop);
	}

	private async getDefaultLeft() {
		const gameInfo = await this.ow.getRunningGameInfo();
		if (this.activeCounter === 'attack') {
			return gameInfo.logicalWidth * 0.5 + gameInfo.logicalHeight * 0.16;
		} else {
			const offset = this.activeCounter === 'galakrond' ? 0 : 150;
			return gameInfo.logicalWidth * 0.5 + gameInfo.logicalHeight * 0.2 + offset;
		}
	}

	private async getDefaultTop() {
		const gameInfo = await this.ow.getRunningGameInfo();
		if (this.side === 'player') {
			if (this.activeCounter === 'attack') {
				return gameInfo.logicalHeight * 0.65;
			} else {
				return gameInfo.logicalHeight * 0.7;
			}
		} else {
			if (this.activeCounter === 'attack') {
				return gameInfo.logicalHeight * 0.1;
			} else {
				return gameInfo.logicalHeight * 0.1;
			}
		}
	}
}
