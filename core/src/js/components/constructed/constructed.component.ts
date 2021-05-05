import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostListener,
	OnDestroy,
	ViewEncapsulation,
	ViewRef,
} from '@angular/core';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { BehaviorSubject, Subscriber, Subscription } from 'rxjs';
import { GameState } from '../../models/decktracker/game-state';
import { CARDS_VERSION } from '../../services/hs-utils';
import { OverwolfService } from '../../services/overwolf.service';
import { PreferencesService } from '../../services/preferences.service';

@Component({
	selector: 'constructed',
	styleUrls: [
		`../../../css/global/reset-styles.scss`,
		`../../../css/component/constructed/constructed.component.scss`,
	],
	encapsulation: ViewEncapsulation.None,
	template: `
		<window-wrapper [activeTheme]="'decktracker'" [allowResize]="true">
			<ads [parentComponent]="'constructed'"></ads>
			<constructed-content [state]="state"> </constructed-content>
		</window-wrapper>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConstructedComponent implements AfterViewInit, OnDestroy {
	state: GameState;

	windowId: string;

	private deckSubscription: Subscription;

	constructor(
		private readonly ow: OverwolfService,
		private readonly cdr: ChangeDetectorRef,
		private readonly prefs: PreferencesService,
		private readonly allCards: AllCardsService,
	) {
		allCards.initializeCardsDb(CARDS_VERSION);
	}

	async ngAfterViewInit() {
		this.windowId = (await this.ow.getCurrentWindow()).id;
		const deckEventBus: BehaviorSubject<any> = this.ow.getMainWindow().deckEventBus;
		const subscriber = new Subscriber<any>(async (event) => {
			// console.log('received', event);
			this.state = event.state as GameState;
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		});
		subscriber['identifier'] = 'constructed';
		this.deckSubscription = deckEventBus.subscribe(subscriber);
		await this.positionWindowOnSecondScreen();
		this.ow.bringToFront(this.windowId);
	}

	@HostListener('window:beforeunload')
	ngOnDestroy(): void {
		this.deckSubscription?.unsubscribe();
		this.state = null;
	}

	@HostListener('mousedown')
	dragMove() {
		this.ow.dragMove(this.windowId);
	}

	private async positionWindowOnSecondScreen() {
		const [monitorsList, gameInfo, prefs] = await Promise.all([
			this.ow.getMonitorsList(),
			this.ow.getRunningGameInfo(),
			this.prefs.getPreferences(),
		]);
		if (monitorsList.displays.length === 1 || prefs.bgsUseOverlay) {
			return;
		}
		console.log('monitors', monitorsList);
		// console.log('gameInfo', gameInfo);
		const mainMonitor = gameInfo?.monitorHandle?.value ?? -1;
		if (mainMonitor !== -1) {
			const secondMonitor = monitorsList.displays.filter((monitor) => monitor.handle.value !== mainMonitor)[0];
			console.log('changing window position', this.windowId, secondMonitor.x, secondMonitor.y);
			this.ow.changeWindowPosition(this.windowId, secondMonitor.x + 100, secondMonitor.y + 100);
		}
	}
}
