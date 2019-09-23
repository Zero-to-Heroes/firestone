import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	OnDestroy,
	Output,
	ViewRef,
} from '@angular/core';
import { CollectionManager } from '../../services/collection/collection-manager.service';
import { ChangeVisibleApplicationEvent } from '../../services/mainwindow/store/events/change-visible-application-event';
import { MainWindowStoreEvent } from '../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../services/overwolf.service';

@Component({
	selector: 'app-choice',
	styleUrls: [`../../../css/global/components-global.scss`, `../../../css/component/home/app-choice.component.scss`],
	template: `
		<div class="app-choice" *ngIf="dataLoaded">
			<div (mousedown)="showCollection()" [ngClass]="{ 'app binder': true, 'inactive': noCollection }">
				<div class="info">
					<i class="i-150X150 gold-theme">
						<svg class="svg-icon-fill">
							<use xlink:href="/Files/assets/svg/sprite.svg#the_binder" />
						</svg>
					</i>
					<span class="title">The Binder</span>
					<span class="sub-title">Deep dive into your card collection</span>
					<div class="banner"></div>
				</div>
			</div>
			<div (mousedown)="showAchievements()" class="app achievements" [ngClass]="{ 'inactive': noCollection }">
				<div class="info">
					<i class="i-150X150 gold-theme">
						<svg class="svg-icon-fill">
							<use xlink:href="/Files/assets/svg/sprite.svg#achievements" />
						</svg>
					</i>
					<span class="title">Achievements</span>
					<span class="sub-title">Celebrate your in-game triumphs</span>
					<div class="banner"></div>
				</div>
			</div>
			<div (mousedown)="showDecktracker()" class="app deck-tracker last" [ngClass]="{ 'inactive': noCollection }">
				<div class="info">
					<i class="i-150X150 gold-theme">
						<svg class="svg-icon-fill">
							<use xlink:href="/Files/assets/svg/sprite.svg#deck_tracker" />
						</svg>
					</i>
					<span class="title">Deck Tracker</span>
					<span class="sub-title">Build the best decks and track them!</span>
					<div class="banner"></div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppChoiceComponent implements AfterViewInit, OnDestroy {
	@Output() close = new EventEmitter();

	dataLoaded = false;
	noCollection = true;

	private collectionWindowId;
	private stateUpdater: EventEmitter<MainWindowStoreEvent>;
	private stateChangedListener: (message: any) => void;

	constructor(
		private collectionManager: CollectionManager,
		private cdr: ChangeDetectorRef,
		private ow: OverwolfService,
	) {}

	async ngAfterViewInit() {
		this.cdr.detach();
		this.stateChangedListener = this.ow.addStateChangedListener('WelcomeWindow', message => {
			if (message.window_state === 'normal') {
				this.refreshContents();
			}
		});
		this.refreshContents();
		const window = await this.ow.obtainDeclaredWindow('CollectionWindow');
		this.collectionWindowId = window.id;
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	ngOnDestroy(): void {
		this.ow.removeStateChangedListener(this.stateChangedListener);
	}

	showCollection() {
		if (this.noCollection) {
			return;
		}
		this.showMainWindow('collection');
	}

	showDecktracker() {
		if (this.noCollection) {
			return;
		}
		this.showMainWindow('decktracker');
	}

	showAchievements() {
		if (this.noCollection) {
			return;
		}
		this.showMainWindow('achievements');
	}

	private async showMainWindow(module: string) {
		if (this.noCollection) {
			return;
		}

		this.stateUpdater.next(new ChangeVisibleApplicationEvent(module));
		const window = await this.ow.getCurrentWindow();
		const center = {
			x: window.left + window.width / 2,
			y: window.top + window.height / 2,
		};
		await this.ow.sendMessage(this.collectionWindowId, 'move', center);
		await this.ow.restoreWindow(this.collectionWindowId);
		this.close.emit(null);
	}

	private async refreshContents() {
		const collection = await this.collectionManager.getCollection();
		console.log('retrieved collection', collection);
		this.noCollection = !collection || collection.length === 0;
		this.dataLoaded = true;
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}
}
