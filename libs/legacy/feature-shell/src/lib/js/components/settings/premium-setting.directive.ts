import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectorRef,
	Directive,
	ElementRef,
	Host,
	Input,
	Optional,
	Renderer2,
	Self,
	ViewContainerRef,
} from '@angular/core';
import { PreferenceToggleComponent } from '@firestone/shared/common/view';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../abstract-subscription-store.component';

@Directive({
	selector: '[premiumSetting]',
})
export class PremiumSettingDirective
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit, AfterViewInit
{
	@Input() premiumSettingEnabled = true;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly renderer: Renderer2,
		private readonly el: ElementRef,
		private readonly viewContainerRef: ViewContainerRef,
		// Need to find another solution when targeting another component
		// Maybe see https://stackoverflow.com/questions/46014761/how-to-access-host-component-from-directive
		// https://github.com/angular/angular/issues/8277#issuecomment-323678013
		@Host() @Self() @Optional() private readonly targetPreferenceToggle: PreferenceToggleComponent,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		if (this.premiumSettingEnabled) {
			// I don't think there's a case where I would want to make the directive conditional to the lottery
			// being shown, as settings are permanent, and the lottery is just something you can pop on and off
			this.store
				.hasPremiumSub$()
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
