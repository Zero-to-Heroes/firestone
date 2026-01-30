import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedCommonViewModule } from '@firestone/shared/common/view';
import { SharedFrameworkCommonModule } from '@firestone/shared/framework/common';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { ElectronWindowWrapperComponent } from './components/electron-window-wrapper.component';

const components = [ElectronWindowWrapperComponent];

@NgModule({
	imports: [CommonModule, SharedFrameworkCoreModule, SharedFrameworkCommonModule, SharedCommonViewModule],
	providers: [],
	declarations: components,
	exports: components,
})
export class ElectronViewModule {}
