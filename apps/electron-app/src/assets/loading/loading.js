(function () {
	const titleEl = document.getElementById('title');
	const spinnerEl = document.getElementById('spinner');
	const subtitleEl = document.getElementById('subtitle');
	const adsEl = document.getElementById('ads');

	const setReady = () => {
		if (titleEl) {
			titleEl.textContent = 'Ready';
		}
		if (spinnerEl) {
			spinnerEl.hidden = true;
		}
		if (subtitleEl) {
			subtitleEl.hidden = false;
			subtitleEl.textContent = 'Close this window when you are done — the ad helps keep Firestone free.';
		}
	};

	// ow-electron free build: native <owadview> tag (no Angular / OwAd shim).
	try {
		const adView = document.createElement('owadview');
		adView.style.width = '100%';
		adView.style.height = '100%';
		adView.style.background = 'transparent';
		adsEl?.appendChild(adView);
		console.log('[loading-lite] owadview attached');
	} catch (e) {
		console.warn('[loading-lite] owadview unavailable', e);
	}

	const api = window.electronAPI;
	document.getElementById('btn-close')?.addEventListener('click', () => {
		api?.closeSettingsWindow?.();
	});
	document.getElementById('btn-minimize')?.addEventListener('click', () => {
		api?.minimizeCurrentWindow?.();
	});

	try {
		api?.onLoadingReady?.(setReady);
		api?.getLoadingReadyState?.().then((alreadyReady) => {
			if (alreadyReady) {
				setReady();
			}
		});
	} catch (e) {
		console.error('[loading-lite] IPC setup failed', e);
	}

	console.log('[loading-lite] static loading page ready (no Angular / cards DB)');
})();
