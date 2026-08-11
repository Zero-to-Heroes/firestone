import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { AddonSettingDefinition, InstalledAddon } from '@firestone/addons/common';
import { AddonsInstallService } from '@firestone/addons/services';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { ILocalizationService, waitForReady } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';

@Component({
	standalone: false,
	selector: 'settings-general-addons',
	styleUrls: [
		`../scrollbar-settings.scss`,
		`../../../settings-common.component.scss`,
		`./settings-general-addons.component.scss`,
	],
	template: `
		<div class="general-addons" scrollable>
			<h2 class="title" [fsTranslate]="'settings.general.addons.title'"></h2>
			<p class="description" [innerHTML]="instructions | safe"></p>

			<div class="section">
				<div class="button-group">
					<button (mousedown)="openFolder()" [fsTranslate]="'settings.general.addons.open-folder'"></button>
					<button (mousedown)="refresh()" [fsTranslate]="'settings.general.addons.refresh'"></button>
				</div>
				<p class="path" *ngIf="rootPath$ | async as rootPath">{{ rootPath }}</p>
			</div>

			<div class="section">
				<h3 class="section-title" [fsTranslate]="'settings.general.addons.installed-title'"></h3>
				<p
					class="description"
					*ngIf="!(addons$ | async)?.length"
					[fsTranslate]="'settings.general.addons.empty'"
				></p>
				<div class="installed-addons">
					<div class="addon" *ngFor="let addon of addons$ | async; trackBy: trackByAddon">
						<div class="addon-header">
							<div class="addon-name" [helpTooltip]="addon.manifest.description">
								{{ addon.manifest.name }}
							</div>
							<div class="addon-version" *ngIf="addon.manifest.version">
								v{{ addon.manifest.version }}
							</div>
							<fs-toggle-view
								class="toggle-button"
								[value]="addon.enabled"
								[toggleFunction]="toggleAddon(addon)"
								[ngClass]="{ disabled: !!addon.loadError }"
							></fs-toggle-view>
						</div>
						<div class="addon-error" *ngIf="addon.loadError">{{ addon.loadError }}</div>
						<div class="addon-permissions" *ngIf="addon.manifest.permissions?.length">
							<span [fsTranslate]="'settings.general.addons.permissions'"></span>
							{{ addon.manifest.permissions.join(', ') }}
						</div>
						<div class="addon-settings" *ngIf="addon.manifest.settings?.length">
							<div
								class="setting-row"
								*ngFor="let setting of addon.manifest.settings; trackBy: trackBySetting"
							>
								<label [attr.for]="addon.manifest.id + '-' + setting.key">
									{{ setting.label || setting.key }}
								</label>
								<input
									*ngIf="setting.type === 'boolean'"
									type="checkbox"
									[id]="addon.manifest.id + '-' + setting.key"
									[checked]="!!getSettingValue(addon, setting)"
									(change)="onBooleanSetting(addon, setting, $event)"
								/>
								<input
									*ngIf="setting.type === 'string' || setting.type === 'password'"
									[type]="setting.type === 'password' ? 'password' : 'text'"
									[id]="addon.manifest.id + '-' + setting.key"
									[ngModel]="getSettingValue(addon, setting)"
									(ngModelChange)="onTextSetting(addon, setting, $event)"
									(mousedown)="preventDrag($event)"
								/>
								<input
									*ngIf="setting.type === 'number'"
									type="number"
									[id]="addon.manifest.id + '-' + setting.key"
									[ngModel]="getSettingValue(addon, setting)"
									(ngModelChange)="onNumberSetting(addon, setting, $event)"
									(mousedown)="preventDrag($event)"
								/>
								<p class="setting-description" *ngIf="setting.description">{{ setting.description }}</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsGeneralAddonsComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	addons$: Observable<readonly InstalledAddon[]>;
	rootPath$: Observable<string>;

	instructions: string;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly i18n: ILocalizationService,
		private readonly addonsInstall: AddonsInstallService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.addonsInstall);

		this.instructions = this.i18n.translateString('settings.general.addons.instructions', {
			path: this.addonsInstall.getRootPath(),
		});
		this.addons$ = this.addonsInstall.addons$$.asObservable().pipe(this.mapData((addons) => addons ?? []));
		this.rootPath$ = this.addonsInstall.rootPath$$.asObservable().pipe(this.mapData((path) => path ?? ''));

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}

	async openFolder() {
		await this.addonsInstall.openAddonsFolder();
	}

	async refresh() {
		await this.addonsInstall.refreshAddons();
	}

	toggleAddon(addon: InstalledAddon): (value: boolean) => void {
		return (_value: boolean) => {
			if (addon.loadError) {
				return;
			}
			void this.addonsInstall.setAddonEnabled(addon.manifest.id, !addon.enabled);
		};
	}

	getSettingValue(addon: InstalledAddon, setting: AddonSettingDefinition): boolean | string | number {
		const merged = this.addonsInstall.getMergedSettings(addon.manifest);
		const value = merged[setting.key];
		return value !== undefined ? value : ((setting.default as any) ?? '');
	}

	onBooleanSetting(addon: InstalledAddon, setting: AddonSettingDefinition, event: Event) {
		const checked = !!(event.target as HTMLInputElement)?.checked;
		void this.addonsInstall.setAddonSetting(addon.manifest.id, setting.key, checked);
	}

	onTextSetting(addon: InstalledAddon, setting: AddonSettingDefinition, value: string) {
		void this.addonsInstall.setAddonSetting(addon.manifest.id, setting.key, value ?? '');
	}

	onNumberSetting(addon: InstalledAddon, setting: AddonSettingDefinition, value: string | number) {
		const numeric = typeof value === 'number' ? value : parseFloat(value);
		if (!Number.isFinite(numeric)) {
			return;
		}
		void this.addonsInstall.setAddonSetting(addon.manifest.id, setting.key, numeric);
	}

	preventDrag(event: MouseEvent) {
		event.stopPropagation();
	}

	trackByAddon(_: number, addon: InstalledAddon): string {
		return addon.manifest.id;
	}

	trackBySetting(_: number, setting: AddonSettingDefinition): string {
		return setting.key;
	}
}
