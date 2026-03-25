

# Testdata Webapp – Region Stockholm (MVP)

## Översikt
En central webbapp där team inom Region Stockholm kan söka, boka och hantera testpersoner. Svenskt UI med AI-driven promptsökning, interaktiv relationsgraf, bokningssystem och Excel-import.

## Autentisering & Roller
- **Lovable Cloud** för auth (e-post/lösenord)
- Rollsystem med `user_roles`-tabell: `admin` och `viewer`
- Admin: full åtkomst (import, bokning, redigering av dynamiska personer)
- Viewer: läsåtkomst (sökning, persondetaljer, relationer, bokningsstatus)
- RLS-policies på alla tabeller för rollstyrning

## Datamodell (Supabase)
- **persons** – identitet, personnummer, namn, attribut (geografi, HSAid, etc.), `is_static` (boolean), `person_type` (härlett: Personal/Invånare baserat på HSAid)
- **relations** – `person_id`, `related_person_id`, `relation_type`, `valid_from`, `valid_to`
- **bookings** – `person_id`, `booked_by`, `start_time`, `end_time`, `status`
- **import_batches** – staging-data, valideringsstatus, felrapport
- **audit_log** – händelsespårning (importer, bokningar, urval)

## Sidor & Funktionalitet

### 1. Dashboard / Startsida
- Snabbstatistik: antal personer, aktiva bokningar, senaste importer
- Genvägar till sökning och import

### 2. Promptbaserad sökning (FR-2)
- Fritextfält där användare beskriver önskad testperson på svenska
- **Lovable AI** tolkar prompten → översätter till databasfilter
- Deterministisk regelmotor filtrerar och rankar resultat
- Resultat visar person, ID och motivering för urvalet
- Sökhistorik loggas i audit_log

### 3. Personlista & Detaljvy (FR-1)
- Tabell med filtrering och sortering (statisk/dynamisk, persontyp, geografi)
- Tydlig visuell markering: statisk (låsikon) vs dynamisk
- Detaljpanel med alla attribut, bokningsstatus och relationer
- Statiska personer: inga redigeringsalternativ visas

### 4. Bokningssystem (FR-3, FR-4)
- Admin kan boka dynamisk person med start- och sluttid
- Förläng eller avsluta bokning
- Auto-release via scheduled function vid sluttid
- Bokningsstatus synlig för alla (Viewer kan se vem som bokat)
- Redigering av dynamisk person tillåts enbart inom aktiv bokning (Admin)

### 5. Relationsvy (FR-5)
- Interaktiv graf med noder (personer) och kanter (relationer)
- Klickbara noder öppnar persondetaljer
- Relationstyp visas på kanterna
- Bibliotek: React Flow eller liknande för grafvisualisering

### 6. Excel-import (FR-6, Admin)
- Uppladdning av Excel-fil → staging-tabell
- Validering: unika person-ID, obligatoriska fält, kodlistor, relationsreferenser
- Valideringsrapport per rad/fält med felstatus
- Publicering till produktion efter godkänd validering
- Importbatch loggas i audit_log

### 7. Admin-panel
- Användarhantering (tilldela roller)
- Importhistorik och valideringsrapporter
- Audit-logg med sökbarhet

## Tekniska detaljer
- **Frontend**: React + TypeScript + Tailwind + shadcn/ui
- **Backend**: Lovable Cloud (Supabase) – databas, auth, edge functions
- **AI-sökning**: Edge function som anropar Lovable AI Gateway för prompt-tolkning, sedan deterministisk SQL-filtrering
- **Relationsgraf**: React Flow-bibliotek
- **Excel-parsing**: SheetJS (xlsx) i frontend för förhandsgranskning, edge function för validering
- **Auto-release**: Supabase scheduled function (pg_cron) för att frigöra utgångna bokningar

## Design
- Rent, professionellt UI med Region Stockholm-känsla
- Svenskt språk genomgående
- Responsivt men desktop-optimerat (primär användning)
- Tydlig visuell separation mellan statiska och dynamiska personer

