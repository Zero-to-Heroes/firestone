import { Component, OnInit } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';

@Component({
	standalone: false,
	selector: 'mobile-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
	title = 'Firestone';

	async ngOnInit() {
		// Initialize native features when running on device
		if (Capacitor.isNativePlatform()) {
			await this.initializeNative();
		}
	}

	private async initializeNative() {
		try {
			// Configure status bar
			await StatusBar.setStyle({ style: Style.Dark });
			await StatusBar.setBackgroundColor({ color: '#0c1017' });

			// Hide splash screen after app loads
			await SplashScreen.hide();
		} catch (error) {
			console.error('Error initializing native features:', error);
		}
	}
}
