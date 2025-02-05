import { ChangeDetectorRef, Injectable, Pipe, PipeTransform } from '@angular/core';
import { AppInjector, OverwolfService } from '@firestone/shared/framework/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Injectable()
@Pipe({
	name: 'owTranslate',
	pure: false, // required to update the value when the promise is resolved
})
export class OwTranslatePipe extends TranslatePipe implements PipeTransform {
	constructor(ow: OverwolfService, _ref: ChangeDetectorRef) {
		let translateService: TranslateService = ow?.isOwEnabled() ? ow?.getMainWindow()?.translateService : null;
		if (!translateService) {
			translateService = AppInjector.get(TranslateService);
		}
		super(translateService, _ref);
	}
}
