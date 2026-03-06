import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ModsBootstrapService } from './services/mods-bootstrap.service';
import { ModsManagerService } from './services/mods-manager.service';
import { ReplayProtocolHandlerService } from './services/replay-protocol-handler.service';

@NgModule({
	imports: [CommonModule],
	providers: [ModsBootstrapService, ModsManagerService, ReplayProtocolHandlerService],
})
export class ModsCommonModule {}
