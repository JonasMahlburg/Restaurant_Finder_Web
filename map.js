// MapKit JS – Restaurant Finder Web
// Token kommt aus mapkit-config.js (nicht im Repo)
//
// Es werden ausschließlich Apples eigene POI-Symbole auf der Karte angezeigt
// (gefiltert auf Gastronomie). Ein Klick darauf öffnet die Place Card.

// Übersetzt die POI-Kategorie in lesbare Namen (entspricht categoryName(for:) in der iOS-App)
const CATEGORY_NAMES = {
    Restaurant: "Restaurant",
    Cafe: "Café",
    Bakery: "Bäckerei",
    Brewery: "Brauerei",
    Winery: "Weingut",
    Nightlife: "Bar/Club",
};

function categoryName(category) {
    return CATEGORY_NAMES[category] || "Gastronomie";
}

const DEFAULT_CENTER = { latitude: 52.5200, longitude: 13.4050 }; // Fallback: Berlin

let map;
let activeCategory = "all"; // "all" oder ein Key aus CATEGORY_NAMES
let currentPlaceDetail = null;

function initMap() {
    if (typeof mapkit === "undefined") {
        console.error("MapKit: Bibliothek nicht geladen. Fehlt das <script src=\"https://cdn.apple-mapkit.com/...\"> im <head>?");
        return;
    }
    if (!window.MAPKIT_TOKEN || window.MAPKIT_TOKEN.startsWith("HIER_")) {
        console.error("MapKit: Kein Token gesetzt. Bitte mapkit-config.js ausfüllen (siehe mapkit-config.example.js).");
        return;
    }
    if (!document.getElementById("map")) {
        console.error("MapKit: <div id=\"map\"> nicht gefunden.");
        return;
    }

    mapkit.init({
        authorizationCallback: (done) => done(window.MAPKIT_TOKEN),
        language: "de",
    });

    mapkit.addEventListener("error", (e) => {
        console.error("MapKit Fehler:", e.status, "– Token abgelaufen oder Origin stimmt nicht mit der aufgerufenen URL überein.");
        setHint("Karte konnte nicht geladen werden (Token/Origin prüfen).");
    });

    map = new mapkit.Map("map", {
        center: new mapkit.Coordinate(DEFAULT_CENTER.latitude, DEFAULT_CENTER.longitude),
        cameraDistance: 2500,
        showsUserLocation: true,
        showsUserLocationControl: true,
        colorScheme: mapkit.Map.ColorSchemes.Dark,
        // Nur Gastronomie-POIs auf der Karte anzeigen
        pointOfInterestFilter: buildPoiFilter("all"),
    });

    // Apples POI-Symbole anklickbar machen
    if (mapkit.MapFeatureType && "selectableMapFeatures" in map) {
        map.selectableMapFeatures = [mapkit.MapFeatureType.PointOfInterest];
    } else {
        console.warn("MapKit: selectableMapFeatures wird von dieser MapKit-Version nicht unterstützt.");
    }

    // Klick auf ein POI -> Detailansicht
    map.addEventListener("select", (event) => {
        const annotation = event.annotation;
        if (annotation && annotation.featureType !== undefined) {
            showMapFeatureDetail(annotation);
        }
    });

    buildFilterChips();
    document.getElementById("placeDetailClose").addEventListener("click", () => {
        map.selectedAnnotation = null;
        hidePlaceDetail();
    });

    locateUser();
}

/* ---------- Standort ---------- */

function locateUser() {
    if (!navigator.geolocation) {
        setHint("");
        return;
    }
    setHint("Standort wird ermittelt …");
    try {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                map.setCenterAnimated(new mapkit.Coordinate(pos.coords.latitude, pos.coords.longitude), false);
                setHint("");
            },
            () => setHint("Kein Standortzugriff – zeige Berlin."),
            { timeout: 8000 }
        );
    } catch (err) {
        console.warn("MapKit: Geolocation nicht verfügbar, zeige Berlin.", err);
        setHint("Kein Standortzugriff – zeige Berlin.");
    }
}

/* ---------- Filter ---------- */

function buildPoiFilter(category) {
    const C = mapkit.PointOfInterestCategory;
    const all = [C.Restaurant, C.Cafe, C.Bakery, C.Brewery, C.Winery, C.Nightlife];
    const selected = category === "all" ? all : [C[category]];
    return mapkit.PointOfInterestFilter.including(selected);
}

function buildFilterChips() {
    const container = document.getElementById("mapFilter");
    const entries = [["all", "Alle"], ...Object.entries(CATEGORY_NAMES)];
    container.innerHTML = "";
    for (const [key, label] of entries) {
        const btn = document.createElement("button");
        btn.className = "filterChip" + (key === activeCategory ? " active" : "");
        btn.textContent = label;
        btn.dataset.category = key;
        btn.addEventListener("click", () => setCategory(key));
        container.appendChild(btn);
    }
}

