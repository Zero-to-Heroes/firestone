# Bob's Rush MMR Sync (Firestone add-on)

Reference add-on for the Firestone add-ons host. After each Battlegrounds game, it POSTs `{ player, region, rating }` to the Bob's Rush MMR API.

## Install

1. Copy this folder to:
   `%APPDATA%\Firestone\Addons\bobs-rush`
2. Open **Firestone → Settings → Add-ons**
3. Click **Refresh**
4. Enable **Bob's Rush MMR Sync**
5. Paste the partner API key and confirm the endpoint URL

## Permissions

- `battlegrounds.gameEnd` — receive player name, region, and post-game MMR
- `net.fetch` — POST to hosts listed in `allowedFetchHosts`
- `storage` — optional local key/value storage (unused by default)

## API contract

```http
POST /api/mmr/update
Authorization: Bearer <apiKey>
Content-Type: application/json

{ "player": "Name#1234", "region": "EU", "rating": 6500 }
```

`region` is one of `NA`, `EU`, `AP`, `CN`.
