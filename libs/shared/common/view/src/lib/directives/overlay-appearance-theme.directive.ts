import { Directive, HostBinding, Input } from '@angular/core';
import {
	DEFAULT_OVERLAY_APPEARANCE_THEME,
	OverlayAppearanceThemeSelection,
} from '@firestone/shared/common/service';

/**
 * Applies the selected overlay appearance theme to the host element as a `data-overlay-appearance`
 * attribute. Builtin themes match a `[data-overlay-appearance='<id>']` SCSS rule; the `custom` and
 * `user:*` selections have no SCSS and rely on the OverlayAppearanceService applying inline
 * `--ov-*` tokens on the same element.
 */
@Directive({
	standalone: false,
	selector: '[overlayAppearanceTheme]',
})
export class OverlayAppearanceThemeDirective {
	@HostBinding('attr.data-overlay-appearance') attr: string = DEFAULT_OVERLAY_APPEARANCE_THEME;

	@Input() set overlayAppearanceTheme(value: OverlayAppearanceThemeSelection | null | undefined) {
		this.attr = value ?? DEFAULT_OVERLAY_APPEARANCE_THEME;
	}
}
