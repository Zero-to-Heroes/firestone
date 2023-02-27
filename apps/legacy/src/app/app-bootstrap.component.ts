import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostListener,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { OverwolfService } from '@firestone/shared/framework/core';
import { ModsBootstrapService } from '@legacy-import/src/lib/libs/mods/services/mods-bootstrap.service';
import { ModsManagerService } from '@legacy-import/src/lib/libs/mods/services/mods-manager.service';
import { from, Observable, Subject } from 'rxjs';
import { distinctUntilChanged, map, takeUntil, tap } from 'rxjs/operators';

@Component({
	selector: 'app-bootstrap',
	styleUrls: [`./app-bootstrap.component.scss`],
	template: `<ng-container *ngIf="currentWindowName$ | async as currentWindowName">
		<ng-container [ngSwitch]="currentWindowName">
			<app-root *ngSwitchCase="'MainWindow'"></app-root>
			<main-window *ngSwitchCase="'CollectionWindow'"></main-window>
			<loading *ngSwitchCase="'LoadingWindow'"></loading>
			<notifications *ngSwitchCase="'NotificationsWindow'"></notifications>
			<settings *ngSwitchCase="'SettingsWindow'"></settings>
			<battlegrounds *ngSwitchCase="'BattlegroundsWindow'"></battlegrounds>
			<out-of-cards-callback *ngSwitchCase="'OutOfCardsAuthWindow'"></out-of-cards-callback>
			<full-screen-overlays *ngSwitchCase="'FullScreenOverlaysWindow'"></full-screen-overlays>
			<full-screen-overlays-clickthrough
				*ngSwitchCase="'FullScreenOverlaysClickthroughWindow'"
			></full-screen-overlays-clickthrough>
		</ng-container>
	</ng-container>`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppBoostrapperComponent implements AfterContentInit, OnDestroy {
	currentWindowName$: Observable<string>;

	private destroyed$ = new Subject<void>();

	constructor(
		private readonly ow: OverwolfService,
		private readonly titleService: Title,
		private readonly cdr: ChangeDetectorRef,
		// TODO: might not be the best place
		private readonly modsBootstrap: ModsBootstrapService,
		private readonly modsManager: ModsManagerService,
	) {}

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		this.destroyed$.next();
		this.destroyed$.complete();
	}

	ngAfterContentInit(): void {
		this.currentWindowName$ = from(this.ow.getCurrentWindow()).pipe(
			map((currentWindow) => this.mapWindowName(currentWindow.name)),
			distinctUntilChanged(),
			tap(() =>
				setTimeout(() => {
					if (!(this.cdr as ViewRef)?.destroyed) {
						this.cdr.detectChanges();
					}
				}, 0),
			),
			takeUntil(this.destroyed$),
		);
		this.currentWindowName$.subscribe((name) => {
			const humanFriendlyName = this.buildHumanFriendlyName(name);
			this.titleService.setTitle(`Firestone - ${humanFriendlyName}`);
		});
		this.currentWindowName$.subscribe((name) => {
			if (name === 'MainWindow') {
				this.modsBootstrap.init();
				this.modsManager.init();
			}
		});
	}

	private buildHumanFriendlyName(name: string): string {
		switch (name) {
			case 'MainWindow':
				return 'Background';
			case 'CollectionOverlayWindow':
			case 'CollectionWindow':
				return 'Main';
			case 'FullScreenOverlaysWindow':
				return 'Overlays';
			case 'FullScreenOverlaysClickthroughWindow':
				return 'Overlays clickthrough';
			case 'LoadingWindow':
				return 'Loading';
			case 'NotificationsWindow':
				return 'Notifications';
			case 'SettingsOverlayWindow':
			case 'SettingsWindow':
				return 'Settings';
			case 'BattlegroundsOverlayWindow':
			case 'BattlegroundsWindow':
				return 'Battlegrounds';
			default:
				return name;
		}
	}

	private mapWindowName(name: string): string {
		switch (name) {
			case OverwolfService.COLLECTION_WINDOW_OVERLAY:
				return OverwolfService.COLLECTION_WINDOW;
			case OverwolfService.SETTINGS_WINDOW_OVERLAY:
				return OverwolfService.SETTINGS_WINDOW;
			case OverwolfService.BATTLEGROUNDS_WINDOW_OVERLAY:
				return OverwolfService.BATTLEGROUNDS_WINDOW;
			default:
				return name;
		}
	}
}
