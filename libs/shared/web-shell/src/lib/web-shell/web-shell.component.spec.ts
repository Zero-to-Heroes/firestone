import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WebShellComponent } from './web-shell.component';

describe('WebShellComponent', () => {
	let component: WebShellComponent;
	let fixture: ComponentFixture<WebShellComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [WebShellComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(WebShellComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
