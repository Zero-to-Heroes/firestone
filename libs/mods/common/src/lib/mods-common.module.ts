import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ModsBootstrapService } from './services/mods-bootstrap.service';
import { ModsManagerService } from './services/mods-manager.service';

@NgModule({
	imports: [CommonModule],
	providers: [ModsBootstrapService, ModsManagerService],
})
export class ModsCommonModule {}
