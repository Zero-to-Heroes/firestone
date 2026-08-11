firestone.defineAddon(function (api) {
	api.events.onBattlegroundsGameEnd(async function (event) {
		try {
			api.log.info("Bob's Rush: battlegroundsGameEnd event received", event);
			var settings = await api.getSettings();
			if (!settings || settings.enabled === false) {
				api.log.info("Bob's Rush: add-on is disabled");
				return;
			}
			var apiKey = settings.apiKey;
			var endpointUrl = settings.endpointUrl;
			if (!apiKey || !endpointUrl) {
				api.log.warn("Bob's Rush: missing apiKey or endpointUrl in add-on settings");
				return;
			}
			if (
				!event ||
				!event.playerName ||
				!event.region ||
				event.rating == null ||
				!Number.isFinite(event.rating) ||
				event.rating < 0
			) {
				api.log.warn("Bob's Rush: incomplete battlegroundsGameEnd payload", event);
				return;
			}

			api.log.info("Bob's Rush: sending MMR to endpoint", endpointUrl);
			var response = await api.net.fetch(endpointUrl, {
				method: 'POST',
				headers: {
					Authorization: 'Bearer ' + apiKey,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					player: event.playerName,
					region: event.region,
					rating: event.rating,
				}),
			});

			if (!response || !response.ok) {
				api.log.error("Bob's Rush: sync failed", response && response.status, response && response.body);
				return;
			}
			api.log.info("Bob's Rush: synced MMR", event.playerName, event.region, event.rating);
		} catch (err) {
			api.log.error("Bob's Rush: unexpected error", err && err.message ? err.message : err);
		}
	});
});
