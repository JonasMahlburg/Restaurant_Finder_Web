// Vorlage: Kopiere diese Datei nach `mapkit-config.js` und trage deine Tokens ein.
// `mapkit-config.js` ist in .gitignore und wird NICHT committet.
//
// Token erstellen: developer.apple.com → Certificates, Identifiers & Profiles
// → Identifiers → deine Maps ID → MapKit JS → "Create Token"
// Pro Origin (Schema + Host + Port) ein eigenes Token anlegen.
const MAPKIT_TOKENS = {
    "http://localhost:8000": "HIER_LOCALHOST_TOKEN",
    "https://restaurant-finder.jonas-mahlburg.de": "HIER_LIVE_TOKEN",
};

window.MAPKIT_TOKEN = MAPKIT_TOKENS[location.origin] || "";
if (!window.MAPKIT_TOKEN) {
    console.error(`MapKit: Kein Token für Origin "${location.origin}" hinterlegt. Bekannte Origins:`, Object.keys(MAPKIT_TOKENS));
}
