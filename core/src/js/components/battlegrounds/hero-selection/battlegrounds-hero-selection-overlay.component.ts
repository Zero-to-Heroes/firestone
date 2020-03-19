import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	OnDestroy,
	ViewEncapsulation,
	ViewRef,
} from '@angular/core';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { NGXLogger } from 'ngx-logger';
import { Subscription } from 'rxjs';
import { BattlegroundsHero } from '../../../models/battlegrounds/old/battlegrounds-hero';
import { BattlegroundsState } from '../../../models/battlegrounds/old/battlegrounds-state';
import { DebugService } from '../../../services/debug.service';
import { OverwolfService } from '../../../services/overwolf.service';

@Component({
	selector: 'battlegrounds-hero-selection-overlay',
	styleUrls: [
		'../../../../css/global/components-global.scss',
		`../../../../css/global/cdk-overlay.scss`,
		'../../../../css/component/battlegrounds/hero-selection/battlegrounds-hero-selection-overlay.component.scss',
		`../../../../css/themes/collection-theme.scss`,
		`../../../../css/themes/achievements-theme.scss`,
		`../../../../css/themes/decktracker-theme.scss`,
		`../../../../css/themes/replays-theme.scss`,
		`../../../../css/themes/general-theme.scss`,
	],
	template: `
		<div class="battlegrounds-hero-selection-overlay overlay-container-parent" [activeTheme]="'decktracker'">
			<ng-container *ngIf="showPlayerIcon">
				<battlegrounds-hero-selection-hero
					*ngFor="let hero of heroes; let i = index; trackBy: trackById"
					[hero]="hero"
					[style.top.%]="getTopOffset(i)"
					[style.left.%]="getLeftOffset(i)"
					class="hero"
				></battlegrounds-hero-selection-hero>
			</ng-container>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None, // Needed to the cdk overlay styling to work
})
export class BattlegroundsHeroSelectionOverlayComponent implements AfterViewInit, OnDestroy {
	state: BattlegroundsState;
	heroes: readonly BattlegroundsHero[];
	showPlayerIcon = true; // Will update with prefs later

	windowId: string;

	private gameInfoUpdatedListener: (message: any) => void;
	private stateSubscription: Subscription;

	constructor(
		private logger: NGXLogger,
		private cdr: ChangeDetectorRef,
		private ow: OverwolfService,
		private cards: AllCardsService,
		private init_DebugService: DebugService,
	) {}

	async ngAfterViewInit() {
		this.cards.initializeCardsDb();
		this.windowId = (await this.ow.getCurrentWindow()).id;
		const eventBus: EventEmitter<any> = this.ow.getMainWindow().battlegroundsEventBus;
		this.stateSubscription = eventBus.subscribe(async event => {
			console.log('received new event', event);
			// Can happen because we now have a BehaviorSubject
			if (event == null) {
				return;
			}
			this.changeWindowSize();
			this.state = event.state;
			this.heroes = this.state.heroSelection;
			if (!(this.cdr as ViewRef).destroyed) {
				this.cdr.detectChanges();
			}
		});
		this.gameInfoUpdatedListener = this.ow.addGameInfoUpdatedListener(async (res: any) => {
			if (res && res.resolutionChanged) {
				this.logger.debug('[decktracker-overlay] received new game info', res);
				await this.changeWindowSize();
			}
		});
		await this.changeWindowSize();
	}

	ngOnDestroy(): void {
		this.ow.removeGameInfoUpdatedListener(this.gameInfoUpdatedListener);
		this.stateSubscription.unsubscribe();
	}

	trackById(index, item: BattlegroundsHero) {
		return item.cardId;
	}

	getTopOffset(i: number) {
		// prettier-ignore
		if (this.heroes.length === 2) {
			switch(i) {
				default: return 21;
			}
		} else if (this.heroes.length === 3) {
			switch(i) {
				default: return 21;
			}
		}
	}

	getLeftOffset(i: number) {
		// prettier-ignore
		if (this.heroes.length === 2) {
			switch(i) {
				case 0: return -4;
				case 1: return 4;
				default: return 0;
			}
		} else if (this.heroes.length === 3) {
			switch(i) {
				case 0: return -9;
				case 1: return 0;
				case 2: return 9;
				default: return 0;
			}
		}
	}

	private async changeWindowSize(): Promise<void> {
		const gameInfo = await this.ow.getRunningGameInfo();
		if (!gameInfo) {
			return;
		}
		// At different resolutions, the sides of the board are cropped, so we can't use the width
		// for our positioning. The height is always the same though
		const width = gameInfo.width;
		// Height
		const height = gameInfo.height;
		await this.ow.changeWindowSize(this.windowId, width, height);
		// Move it to the right location
		const left = 0;
		const top = 0;
		await this.ow.changeWindowPosition(this.windowId, left, top);
	}
}
