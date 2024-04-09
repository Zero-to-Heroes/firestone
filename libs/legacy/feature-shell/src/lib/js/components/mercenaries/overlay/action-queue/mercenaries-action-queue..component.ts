import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	HostListener,
	OnDestroy,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { waitForReady } from '@firestone/shared/framework/core';
import { Observable, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, takeUntil } from 'rxjs/operators';
import { MercenariesAction } from '../../../../models/mercenaries/mercenaries-battle-state';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';

@Component({
	selector: 'mercenaries-action-queue',
	styleUrls: [
		'../../../../../css/component/mercenaries/overlay/action-queue/mercenaries-action-queue.component.scss',
	],
	template: `
		<div class="root">
			<!-- Never remove the scalable from the DOM so that we can perform resizing even when not visible -->
			<div class="scalable">
				<div class="container">
					<div class="actions" *ngIf="actions$ | async as actions" [style.width.px]="overlayWidthInPx">
						<!-- <div class= "background"></div> -->
						<div class="actions-list">
							<mercenaries-action
								class="action {{ action.side }}"
								*ngFor="let action of actions"
								[action]="action"
							></mercenaries-action>
						</div>
					</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercenariesActionsQueueComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit, OnDestroy
{
	actions$: Observable<readonly MercenariesAction[]>;

	overlayWidthInPx = 240;

	private scaleExtractor = (prefs: Preferences) => prefs.mercenariesActionsQueueOverlayScale;
	private scale: Subscription;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly el: ElementRef,
		private readonly renderer: Renderer2,
		private readonly prefs: PreferencesService,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs);

		this.actions$ = this.store
			.listenMercenaries$(([state]) => state?.actionQueue)
			.pipe(
				filter(([actionQueue]) => !!actionQueue?.length),
				map(([actionQueue]) => actionQueue),
				distinctUntilChanged(),
				this.mapData((actionQueue) => {
					// const speeds = actionQueue.map((action) => action.speed);
					return actionQueue.map((action, index) => ({
						...action,
						actionOrder: index + 1,
					}));
				}),
			);
		this.scale = this.prefs.preferences$$
			.pipe(
				this.mapData((prefs) => (!!this.scaleExtractor ? this.scaleExtractor(prefs) : null)),
				debounceTime(100),
				distinctUntilChanged(),
				filter((scale) => !!scale),
				takeUntil(this.destroyed$),
			)
			.subscribe((scale) => {
				this.el.nativeElement.style.setProperty('--decktracker-scale', scale / 100);
				this.el.nativeElement.style.setProperty('--decktracker-max-height', '90vh');
				const newScale = scale / 100;
				const element = this.el.nativeElement.querySelector('.scalable');
				this.renderer.setStyle(element, 'transform', `scale(${newScale})`);
				if (!(this.cdr as ViewRef)?.destroyed) {
					this.cdr.detectChanges();
				}
			});

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		super.ngOnDestroy();
		this.scale?.unsubscribe();
	}
}

export interface Task {
	readonly mercenaryCardId: string;
	readonly title: string;
	readonly description: string;
	readonly taskChainProgress: number;
	readonly progress: number;
	readonly portraitUrl?: string;
	readonly frameUrl?: string;
}
