# D&D Within — Cloudinary delete proxy

Een kleine Cloudflare Worker die afbeeldingen uit Cloudinary kan verwijderen.
De DnD-site (statisch op GitHub Pages) kan dit zelf niet, omdat deleten de
Cloudinary **API Secret** vereist en een statische site geen geheim kan bewaren.
Deze Worker bewaart het secret server-side en biedt één strak afgebakend
delete-endpoint aan.

## Beveiliging

Een statische site kan zich niet volledig authenticeren, dus defense in depth:

1. **CORS + Origin-check** — alleen `ALLOWED_ORIGIN` mag de Worker aanroepen.
2. **Shared bearer-token** — `SHARED_TOKEN` (zit ook in `storage.js`; niet
   echt geheim, maar stopt willekeurig scannen).
3. **Prefix-lock** — alleen `public_id`s onder `dnd-within/` kunnen worden
   verwijderd, en alleen de destroy-operatie. Worst case als alles wordt
   omzeild: iemand verwijdert campagne-afbeeldingen, die spelers opnieuw
   kunnen uploaden. Het account zelf loopt geen risico.

## Eenmalige setup (alleen Joshua)

Je hebt de **Cloudinary API Secret** nodig:
https://console.cloudinary.com/app/settings/api-keys

```bash
cd cloudinary-worker
npm install -g wrangler      # eenmalig, als je het nog niet hebt
wrangler login               # opent browser, koppel je Cloudflare-account

# Zet het secret (wordt NIET in git of de browser opgeslagen):
wrangler secret put CLOUDINARY_API_SECRET
# → plak je API Secret wanneer erom gevraagd wordt

# Deploy:
wrangler deploy
```

`wrangler deploy` print de Worker-URL, bijvoorbeeld:
`https://dnd-within-cloudinary.<jouw-subdomein>.workers.dev`

## Daarna

Geef die URL door, dan zet ik 'm in `storage.js` (`DELETE_WORKER_URL`) zodat
`DWImages.del()` daadwerkelijk verwijdert. Tot dan is `del()` een veilige
no-op en werkt de site gewoon door.

## Testen (na deploy)

```bash
curl -X POST "https://dnd-within-cloudinary.<subdomein>.workers.dev" \
  -H "Origin: https://joshuanierop.github.io" \
  -H "Authorization: Bearer dcd3b636b8e3d33fc302a3a0ef83c20f23b4b2d8041c8722" \
  -H "Content-Type: application/json" \
  -d '{"public_id":"dnd-within/test/player/EEN_BESTAANDE_ID"}'
```

Verwacht: `{"ok":true,"results":[{"public_id":"...","result":"ok"}]}`.
`result: "not found"` betekent dat de asset al weg was (ook prima).
