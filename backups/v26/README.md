# Fiks Hjem v26 – original sikkerhetskopi

`fiks-hjem-v26.zip` er den uendrede filen som eieren lastet opp 10. oktober 2026. SHA-256 finnes i `manifest.json`. ZIP-filens CRC-kontroll bestod for alle 151 filer. Dette er en arkivkontroll, ikke en kjøretidstest av appen.

## Gjenoppretting

1. Last ned ZIP-filen fra GitHub og pakk den ut i en ny lokal mappe.
2. Les `AGENTS.md`, `README.md` og `DEGISIKLIKLER-v26-TR.md` før endringer.
3. Bruk prosjektets egne installasjons- og testinstruksjoner. `npm install` trenger nettverk og kjører avhengighetenes installasjonssteg.
4. iOS krever Mac/Xcode, riktig signering og egen enhetstest. Ingen ferdig signert iOS-app følger med.

Ingen appkilde er endret i denne sikkerhetskopien. `node_modules/`, personlig prosjektlager og signeringsnøkler følger ikke med i pakken. Et begrenset søk etter kjente tjenestenøkler/private nøkkelfiler ga ingen treff; dette erstatter ikke en full sikkerhetsrevisjon.
