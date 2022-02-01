import { ChangeDetectorRef, Directive, ElementRef, Input, Optional } from '@angular/core';
import { TranslateDirective, TranslateService } from '@ngx-translate/core';
import { OverwolfService } from '../services/overwolf.service';

@Directive({
	selector: '[owTranslate]',
})
export class OwTranslateDirective extends TranslateDirective {
	@Input() set owTranslate(key: string) {
		super.translate = key;
	}

	constructor(
		ow: OverwolfService,
		element: ElementRef,
		_ref: ChangeDetectorRef,
		// Used when OW is not available
		@Optional() translate: TranslateService,
	) {
		super((ow?.isOwEnabled() ? ow?.getMainWindow()?.translateService : null) ?? translate, element, _ref);
	}
}
