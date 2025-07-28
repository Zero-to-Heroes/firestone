import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostListener,
	Input,
	OnDestroy,
	ViewEncapsulation,
	ViewRef,
} from '@angular/core';
import { OverwolfService } from '@firestone/shared/framework/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';

@Component({
	standalone: false,
	selector: 'hotkey',
	styleUrls: [`../../css/component/hotkey.component.scss`],
	template: ` <a class="hotkey" [innerHTML]="hotkeyHtml" href="overwolf://settings/hotkeys"></a> `,
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None,
})
export class HotkeyComponent implements AfterViewInit, OnDestroy {
	hotkeyHtml = '';
	@Input() hotkeyName = 'collection';

	private hotkey = 'Alt+C';
	private hotkeyChangedListener;

	constructor(
		private readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly i18n: LocalizationFacadeService,
	) {}

	ngAfterViewInit() {
		// this.cdr.detach();
		this.detectHotKey();
		this.hotkeyChangedListener = this.ow.addHotkeyChangedListener(() => {
			this.detectHotKey();
		});
	}

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		this.ow.removeHotkeyChangedListener(this.hotkeyChangedListener);
	}

	private async detectHotKey() {
		this.hotkey = (await this.ow.getHotKey(this.hotkeyName))?.binding || 'Unassigned';
		if (this.hotkey === 'Unassigned') {
			this.hotkeyHtml = '<span class="no-hotkey">No hotkey assigned</span>';
		} else {
			this.hotkeyHtml = this.splitHotkey();
		}
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private splitHotkey(): string {
		const split = this.hotkey.split('+');
		const hotkeyText = this.i18n.translateString('app.global.controls.hotkey-text');
		return (
			`<span class="text">${hotkeyText}</span>` +
			split.map((splitItem) => `<span class="key">${splitItem}</span>`).join('<span class="plus">+</span>')
		);
	}
}
