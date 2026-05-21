import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedCommonViewModule } from '@firestone/shared/common/view';
import { SharedFrameworkCommonModule } from '@firestone/shared/framework/common';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { ElectronVersionComponent } from './components/electron-version.component';
import { ElectronWindowWrapperComponent } from './components/electron-window-wrapper.component';

const components = [ElectronWindowWrapperComponent, ElectronVersionComponent];

@NgModule({
	imports: [CommonModule, SharedFrameworkCoreModule, SharedFrameworkCommonModule, SharedCommonViewModule],
	providers: [],
	declarations: components,
	exports: components,
})
export class ElectronViewModule {}
