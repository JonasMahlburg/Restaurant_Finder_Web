# Restaurant Finder – Web

Landingpage zur iOS-App **Restaurant Finder** mit einer interaktiven Karte auf Basis von Apple MapKit JS. Die Seite zeigt Gastronomie in der Umgebung, lässt sich nach Kategorie filtern und öffnet per Klick Apples Place Card mit Öffnungszeiten, Fotos und Kontaktdaten – analog zur App.

Live: https://restaurant-finder.jonas-mahlburg.de

## Features

- **Lokale Karte** – zentriert sich per Geolocation auf den Standort des Besuchers (Fallback: Berlin)
- **Kategorie-Filter** – Restaurant, Café, Bäckerei, Brauerei, Weingut, Bar/Club; es werden ausschließlich Apples eigene POI-Symbole angezeigt
- **Detailansicht** – Klick auf ein POI öffnet die Apple Place Card (Öffnungszeiten, Fotos, Telefon, Website, Bewertungen)
- **Links** zur TestFlight-Beta und zum WishKit-Feedbackboard
- **Screenshot-Karussell** der App
- Impressum

Kein Build-Schritt, kein Framework – reines HTML, CSS und Vanilla JavaScript.

## Projektstruktur

```
index.html                 Startseite mit Karte
imprint.html / imprint.css Impressum
style.css                  Styles der Startseite
map.js                     MapKit-Logik: Karte, Filter, Place Card
mapkit-config.example.js   Vorlage für die Token-Konfiguration
mapkit-config.js           Echte Tokens – NICHT im Repo (gitignored)
assets/                    Logo und Screenshots (gitignored, außer Logo)
fonts/                     Roboto Mono
```

## Setup

### 1. MapKit JS Token erstellen

MapKit JS benötigt ein JWT, das an eine Origin gebunden ist. Pro Origin (Schema + Host + Port) wird ein eigenes Token benötigt.

1. [Apple Developer → Identifiers → Maps IDs](https://developer.apple.com/account/resources/identifiers/list/mapsId): Maps ID anlegen (falls noch nicht vorhanden)
2. Maps ID öffnen → *MapKit JS* → **Create Token**
3. Origin eintragen, z. B. `http://localhost:8000` für lokal oder `https://restaurant-finder.jonas-mahlburg.de` für live
4. Token kopieren

### 2. Token-Datei anlegen

```bash
cp mapkit-config.example.js mapkit-config.js
```

In `mapkit-config.js` die Platzhalter durch die Tokens ersetzen:

```js
const MAPKIT_TOKENS = {
    "http://localhost:8000": "eyJ...",
    "https://restaurant-finder.jonas-mahlburg.de": "eyJ...",
};
```

Die Datei wählt das Token automatisch anhand von `location.origin`. Sie steht in `.gitignore` und darf nicht committet werden.

### 3. Lokal starten

MapKit JS funktioniert nicht über `file://`, daher einen lokalen Server verwenden:

```bash
python3 -m http.server 8000
```

Dann http://localhost:8000 öffnen. Geolocation funktioniert im Browser nur über `https` oder `localhost`.

## Deployment

Alle Dateien per FTP/SFTP o. Ä. auf den Webspace kopieren. Zu beachten:

- `mapkit-config.js` muss **manuell** mit hochgeladen werden, da sie nicht im Repo liegt
- Die Seite muss über die Origin laufen, für die das Live-Token ausgestellt wurde (inkl. `https`)
- Der `assets/`-Ordner ist gitignored – Screenshots ebenfalls manuell hochladen

## Fehlersuche

| Symptom | Ursache |
|---|---|
| Graues Raster, Pins sichtbar, aber keine Kartenkacheln | Token passt nicht zur aufgerufenen Origin oder ist abgelaufen (Konsole: `401`) |
| Konsole: `Kein Token für Origin …` | In `mapkit-config.js` fehlt ein Eintrag für die aktuelle URL |
| Konsole: `mapkit is not defined` | MapKit-Script im `<head>` wird nicht geladen (Adblocker, Offline) |
| Place Card leer, `NotSupportedError: attachShadow` | Sollte nicht mehr auftreten – `map.js` erzeugt für jede Card ein frisches Container-Element |

Alle Fehlermeldungen von `map.js` beginnen in der Browser-Konsole mit `MapKit:`.

## Kontingent

Das Apple Developer Program enthält täglich 250.000 Kartenaufrufe und 25.000 Service-Aufrufe (Place Lookup, Suche) kostenlos.

## Lizenz / Kontakt

Privates Projekt von Jonas Mahlburg. Feedback zur App gerne über [WishKit](https://www.wishkit.io/slug/restaurantfinder).
