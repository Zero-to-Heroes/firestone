import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostBinding,
	ViewRef,
} from '@angular/core';
import { CornerPosition, PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';
import { TrackerFlavorText, TrackerFlavorTextService } from '../../services/decktracker/tracker-flavor-text.service';

@Component({
	standalone: false,
	selector: 'tracker-flavor-text',
	styleUrls: ['../../../css/component/overlays/tracker-flavor-text.component.scss'],
	template: `
		<div class="flavor-text-panel" *ngIf="flavor$ | async as flavor">
			<div class="card-name">{{ flavor.cardName }}</div>
			<div class="flavor-text">{{ flavor.flavorText }}</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrackerFlavorTextComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	flavor$: Observable<TrackerFlavorText | null>;

	@HostBinding('class') positionClass: CornerPosition = 'bottom-right';

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly prefs: PreferencesService,
		private readonly flavorText: TrackerFlavorTextService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs);

		this.prefs.preferences$$
			.pipe(this.mapData((prefs) => prefs.notificationsPosition ?? 'bottom-right'))
			.subscribe((position) => {
				this.positionClass = position;
				if (!(this.cdr as ViewRef)?.destroyed) {
					this.cdr.markForCheck();
				}
			});

		this.flavor$ = combineLatest([
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.overlayShowFlavorTextOnHover)),
			this.flavorText.hovered$$,
		]).pipe(this.mapData(([enabled, hovered]) => (enabled ? hovered : null)));

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}
}
