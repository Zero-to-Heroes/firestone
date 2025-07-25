import { ChangeDetectorRef, Directive, ElementRef, Input } from '@angular/core';
import { AppInjector, OverwolfService } from '@firestone/shared/framework/core';
import { TranslateDirective, TranslateService } from '@ngx-translate/core';

@Directive({
	standalone: false,
	selector: '[owTranslate]',
})
export class OwTranslateDirective extends TranslateDirective {
	@Input() set owTranslate(key: string) {
		super.translate = key;
	}

	constructor(ow: OverwolfService, element: ElementRef, _ref: ChangeDetectorRef) {
		let translateService: TranslateService = ow?.isOwEnabled() ? ow?.getMainWindow()?.translateService : null;
		if (!translateService) {
			translateService = AppInjector.get(TranslateService);
		}
		super(translateService, element, _ref);
	}
}
