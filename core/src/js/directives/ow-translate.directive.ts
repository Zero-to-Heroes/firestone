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
		const translateService: TranslateService =
			(ow?.isOwEnabled() ? ow?.getMainWindow()?.translateService : null) ?? translate;
		super(translateService, element, _ref);
	}
}
