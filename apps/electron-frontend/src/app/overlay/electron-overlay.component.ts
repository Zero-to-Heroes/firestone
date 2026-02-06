import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	NgZone,
	OnInit,
	ViewRef,
} from '@angular/core';
import { MemoryUpdatesService } from '@firestone/memory';
import { GameStatusService } from '@firestone/shared/common/service';
import { waitForReady } from '@firestone/shared/framework/core';
import { ElectronEntryPointComponent } from './electron-entry-point.component';

declare const window: any;

@Component({
	selector: 'electron-overlay',
	standalone: false,
	template: `
		<div class="electron-overlay-container">
			<full-screen-overlays *ngIf="ready"></full-screen-overlays>
		</div>
	`,
	styleUrls: ['./electron-overlay.component.scss'],
	changeDetection: ChangeDetectionStrategy.Default,
})
export class ElectronOverlayComponent extends ElectronEntryPointComponent implements OnInit {
	ready = false;

	constructor(
		private readonly cdr: ChangeDetectorRef,
		private readonly elementRef: ElementRef<HTMLElement>,
		private readonly gameStatusService: GameStatusService,
		private readonly memoryUpdateService: MemoryUpdatesService,
		private readonly ngZone: NgZone,
	) {
		super();
	}

	async ngOnInit() {
		await super.ngOnInit();

		await waitForReady(this.gameStatusService, this.memoryUpdateService);

		this.init_ScalingService.subscribeToWindowHeight(false);

		document.title = 'Firestone Overlay';
		this.ready = true;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
