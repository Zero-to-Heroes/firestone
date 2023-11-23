import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedCommonViewModule } from '@firestone/shared/common/view';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { ArenaClassInfoComponent } from './components/class-info/arena-class-info.component';
import { ArenaClassTierListTierComponent } from './components/class-info/arena-class-tier-list-tier.component';
import { ArenaClassTierListComponent } from './components/class-info/arena-class-tier-list.component';
import { ArenaClassStatsService } from './services/arena-class-stats.service';

const components = [ArenaClassTierListComponent, ArenaClassTierListTierComponent, ArenaClassInfoComponent];
@NgModule({
	imports: [CommonModule, SharedFrameworkCoreModule, SharedCommonViewModule],
	providers: [ArenaClassStatsService],
	declarations: components,
	exports: components,
})
export class ArenaCommonModule {}
