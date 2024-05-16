/* eslint-disable @typescript-eslint/member-ordering */
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
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent, uuidShort } from '@firestone/shared/framework/common';
import { Subscription } from 'rxjs';

// TODO: refactor this to extend from toggle-view
@Component({
	selector: 'preference-toggle',
	styleUrls: [
		`./toggle.scss`,
		// `../../../css/component/settings/settings-common.component.scss`,
		`./preference-toggle.component.scss`,
	],
	template: `
		<div class="preference-toggle" [ngClass]="{ 'toggled-on': value, 'toggled-off': value }">
			<input
				hidden
				type="checkbox"
				[checked]="value"
				name=""
				id="a-01-{{ uniqueId }}-{{ field }}"
				(change)="toggleValue()"
			/>
			<label class="toggle" for="a-01-{{ uniqueId }}-{{ field }}" [ngClass]="{ enabled: value }">
				<p class="settings-p">
					{{ label }}
					<i class="info" *ngIf="tooltip" [helpTooltip]="tooltip">
						<svg>
							<use xlink:href="assets/svg/sprite.svg#info" />
						</svg>
					</i>
				</p>
				<b></b>
				<div class="premium-lock" [helpTooltip]="'settings.global.locked-tooltip' | fsTranslate">
					<svg>
						<use xlink:href="assets/svg/sprite.svg#lock" />
					</svg>
				</div>
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
	@Input() valueExtractor: (valkue: boolean) => Promise<boolean> = async (value) => value;

	value: boolean;
	toggled = false;
	uniqueId: string;

	isLocked: boolean;

	private sub$$: Subscription;

	constructor(protected override readonly cdr: ChangeDetectorRef, private readonly prefs: PreferencesService) {
		super(cdr);
		this.loadDefaultValues();
		this.uniqueId = uuidShort();
	}

	async ngAfterContentInit() {
		await this.prefs.isReady();

		this.sub$$ = this.prefs.preferences$$
			.pipe(this.mapData((prefs) => prefs[this.field]))
			.subscribe(async (value) => {
				this.value = await this.valueExtractor(value);
				this.cdr?.detectChanges();
			});

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@HostListener('window:beforeunload')
	override ngOnDestroy() {
		super.ngOnDestroy();
		this.sub$$?.unsubscribe();
	}

	async toggleValue() {
		if (this.isLocked) {
			return;
		}
		this.toggled = true;
		if (this.field) {
			await this.prefs.setValue(this.field, !this.value);
		}
		if (this.toggleFunction) {
			this.toggleFunction(!this.value);
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
		this.value = await this.valueExtractor(prefs[this.field]);
		this.toggled = false;
		if (this.callbackOnLoad) {
			this.callbackOnLoad(this.value);
		}
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
