import { ChangeDetectorRef, Injectable, Optional, Pipe, PipeTransform } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { OverwolfService } from '../services/overwolf.service';

@Injectable()
@Pipe({
	name: 'owTranslate',
	pure: false, // required to update the value when the promise is resolved
})
export class OwTranslatePipe extends TranslatePipe implements PipeTransform {
	constructor(
		ow: OverwolfService,
		_ref: ChangeDetectorRef,
		// Used when OW is not available
		@Optional() translate: TranslateService,
	) {
		super((ow?.isOwEnabled() ? ow?.getMainWindow()?.translateService : null) ?? translate, _ref);
	}
}
