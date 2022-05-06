import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostListener,
	Input,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import {} from 'lodash';
import { Subscription } from 'rxjs';
import { distinctUntilChanged, map, takeUntil, tap } from 'rxjs/operators';
import { OverwolfService } from '../../services/overwolf.service';
import { PreferencesService } from '../../services/preferences.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { cdLog } from '../../services/ui-store/app-ui-store.service';
import { uuid } from '../../services/utils';
import { AbstractSubscriptionComponent } from '../abstract-subscription.component';

@Component({
	selector: 'preference-toggle',
	styleUrls: [
		`../../../css/global/components-global.scss`,
		`../../../css/global/toggle.scss`,
		`../../../css/component/settings/settings-common.component.scss`,
		`../../../css/component/settings/preference-toggle.component.scss`,
	],
	template: `
		<div class="preference-toggle" [ngClass]="{ 'toggled-on': value }">
			<input
				hidden
				type="checkbox"
				[checked]="value"
				name=""
				id="a-01-{{ uniqueId }}-{{ field }}"
				(change)="toggleValue()"
			/>
			<label class="toggle" for="a-01-{{ uniqueId }}-{{ field }}" [ngClass]="{ 'enabled': value }">
				<p class="settings-p">
					{{ label }}
					<i class="info" *ngIf="tooltip" [helpTooltip]="tooltip" [helpTooltipPosition]="tooltipPosition">
						<svg>
							<use xlink:href="assets/svg/sprite.svg#info" />
						</svg>
					</i>
				</p>
				<b></b>
			</label>
			<div class="info-message" *ngIf="messageWhenToggleValue && shouldDisplayMessage()">
				<svg class="attention-icon">
					<use xlink:href="assets/svg/sprite.svg#attention" />
				</svg>
				{{ messageWhenToggleValue }}
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreferenceToggleComponent extends AbstractSubscriptionComponent implements AfterContentInit, OnDestroy {
	@Input() field: string;
	@Input() label: string;
	@Input() tooltip: string;
	@Input() tooltipPosition = 'right';
	@Input() messageWhenToggleValue: string;
	@Input() valueToDisplayMessageOn: string | boolean | number;
	@Input() toggleFunction: (newValue: boolean) => void;
	@Input() callbackOnLoad: (newValue: boolean) => void;

	value: boolean;
	toggled = false;
	uniqueId: string;

	private sub$$: Subscription;

	constructor(
		private prefs: PreferencesService,
		private ow: OverwolfService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
		this.loadDefaultValues();
		this.uniqueId = uuid();
	}

	ngAfterContentInit() {
		this.sub$$ = this.store
			.listenPrefs$((prefs) => prefs[this.field])
			.pipe(
				map(([pref]) => pref),
				distinctUntilChanged(),
				tap((filter) =>
					setTimeout(() => {
						if (!(this.cdr as ViewRef)?.destroyed) {
							this.cdr.detectChanges();
						}
					}, 0),
				),
				tap((filter) => cdLog('emitting pref in ', this.constructor.name, filter)),
				takeUntil(this.destroyed$),
			)
			.subscribe((value) => {
				this.value = value;
				this.cdr?.detectChanges();
			});
	}

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		super.ngOnDestroy();
		this.sub$$?.unsubscribe();
	}

	async toggleValue() {
		this.toggled = true;
		await this.prefs.setValue(this.field, !this.value);
		if (this.toggleFunction) {
			this.toggleFunction(this.value);
		}
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	shouldDisplayMessage(): boolean {
		return (
			this.valueToDisplayMessageOn === this.value || (this.toggled && this.valueToDisplayMessageOn === 'onToggle')
		);
	}

	private async loadDefaultValues() {
		const prefs = await this.prefs.getPreferences();
		this.value = prefs[this.field];
		this.toggled = false;
		if (this.callbackOnLoad) {
			this.callbackOnLoad(this.value);
		}
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