function setCategory(key) {
    activeCategory = key;
    document.querySelectorAll(".filterChip").forEach((b) =>
        b.classList.toggle("active", b.dataset.category === key)
    );
    map.pointOfInterestFilter = buildPoiFilter(key);
    map.selectedAnnotation = null;
    hidePlaceDetail();
}

/* ---------- Detailansicht ---------- */

// Ersetzt #placeCard durch ein frisches Element. Nötig, weil PlaceDetail eine
// Shadow Root anhängt und ein Element nur eine haben darf (sonst NotSupportedError).
function freshPlaceCard() {
    if (currentPlaceDetail && currentPlaceDetail.destroy) {
        try { currentPlaceDetail.destroy(); } catch (_) { /* ignorieren */ }
    }
    currentPlaceDetail = null;
    const old = document.getElementById("placeCard");
    const card = document.createElement("div");
    card.id = "placeCard";
    old.replaceWith(card);
    return card;
}

// Für ein angeklicktes Apple-POI (MapFeatureAnnotation) den vollständigen Place laden
function showMapFeatureDetail(annotation) {
    const minimal = {
        name: annotation.title || "Unbekannter Ort",
        coordinate: annotation.coordinate,
        pointOfInterestCategory: annotation.pointOfInterestCategory,
    };
    const id = annotation.id;

    if (id && mapkit.PlaceLookup) {
        setHint("Details werden geladen …");
        try {
            new mapkit.PlaceLookup().getPlace(id, (error, place) => {
                if (error || !place) {
                    console.warn("MapKit: PlaceLookup fehlgeschlagen, zeige Basisdaten.", error);
                    showPlaceDetail(minimal);
                } else {
                    showPlaceDetail(place);
                }
                setHint("");
            });
            return;
        } catch (err) {
            console.warn("MapKit: PlaceLookup nicht nutzbar, zeige Basisdaten.", err);
        }
    }
    showPlaceDetail(minimal);
}

function showPlaceDetail(place) {
    const panel = document.getElementById("placeDetail");
    document.getElementById("placeCategory").textContent = categoryName(place.pointOfInterestCategory);
    let card = freshPlaceCard();

    let usedPlaceCard = false;
    if (mapkit.PlaceDetail) {
        // Apple Place Card: Öffnungszeiten, Fotos, Telefon, Website, Bewertungen
        try {
            const colorSchemes = mapkit.PlaceDetail.ColorSchemes || {};
            currentPlaceDetail = new mapkit.PlaceDetail(card, place, {
                colorScheme: colorSchemes.Dark || "dark",
                displaysMap: false,
            });
            usedPlaceCard = true;
        } catch (err) {
            console.warn("MapKit: PlaceDetail konnte nicht erstellt werden, nutze Fallback.", err);
            card = freshPlaceCard();
        }
    }
    if (!usedPlaceCard) {
        // Fallback ohne Öffnungszeiten (ältere MapKit-Version / Place Cards nicht verfügbar)
        card.innerHTML = `
            <div class="placeFallback">
                <h3>${escapeHtml(place.name)}</h3>
                ${place.formattedAddress ? `<p>${escapeHtml(place.formattedAddress)}</p>` : ""}
                ${place.telephone ? `<p><a href="tel:${escapeHtml(place.telephone)}">${escapeHtml(place.telephone)}</a></p>` : ""}
                ${place.urls && place.urls[0] ? `<p><a href="${escapeHtml(place.urls[0])}" target="_blank" rel="noopener">Website</a></p>` : ""}
                <p><a href="https://maps.apple.com/?q=${encodeURIComponent(place.name)}&ll=${place.coordinate.latitude},${place.coordinate.longitude}" target="_blank" rel="noopener">In Apple Karten öffnen</a></p>
            </div>`;
    }
    panel.hidden = false;
}

function hidePlaceDetail() {
    freshPlaceCard();
    document.getElementById("placeDetail").hidden = true;
}

/* ---------- Helfer ---------- */

function setHint(text) {
    const el = document.getElementById("mapHint");
    if (el) el.textContent = text;
}

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// Läuft egal ob das Script im <head> oder am Ende von <body> eingebunden ist
function safeInit() {
    try {
        initMap();
    } catch (err) {
        console.error("MapKit: Fehler beim Initialisieren –", err.name, err.message, err.stack);
        setHint("Karte konnte nicht initialisiert werden.");
    }
}
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", safeInit);
} else {
    safeInit();
}
