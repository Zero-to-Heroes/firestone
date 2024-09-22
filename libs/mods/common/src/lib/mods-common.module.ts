import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ModsBootstrapService } from './services/mods-bootstrap.service';
import { ModsConfigService } from './services/mods-config.service';
import { ModsManagerService } from './services/mods-manager.service';
import { ModsUtilsService } from './services/mods-utils.service';

@NgModule({
	imports: [CommonModule],
	providers: [ModsBootstrapService, ModsConfigService, ModsManagerService, ModsUtilsService],
})
export class ModsCommonModule {}
