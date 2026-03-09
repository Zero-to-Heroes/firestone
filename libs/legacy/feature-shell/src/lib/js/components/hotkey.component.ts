import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostListener,
	Inject,
	Input,
	OnDestroy,
	ViewEncapsulation,
	ViewRef,
} from '@angular/core';
import {
	HOTKEY_HANDLER_SERVICE_TOKEN,
	IHotkeyHandlerService,
	ILocalizationService,
	waitForReady,
} from '@firestone/shared/framework/core';

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
		private readonly i18n: ILocalizationService,
		@Inject(HOTKEY_HANDLER_SERVICE_TOKEN) private readonly hotkeyService: IHotkeyHandlerService,
	) {}

	async ngAfterViewInit() {
		await waitForReady(this.hotkeyService);

		this.detectHotKey();
		this.hotkeyChangedListener = this.hotkeyService.addHotkeyChangedListener(() => {
			this.detectHotKey();
		});
	}

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		this.hotkeyService.removeHotkeyChangedListener(this.hotkeyChangedListener);
	}

	private async detectHotKey() {
		const binding = await this.hotkeyService.getHotkeyBinding(this.hotkeyName);
		this.hotkey = binding ?? 'Unassigned';
		if (this.hotkey === 'Unassigned') {
			this.hotkeyHtml = '<span class="no-hotkey">No hotkey assigned</span>';
		} else {
			this.hotkeyHtml = this.splitHotkey();
		}
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
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
