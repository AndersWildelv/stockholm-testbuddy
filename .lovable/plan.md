

# Bokningsflöde – Implementeringsplan

## Översikt
Bygga ett komplett bokningsflöde där användare kan boka testpersoner under en vald tidsperiod, se aktiva bokningar, frigöra dem manuellt, och redigera bokade personers attribut. En ny kolumn `is_bookable` styr vilka personer som kan bokas.

## Databasändringar

1. **Lägg till `is_bookable`-kolumn på `persons`-tabellen**
   - `ALTER TABLE persons ADD COLUMN is_bookable boolean NOT NULL DEFAULT true;`
   - MVP: alla sätts till `true`, men flaggan finns redo för Excel-import

2. **Uppdatera RLS på `bookings`**
   - Lägg till INSERT/UPDATE-policy för `anon`-rollen (eftersom appen inte använder Supabase Auth utan lösenordsgate)
   - Alternativt: alla bokningsoperationer via anon med öppna policies

## Ändringar per fil

### `src/pages/BookingsPage.tsx` – Ombyggnad
- **Bokningsformulär** (dialog): Välj testperson (sökbar dropdown, bara `is_bookable` och ej redan bokade), välj start/slut-datum med DatePicker, valfria anteckningar
- **Bokningslista**: Tabell med alla bokningar, sorterade senaste först. Visar person, tidsperiod, status (Aktiv/Frigiven/Utgången), anteckningar
- **Åtgärdsknappar per rad**: "Frigör" (sätter status till `released`), "Förläng" (ändra sluttid)
- Automatisk statusberäkning: om `end_time < now()` → visa som "Utgången"

### `src/pages/PersonsPage.tsx` – Mindre tillägg
- Visa bokningsstatus per person (kolumn "Bokad" med badge)
- Lägg till "Boka"-knapp som öppnar bokningsdialog direkt för den personen
- Visa `is_bookable`-flagga (kolumnfilter)

### `src/pages/PersonDetailPage.tsx` – Ny sida (eller dialog)
- Visas när man klickar på en bokad person
- Om personen har aktiv bokning: tillåt redigering av personattribut (namn, adress, etc.)
- Om ej bokad: skrivskyddat

### Importstöd
- Uppdatera Excel-importen så att `is_bookable`-kolumnen mappas om den finns i filen

## Flöde

```text
Personregister                    Bokningssida
┌──────────────┐                 ┌──────────────────┐
│ Lista alla   │  "Boka" →       │ + Ny bokning     │
│ testpersoner │                 │                  │
│ [Bokad/Ledig]│                 │ Aktiva bokningar │
│              │                 │ ┌──────────────┐ │
│              │                 │ │ Person X     │ │
│              │                 │ │ 29/3 → 5/4   │ │
│              │                 │ │ [Frigör]     │ │
│              │                 │ └──────────────┘ │
└──────────────┘                 └──────────────────┘
```

## Tekniska detaljer

- **DatePicker**: Använder shadcn Calendar i Popover med `pointer-events-auto`
- **Personväljare**: Combobox/Command-komponent med sökfunktion, filtrerar bort redan bokade och ej bokningsbara
- **Statuslogik i frontend**: Beräkna om bokning är utgången baserat på `end_time < new Date()`
- **RLS-anpassning**: Nya policies för `anon`-rollen att kunna INSERT och UPDATE på `bookings`-tabellen (krävs pga lösenordsbaserad auth)
- **Supabase-query**: `bookings` med join mot `persons` för namn och attribut

