import { animate, style, transition, trigger } from '@angular/animations';
import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostListener,
	Input,
	OnDestroy,
	ViewEncapsulation,
	ViewRef,
} from '@angular/core';
import { Events, PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { ExtendedWindowInfo, OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { BehaviorSubject, Subscription, combineLatest } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';

@Component({
	standalone: false,
	selector: 'window-wrapper',
	styleUrls: [
		`../../css/global/cdk-overlay.scss`,
		`../../css/component/window-wrapper.component.scss`,
		`../../css/themes/collection-theme.scss`,
		`../../css/themes/achievements-theme.scss`,
		// `../../css/themes/battlegrounds-theme.scss`,
		`../../css/themes/decktracker-theme.scss`,
		`../../css/themes/decktracker-desktop-theme.scss`,
		`../../css/themes/replays-theme.scss`,
		`../../css/themes/general-theme.scss`,
	],
	template: `
		<div class="top" [ngClass]="{ maximized: maximized || !allowResize }">
			<div class="root">
				<div class="background-backup"></div>
				<div class="app-container overlay-container-parent">
					<ng-content></ng-content>
				</div>

				<version></version>
				<div class="screen-capture-effect" *ngIf="screenCaptureOn" [@screenCapture]></div>
			</div>

			<div class="resize horizontal top" (mousedown)="dragResize($event, 'Top')"></div>
			<div class="resize vertical left" (mousedown)="dragResize($event, 'Left')"></div>
			<div class="resize vertical right" (mousedown)="dragResize($event, 'Right')"></div>
			<div class="resize horizontal bottom" (mousedown)="dragResize($event, 'Bottom')"></div>

			<div class="resize corner top-left" (mousedown)="dragResize($event, 'TopLeft')"></div>
			<div class="resize corner top-right" (mousedown)="dragResize($event, 'TopRight')"></div>
			<div class="resize corner bottom-left" (mousedown)="dragResize($event, 'BottomLeft')"></div>
			<div class="resize corner bottom-right" (mousedown)="dragResize($event, 'BottomRight')"></div>
		</div>
	`,
	animations: [
		trigger('screenCapture', [
			transition(':enter', [style({ opacity: 0 }), animate('200ms', style({ opacity: 1 }))]),
			transition(':leave', [style({ opacity: 1 }), animate('200ms', style({ opacity: 0 }))]),
		]),
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None,
})
export class WindowWrapperComponent extends AbstractSubscriptionComponent implements AfterContentInit, OnDestroy {
	@Input() allowResize = false;
	@Input() avoidGameOverlap = false;

	maximized: boolean;
	screenCaptureOn: boolean;

	private EXCLUDED_WINDOW_IDS = [
		'Window_Extension_lnknbakkpommmjjdnelmfbjjdbocfpnpbkijjnob_SettingsWindow',
		'Window_Extension_lnknbakkpommmjjdnelmfbjjdbocfpnpbkijjnob_SettingsOverlayWindow',
	];

	private stateChangedListener: (message: any) => void;
	private screenPropertyChangedListener: ((event: overwolf.windows.onScreenPropertyChangedEvent) => void) | null =
		null;
	private windowId = new BehaviorSubject<string>(null);

	private zoom = 1;
	private originalWidth = 0;
	private originalHeight = 0;
	private originalTop = 0;
	private originalLeft = 0;

	private sub$$: Subscription;
	// private sub2$$: Subscription;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly events: Events,
		private readonly prefs: PreferencesService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs);

		const currentWindow = await this.ow.getCurrentWindow();
		this.windowId.next(currentWindow.id);
		console.log('windowId', this.windowId.value);

		this.sub$$ = combineLatest([
			this.windowId.asObservable(),
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.globalZoomLevel)),
		])
			.pipe(
				map(([windowId, zoom]) => ({
					windowId,
					zoom,
				})),
				takeUntil(this.destroyed$),
			)
			.subscribe(async ({ windowId, zoom }) => {
				const normalized = (zoom ?? 0) / 100;
				this.zoom = normalized <= 1 ? 0 : normalized;
				if (this.EXCLUDED_WINDOW_IDS.includes(windowId)) {
					this.zoom = 0;
				}
				const currentWindow = await this.ow.getCurrentWindow();
				if (!this.originalHeight || !this.originalWidth) {
					this.originalWidth =
						currentWindow.logicalBounds.width / Math.max(1, this.zoom) / (currentWindow.dpiScale ?? 1);
					this.originalHeight =
						currentWindow.logicalBounds.height / Math.max(1, this.zoom) / (currentWindow.dpiScale ?? 1);
					this.originalTop =
						currentWindow.logicalBounds.top / Math.max(1, this.zoom) / (currentWindow.dpiScale ?? 1);
					this.originalLeft =
						currentWindow.logicalBounds.left / Math.max(1, this.zoom) / (currentWindow.dpiScale ?? 1);
					console.log(
						'setting originalWidth',
						this.originalWidth,
						'originalHeight',
						this.originalHeight,
						'originalTop',
						this.originalTop,
						'originalLeft',
						this.originalLeft,
						currentWindow,
					);
				}
				console.warn(
					'[window-resize-debug]',
					JSON.stringify({
						context: 'globalZoomLevel-change',
						globalZoomLevel: zoom,
						normalizedZoom: this.zoom,
					}),
				);
				// 0 is the unzoomed value
				// It behaves a bit strangely. When values are > 1, the zoom behaves as expected
				// If values are between 0 and 1, it looks like
				this.ow.setZoom(this.zoom);
				await this.changeWindowSize();
				await this.logWindowDimensions('zoom-or-init', currentWindow);

				const monitors = await this.ow.getMonitorsList();
				const targetId = String(currentWindow.monitorId ?? '');
				const monitor = monitors?.displays?.find(
					(m) => String(m.id) === targetId || (m.handle != null && String(m.handle.value) === targetId),
				);
				if (!!monitor && (this.originalTop < monitor.y || this.originalLeft < monitor.x)) {
					const newX = Math.max(this.originalTop, monitor.y);
					const newY = Math.max(this.originalLeft, monitor.x);
					console.log('changing window position', newX, newY, monitors);
					await this.ow.changeWindowPosition(currentWindow.id, newX, newY);
				}
			});

		this.stateChangedListener = this.ow.addStateChangedListener(currentWindow.name, (message) => {
			const state = message.window_state_ex;
			this.maximized = state === 'maximized';
			void this.logWindowDimensions(`stateChanged-${state}`);
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.markForCheck();
			}
		});

		if (this.ow.isOwEnabled() && overwolf.windows.onScreenPropertyChanged) {
			const windowName = currentWindow.name;
			this.screenPropertyChangedListener = (event) => {
				if (event.name !== windowName) {
					return;
				}
				void this.logWindowDimensions('screenPropertyChanged');
			};
			overwolf.windows.onScreenPropertyChanged.addListener(this.screenPropertyChangedListener);
		}
		this.events.on(Events.SHOW_SCREEN_CAPTURE_EFFECT).subscribe((event) => {
			this.screenCaptureOn = true;
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.markForCheck();
			}

			setTimeout(() => {
				this.screenCaptureOn = false;
				if (!(this.cdr as ViewRef)?.destroyed) {
					this.cdr.markForCheck();
				}
			}, 200);
		});
	}

	async dragResize(event: MouseEvent, edge) {
		if (this.maximized || !this.allowResize) {
			return;
		}

		event.preventDefault();
		event.stopPropagation();
		await this.ow.dragResize(this.windowId.value, edge);
		const window = await this.ow.getCurrentWindow();
		this.originalWidth = window.width;
		this.originalHeight = window.height;
		this.originalLeft = window.left;
		this.originalTop = window.top;
		if (!this.originalHeight || !this.originalWidth || isNaN(this.originalHeight) || isNaN(this.originalWidth)) {
			console.error('missing dimensions info', this.originalWidth, this.originalHeight, window);
			return;
		}
		await this.logWindowDimensions(`dragResize-${edge}`, window);
		setTimeout(() => {
			void this.logWindowDimensions(`dragResize-${edge}-after-tick`);
		}, 100);
	}

	@HostListener('window:resize')
	onBrowserResize() {
		void this.logWindowDimensions('browser-resize');
	}

	private async changeWindowSize(): Promise<void> {
		if (!this.originalHeight || !this.originalWidth || isNaN(this.originalHeight) || isNaN(this.originalWidth)) {
			console.error('missing dimension info', this.originalWidth, this.originalHeight);
			return;
		}
		const targetWidth = Math.max(this.originalWidth, this.zoom * this.originalWidth);
		const targetHeight = Math.max(this.originalHeight, this.zoom * this.originalHeight);
		console.debug('changing window size', this.originalWidth, this.originalHeight, this.zoom);
		await this.ow.changeWindowSize2(this.windowId.value, targetWidth, targetHeight);
		await this.logWindowDimensions('changeWindowSize', undefined, { targetWidth, targetHeight });
	}

	private async logWindowDimensions(
		context: string,
		owWindow?: ExtendedWindowInfo,
		extra?: Record<string, unknown>,
	): Promise<void> {
		const windowInfo = owWindow ?? (await this.ow.getCurrentWindow());
		const payload = {
			context,
			ts: new Date().toISOString(),
			...extra,
			stored: {
				originalWidth: this.originalWidth,
				originalHeight: this.originalHeight,
				originalLeft: this.originalLeft,
				originalTop: this.originalTop,
				zoom: this.zoom,
			},
			html: {
				innerWidth: window.innerWidth,
				innerHeight: window.innerHeight,
				clientWidth: document.documentElement.clientWidth,
				clientHeight: document.documentElement.clientHeight,
			},
			ow: windowInfo
				? {
						name: windowInfo.name,
						width: windowInfo.width,
						height: windowInfo.height,
						left: windowInfo.left,
						top: windowInfo.top,
						dpiScale: windowInfo.dpiScale,
						logicalBounds: windowInfo.logicalBounds,
						stateEx: windowInfo.stateEx,
						monitorId: windowInfo.monitorId,
					}
				: null,
			gap: windowInfo
				? {
						widthDelta: windowInfo.width - window.innerWidth,
						heightDelta: windowInfo.height - window.innerHeight,
					}
				: null,
		};
		console.warn('[window-resize-debug]', JSON.stringify(payload));
	}

	@HostListener('window:beforeunload')
	ngOnDestroy(): void {
		super.ngOnDestroy();
		this.ow.removeStateChangedListener(this.stateChangedListener);
		if (this.screenPropertyChangedListener && overwolf?.windows?.onScreenPropertyChanged) {
			overwolf.windows.onScreenPropertyChanged.removeListener(this.screenPropertyChangedListener);
		}
		this.sub$$?.unsubscribe();
		// this.sub2$$?.unsubscribe();
	}
}
