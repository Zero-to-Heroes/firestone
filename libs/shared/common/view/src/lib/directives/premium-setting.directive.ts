import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectorRef,
	Directive,
	ElementRef,
	Host,
	Inject,
	Input,
	Optional,
	Renderer2,
	Self,
} from '@angular/core';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { ADS_SERVICE_TOKEN, IAdsService, waitForReady } from '@firestone/shared/framework/core';
import { PreferenceToggleComponent } from '../components/toggle/preference-toggle.component';

@Directive({
	selector: '[premiumSetting]',
})
export class PremiumSettingDirective extends AbstractSubscriptionComponent implements AfterContentInit, AfterViewInit {
	@Input() premiumSettingEnabled: boolean | undefined = true;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly renderer: Renderer2,
		private readonly el: ElementRef,
		@Inject(ADS_SERVICE_TOKEN) private readonly adsService: IAdsService,
		// Need to find another solution when targeting another component
		// Maybe see https://stackoverflow.com/questions/46014761/how-to-access-host-component-from-directive
		// https://github.com/angular/angular/issues/8277#issuecomment-323678013
		@Host() @Self() @Optional() private readonly targetPreferenceToggle: PreferenceToggleComponent,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.adsService);

		if (!!this.premiumSettingEnabled) {
			// I don't think there's a case where I would want to make the directive conditional to the lottery
			// being shown, as settings are permanent, and the lottery is just something you can pop on and off
			this.adsService.hasPremiumSub$$
				.pipe(this.mapData((premium) => premium))
				.subscribe((value) => this.setPremium(value));
		}
	}

	ngAfterViewInit(): void {
		this.renderer.removeClass(this.el.nativeElement, 'premium-setting');
		this.renderer.addClass(this.el.nativeElement, 'premium-setting');
	}

	private setPremium(value: boolean) {
		console.debug('setting premium', value);
		this.renderer.removeClass(this.el.nativeElement, 'locked');
		this.renderer.removeClass(this.el.nativeElement, 'unlocked');
		this.renderer.addClass(this.el.nativeElement, value ? 'unlocked' : 'locked');
		if (this.targetPreferenceToggle) {
			console.debug('target', this.targetPreferenceToggle);
			this.targetPreferenceToggle.isLocked = !value;
		}
	}
}
