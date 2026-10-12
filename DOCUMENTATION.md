# Stan Floty — Dokumentacja Techniczna i Architektoniczna

> Kompleksowa dokumentacja systemu **Stan Floty**: multi-tenant B2B SaaS dla wypożyczalni (pojazdy, maszyny budowlane, sprzęt eventowy, narzędzia).

---

## Spis Treści

1. [Przegląd Projektu i Misja](#1-przegląd-projektu-i-misja)
2. [Stack Technologiczny](#2-stack-technologiczny)
3. [Architektura Systemu i Poruszanie się po Projekcie](#3-architektura-systemu-i-poruszanie-się-po-projekcie)
4. [Baza Danych i Model Relacyjny](#4-baza-danych-i-model-relacyjny)
5. [Autoryzacja, Uwierzytelnianie i Multi-Tenancy](#5-autoryzacja-uwierzytelnianie-i-multi-tenancy)
6. [Reguły Finansowe i Silnik Cenowy](#6-reguły-finansowe-i-silnik-cenowy)
7. [Cykl Życia Wypożyczenia i Dostępność Zasobów](#7-cykl-życia-wypożyczenia-i-dostępność-zasobów)
8. [Moduły Aplikacji i Server Actions](#8-moduły-aplikacji-i-server-actions)
9. [Pliki i Storage (Supabase Storage)](#9-pliki-i-storage-supabase-storage)
10. [Środowisko Developerskie (Lokalne) i Baza Danych w Terminalu](#10-środowisko-developerskie-lokalne-i-baza-danych-w-terminalu)
11. [Środowisko Produkcyjne i Wdrożenie](#11-środowisko-produkcyjne-i-wdrożenie)
12. [Zestawienie Komend: Dev vs Produkcja](#12-zestawienie-komend-dev-vs-produkcja)
13. [Zasady Kodowania i Standardy Bezpieczeństwa](#13-zasady-kodowania-i-standardy-bezpieczeństwa)
14. [Ważne Wskazówki i Troubleshooting](#14-ważne-wskazówki-i-troubleshooting)

---

## 1. Przegląd Projektu i Misja

**Stan Floty** to aplikacja internetowa (mobile-first Web App) zaprojektowana dla polskich firm wynajmujących zasoby:
- Wypożyczalnie samochodów i przyczep
- Wypożyczalnie sprzętu budowlanego i maszyn
- Wypożyczalnie sprzętu eventowego i nagłośnienia
- Wypożyczalnie narzędzi ogrodniczych i remontowych

### Główne cele biznesowe:
- **Zastąpienie arkuszy Excel** jednym, zsynchronizowanym panelem operacyjnym.
- **Dynamiczna kontrola dostępności:** automatyczna zmiana statusów, blokada konfliktów datowych i ochrona przed podwójnym wynajmem tego samego zasobu (double-booking).
- **Szybkie wydania i zwroty:** intuicyjny proces rejestracji wynajmu (check-out) oraz zakończenia (check-in).
- **Elastyczne przedłużenia umów (Extensions):** jednoetapowe wydłużenie terminu z automatycznym doliczeniem kwoty.
- **Płatności częściowe i księga wpłat:** przejrzyste śledzenie statusów opłacenia (`UNPAID`, `PARTIALLY_PAID`, `PAID`) w oparciu o niemutowalne wpisy transakcyjne.

---

## 2. Stack Technologiczny

| Warstwa | Technologia | Opis |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | React Server Components, Server Actions, Route Handlers |
| **Frontend Core** | React 19, TypeScript | Ścisłe typowanie (`no any`), `server-only` na backendzie |
| **Styling & UI** | Tailwind CSS v4, shadcn/ui | Komponenty Radix UI, ikony Lucide, toasty Sonner |
| **Baza danych** | PostgreSQL 17 (Supabase) | Transakcje SQL, check constraints, enumy |
| **ORM & Migracje** | Drizzle ORM + Drizzle Kit | Type-safe query builder, migracje SQL w `drizzle/` |
| **Auth** | Supabase Auth (`@supabase/ssr`) | Sesje oparte o ciasteczka HTTP-only, weryfikacja JWT w proxy middleware |
| **Object Storage** | Supabase Storage | Przechowywanie zdjęć sprzętu i załączników umów (PDF, obrazy) |
| **Walidacja** | Zod (v4) | Rygorystyczna walidacja po stronie serwera |
| **Testy** | Vitest | Szybkie testy jednostkowe reguł cenowych i walidacji |
| **Strefa czasowa** | `Europe/Warsaw` | Aplikacja operuje w polskiej strefie czasowej, baza w UTC |


---

## 3. Architektura Systemu i Poruszanie się po Projekcie

Aplikacja oparta jest na ścisłym podziale odpowiedzialności (Separation of Concerns):

```text
stan-floty/
├── app/                              # Next.js App Router
│   ├── (auth)/                       # Ścieżki autoryzacyjne: /logowanie, /rejestracja
│   ├── (dashboard)/                  # Chroniony panel aplikacji
│   │   ├── panel/                    # Strona główna dashboardu (KPI, najbliższe zwroty)
│   │   ├── przedmioty/               # Flota zasobów, widok listy i filtrów
│   │   │   └── [id]/                 # Szczegóły zasobu, kalendarz, statystyki finansowe
│   │   ├── wypozyczenia/             # Lista umów, filtry statusów i płatności
│   │   └── ustawienia/               # Profil, hasło, dane firmy (NIP), zespół
│   ├── (marketing)/                  # Strony publiczne: landing page, cennik, info
│   ├── api/auth/                     # Endpointy autoryzacji: callback, logout
│   └── globals.css                   # Globalne style Tailwind CSS
├── components/                       # Komponenty UI
│   ├── modules/                      # Komponenty modułowe (items, rentals, settings)
│   └── ui/                           # Prymitywy shadcn/ui (button, dialog, input itp.)
├── db/                               # Konfiguracja Drizzle ORM
│   ├── schema/                       # Definicje tabel i relacji
│   └── index.ts                      # Klient połączenia z bazą (postgres.js + drizzle)
├── drizzle/                          # Pliki migracji SQL generowane przez drizzle-kit
├── lib/                              # Logika pomocnicza i serwerowa
│   ├── auth.ts                       # requireAuthenticatedUser, requireRole
│   ├── pricing.ts                    # Silnik kalkulacji dni/godzin i kwot
│   ├── utils.ts                      # Formatowanie walut (grosze -> PLN), cn
│   ├── supabase/                     # Fabryki klientów Supabase (server, client, admin, proxy)
│   └── validations/                  # Schematy Zod dla mutacji
├── server/
│   └── actions/                      # Server Actions (auth, items, rentals, settings)
├── supabase/                         # Konfiguracja lokalnego środowiska Supabase (config.toml)
├── types/                            # Globalne definicje TypeScript
└── __tests__/                        # Testy automatyczne (pricing, walidacje)
```

### 3.1. Gdzie co znaleźć i gdzie dodawać nowy kod?
- **Nowy widok w panelu:** Dodaj katalog w `app/(dashboard)/twoja-nazwa/page.tsx`. Pamiętaj, że layout chroniony jest automatycznie przez `middleware.ts`.
- **Nowa operacja backendowa:** Stwórz funkcję z dyrektywą `"use server"` w `server/actions/`. Zawsze wywołaj `requireAuthenticatedUser()` lub `requireRole(...)`.
- **Nowa encja lub zmiana kolumny w bazie:** Zdefiniuj schemat w `db/schema/`, a następnie uruchom `pnpm db:generate` i `pnpm db:migrate`.
- **Walidacja formularza:** Umieszczaj schematy Zod w `lib/validations/nazwa.ts` i reużywaj ich zarówno na froncie, jak i w Server Action.
- **Interfejsy i typy domenowe:** Dodawaj do `types/`. Pamiętaj o zakazie używania `any`.
- **Komponenty widoków:** Komponenty specyficzne dla modułu umieszczaj w `components/modules/modul/`, a generyczne klocki UI w `components/ui/`.

### 3.2. Standardowy przepływ danych (Data Flow)
Każda mutacja w systemie przebiega według jednego, bezpiecznego schematu:
```text
1. [Formularz UI / Dialog]       -> Przesyła dane przez Server Action
2. [Server Action]               -> Waliduje dane schematem Zod (lib/validations/)
3. [requireRole / Auth Guard]    -> Sprawdza uprawnienia i wyciąga zaufany tenant_id
4. [Drizzle Transaction]         -> Wykonuje operację w transakcji atomowej (db/schema/)
5. [Next.js Cache Revalidation]  -> revalidatePath() odświeża dane na ekranie
6. [Klient / Sonner]             -> Wyświetla powiadomienie sukcesu lub błędu w języku polskim
```

---

## 4. Baza Danych i Model Relacyjny

Wszystkie klucze główne to `UUID` generowane losowo (`defaultRandom()`). Wszystkie tabele operacyjne zawierają klucz obcy `tenant_id` odwołujący się do tabeli `tenants`.

```text
 tenants (Organizacja)
    │
    ├──< users (Pracownicy, powiązani z auth.users Supabase)
    │
    ├──< items (Zasoby / Flota)
    │       │
    │       └──< rentals (Wypożyczenia)
    │               │
    │               ├──< rental_extensions (Przedłużenia)
    │               └──< payments (Księga wpłat)
```

### Szczegółowy opis tabel

#### 1. `tenants` (Organizacje)
- `id` (UUID, PK) — unikalny identyfikator tenanta
- `name` (TEXT) — nazwa firmy wypożyczalni
- `nip` (TEXT, nullable) — numer NIP firmy
- `currency` (TEXT, default 'PLN') — waluta rozliczeniowa
- `plan` (TEXT, default 'STARTER') — plan abonamentowy (`STARTER`, `PRO`, `BUSINESS`)
- `created_at` / `updated_at` (TIMESTAMPTZ) — znaczniki czasu

#### 2. `users` (Pracownicy i Administratorzy)
- `id` (UUID, PK) — zgodny 1:1 z ID użytkownika w `auth.users` Supabase
- `tenant_id` (UUID, FK -> tenants.id) — organizacja pracownika
- `email` (TEXT) — adres e-mail logowania
- `role` (`user_role`: `ADMIN`, `OWNER`, `MANAGER`, `STAFF`) — rola uprawnień w systemie
- `full_name` (TEXT) — imię i nazwisko
- `created_at` / `updated_at` (TIMESTAMPTZ) — znaczniki czasu

#### 3. `items` (Zasoby / Przedmioty)
- `id` (UUID, PK) — identyfikator zasobu
- `tenant_id` (UUID, FK -> tenants.id) — izolacja organizacji
- `name` (TEXT) — nazwa (np. "Toyota Corolla 2024", "Zagęszczarka 100kg")
- `category` (TEXT) — kategoria sprzętu
- `identifier` (TEXT) — unikalny identyfikator sprzętu: nr rejestracyjny, VIN, nr seryjny
- `rate` (INTEGER) — **stawka cennikowa w groszach** (np. `15000` = 150.00 PLN)
- `rate_unit` (`rate_unit`: `HOUR`, `DAY`, `WEEK`, `MONTH`) — jednostka rozliczeniowa
- `status` (`item_status`: `AVAILABLE`, `RENTED`, `MAINTENANCE`) — stan operacyjny
- `image_url` (TEXT, nullable) — publiczny URL do zdjęcia w Supabase Storage
- `gallery` / `metadata` (JSONB, nullable) — dodatkowe zdjęcia i parametry

#### 4. `rentals` (Wypożyczenia)
- `id` (UUID, PK) — identyfikator umowy
- `tenant_id` (UUID, FK -> tenants.id) — izolacja organizacji
- `item_id` (UUID, FK -> items.id) — wypożyczony zasób
- `customer_name`, `customer_phone`, `customer_identifier` (TEXT) — zdenormalizowane dane klienta (Imię, Telefon, PESEL/NIP)
- `start_date`, `end_date`, `initial_end_date` (TIMESTAMPTZ) — ramy czasowe umowy
- `rate_snapshot` (INTEGER) — **niezmienna stawka w groszach** z momentu umowy
- `rate_unit_snapshot` (`rate_unit`) — **niezmienna jednostka rozliczeniowa**
- `total_price` (INTEGER) — **łączna należność w groszach** (aktualizowana przy aneksach)
- `status` (`rental_status`: `ACTIVE`, `COMPLETED`, `CANCELLED`) — stan umowy
- `attachments` (JSONB, nullable) — tablica załączników `{ url, name, uploadedAt }`

*Ograniczenia tabeli rentals (CHECK constraints):*
- `total_price >= 0`
- `rate_snapshot > 0`
- `end_date > start_date`

#### 5. `rental_extensions` (Przedłużenia Umów)
- `id` (UUID, PK) — identyfikator aneksu
- `rental_id` (UUID, FK -> rentals.id) — powiązane wypożyczenie
- `previous_end_date` (TIMESTAMPTZ) — poprzedni termin zwrotu
- `new_end_date` (TIMESTAMPTZ) — nowy termin zwrotu (`new_end_date > previous_end_date`)
- `additional_cost` (INTEGER) — dodatkowy koszt w groszach (`additional_cost >= 0`)

#### 6. `payments` (Księga Płatności)
- `id` (UUID, PK) — identyfikator wpłaty
- `rental_id` (UUID, FK -> rentals.id) — powiązane wypożyczenie
- `tenant_id` (UUID, FK -> tenants.id) — izolacja organizacji
- `amount` (INTEGER) — **kwota wpłaty w groszach** (`amount > 0`)
- `method` (`payment_method`: `CASH`, `CARD`, `BLIK`, `TRANSFER`) — metoda płatności
- `paid_at` (TIMESTAMPTZ) — data wpłaty


---

## 5. Autoryzacja, Uwierzytelnianie i Multi-Tenancy

### 5.1. Multi-Tenancy
Multi-tenancy w Stanie Floty jest **bezwzględną regułą architektury**:
- Klient nigdy nie podaje parametru `tenant_id` w żadnym requeście ani formularzu.
- `tenant_id` jest **zawsze** pobierany na serwerze z uwierzytelnionej sesji użytkownika przez `requireAuthenticatedUser()`.
- Wszystkie zapytania bazodanowe (SELECT, INSERT, UPDATE, DELETE) zawierają klauzulę `where(eq(table.tenantId, user.tenantId))`.
- Próby odpytania lub zmutowania rekordu innego tenanta kończą się błędem `NOT_FOUND` lub odmową dostępu.

### 5.2. Role i Macierz Uprawnień (RBAC)

System definiuje 4 poziomy ról:

1. **`ADMIN` (Administrator platformy / Superadmin):**
   - Dostęp do panelu administracyjnego `/admin`
   - Wyłączność na rejestrację nowych wypożyczalni (`/rejestracja` i Server Action `signup` / `createTenantByAdmin`)
   - Podgląd wszystkich zarejestrowanych wypożyczalni wraz ze zgrupowaną listą użytkowników
   - Tworzenie i usuwanie wypożyczalni
   - Tworzenie użytkowników w dowolnej wypożyczalni z dowolną rolą
   - Zmiana ról użytkowników
   - Reset/zmiana haseł użytkowników (**kategorycznie brak podglądu istniejących haseł** — operacja wyłącznie zapisu nowego hasła w Supabase Auth)
   - Usuwanie użytkowników z systemu aplikacji oraz Supabase Auth
2. **`OWNER` (Właściciel):**
   - Pełna kontrola nad swoją organizacją
   - Zarządzanie danymi firmy (nazwa, NIP)
   - Zarządzanie zespołem: zapraszanie pracowników (`createMember`), usuwanie użytkowników (`removeMember`)
   - Zarządzanie flotą zasobów i wypożyczeniami
3. **`MANAGER` (Kierownik):**
   - Tworzenie, edycja i usuwanie zasobów (`items`)
   - Pełna obsługa wypożyczeń (wydania, przedłużenia, rejestracja płatności, zwroty, anulacje)
   - Brak dostępu do zarządzania użytkownikami organizacji
4. **`STAFF` (Pracownik operacyjny):**
   - Podgląd floty zasobów
   - Obsługa wypożyczeń: tworzenie wypożyczeń, przyjmowanie zwrotów, rejestrowanie wpłat, przedłużanie terminów
   - Brak uprawnień do dodawania, edycji lub usuwania zasobów w cenniku

| Akcja / Operacja | ADMIN | OWNER | MANAGER | STAFF |
|---|:---:|:---:|:---:|:---:|
| Dostęp do Panelu Admina (`/admin`) | ✅ | ❌ | ❌ | ❌ |
| Rejestracja nowej wypożyczalni (`/rejestracja`, `signup`) | ✅ | ❌ | ❌ | ❌ |
| Tworzenie / usuwanie wypożyczalni | ✅ | ❌ | ❌ | ❌ |
| Zmiana hasła innemu użytkownikowi | ✅ | ❌ | ❌ | ❌ |
| Zmiana roli użytkownika | ✅ | ❌ | ❌ | ❌ |
| Podgląd zasobów i kalendarza | ✅ | ✅ | ✅ | ✅ |
| Dodawanie / edycja / usuwanie zasobów (`items`) | ✅ | ✅ | ✅ | ❌ |
| Tworzenie wypożyczenia (`createRental`) | ✅ | ✅ | ✅ | ✅ |
| Przedłużanie umowy (`extendRental`) | ✅ | ✅ | ✅ | ✅ |
| Rejestracja wpłaty (`recordPayment`) | ✅ | ✅ | ✅ | ✅ |
| Zakończenie wynajmu / zwrot (`completeRental`) | ✅ | ✅ | ✅ | ✅ |
| Anulowanie wynajmu (`cancelRental`) | ✅ | ✅ | ✅ | ✅ |
| Edycja danych organizacji (NIP, nazwa) | ✅ | ✅ | ❌ | ❌ |
| Zapraszanie i usuwanie pracowników w organizacji | ✅ | ✅ | ❌ | ❌ |
| Zmiana własnego hasła i profilu | ✅ | ✅ | ✅ | ✅ |

### 5.3. Mechanizm Uwierzytelniania i Zamkniętej Rejestracji
1. **Model zamkniętej rejestracji (B2B SaaS):**
   - Publiczna rejestracja kont z zewnątrz jest całkowicie zablokowana.
   - Trasa `/rejestracja` jest chroniona na poziomie serwera — niezalogowani użytkownicy są przekierowywani na `/logowanie`, a zalogowani użytkownicy bez roli `ADMIN` na `/panel`.
   - Server Actions `signup` oraz `createTenantByAdmin` weryfikują uprawnienia wywołaniem `requireRole("ADMIN")`.
2. **Rejestracja wypożyczalni przez Administratora (`signup` / `createTenantByAdmin`):**
   - W jednej transakcji tworzony jest użytkownik w Supabase Auth (Admin API), wpis w tabeli `tenants` oraz rekord właściciela w tabeli `users` z rolą `OWNER`.
3. **Logowanie (`login`):**
   - Weryfikacja poświadczeń przez `supabase.auth.signInWithPassword`. Ciasteczka sesyjne są zapisywane w przeglądarce.
4. **Middleware (`middleware.ts` & `proxy.ts`):**
   - Weryfikuje sesję użytkownika i token JWT.
   - Przekierowuje nieuwierzytelnionych użytkowników z tras dashboardu oraz z `/rejestracja` na `/logowanie`.
   - Przekierowuje zalogowanych użytkowników z `/logowanie` na `/panel`.
5. **Server Actions Guard (`lib/auth.ts`):**
   - `requireAuthenticatedUser()`: pobiera użytkownika z sesji Supabase, znajduje rekord w tabeli `users` i zwraca kontekst `{ userId, tenantId, role, email, fullName }`.
   - `requireRole(...roles)`: sprawdza rolę RBAC, rzucając wyjątek `FORBIDDEN` w razie braku uprawnień.
   - Wywołania opakowane są w React `cache()`, co deduplikuje zapytania SQL w trakcie jednego cyklu renderowania strony.


---

## 6. Reguły Finansowe i Silnik Cenowy

### 6.1. Zapis kwot w groszach (Integer Grosz)
Wszystkie kwoty w bazie danych i kodzie backendu są liczbami całkowitymi wyrażonymi w **groszach** (np. `100 PLN = 10000 groszy`).
Nigdy nie stosuje się typu `float` ani `number` z częścią ułamkową w operacjach finansowych, co eliminuje błędy zaokrągleń zmiennoprzecinkowych IEEE-754.

Konwersja do wyświetlania w UI:
```ts
export function formatCurrency(grosz: number): string {
  return `${(grosz / 100).toFixed(2)} PLN`;
}
```

### 6.2. Jednostki rozliczeniowe i okres karencji (Grace Period)
Kalkulator jednostek rozliczeniowych (`lib/pricing.ts`) obsługuje 4 tryby:
- **`HOUR`:** Każda rozpoczęta godzina zaokrąglana w górę (`Math.ceil(diffMs / HOUR_MS)`).
- **`DAY` (Doba 24h):** Cykle 24-godzinne od godziny rozpoczęcia.
  - Zaimplementowano **59-minutowy okres karencji (Grace Period)**.
  - Przykład: Wypożyczenie od 10:00 dnia 1 do 10:45 dnia 2 liczone jest jako **1 doba** (opóźnienie do 59 minut nie nalicza kolejnej doby).
  - Wynajem od 10:00 dnia 1 do 11:05 dnia 2 przekracza karencję i liczone jest jako **2 doby**.
- **`WEEK`:** Cykle 7-dniowe (7 × 24h), reszta zaokrąglana w górę.
- **`MONTH`:** Pełne miesiące kalendarzowe, reszta zaokrąglana w górę.

### 6.3. Snapshotowanie Stawek (Rate Snapshotting)
W momencie podpisywania umowy wynajmu system zapisuje w rekordzie wypożyczenia:
- `rate_snapshot`: aktualną stawkę zasobu w groszach,
- `rate_unit_snapshot`: jednostkę rozliczeniową.

Dzięki temu późniejsza zmiana cennika danego przedmiotu nie zmienia kosztu trwających lub archiwalnych wypożyczeń. Ewentualne przedłużenia (`extendRental`) są również naliczane po pierwotnej stawce z umowy (`rate_snapshot`).

### 6.4. Dynamiczny Status Płatności i Księga Finansowa
Status płatności nie jest zapisaną kolumną w tabeli wypożyczeń — jest wyliczany w czasie rzeczywistym na podstawie sumy zarejestrowanych wpłat w relacji `payments`:

- **Suma wpłat (Total Paid):** $\sum \text{payments.amount}$
- **Saldo do zapłaty (Balance Due):** $\text{rental.total\_price} - \text{Total Paid}$

Statusy:
- **`PAID`:** $\text{Balance Due} \le 0$
- **`PARTIALLY_PAID`:** $\text{Total Paid} > 0$ oraz $\text{Balance Due} > 0$
- **`UNPAID`:** $\text{Total Paid} = 0$

Tabela `payments` stanowi **niemutowalną księgę transakcji (Immutable Ledger)**. Poprawki i zwroty nie usuwają historii, lecz są rejestrowane jako nowe wpisy.

---

## 7. Cykl Życia Wypożyczenia i Dostępność Zasobów

### 7.1. Stany Wypożyczenia i Zasobu
- `items.status`: `AVAILABLE` (wolny) | `RENTED` (w użyciu) | `MAINTENANCE` (serwis)
- `rentals.status`: `ACTIVE` (aktywne) | `COMPLETED` (zakończone) | `CANCELLED` (anulowane)

### 7.2. Blokada Konfliktów Datowych (Double-Booking Prevention)
Podczas tworzenia wypożyczenia serwer sprawdza, czy dla danego przedmiotu nie istnieje inne aktywne wypożyczenie kolidujące w wybranym przedziale czasowym:
```sql
WHERE item_id = :itemId
  AND tenant_id = :tenantId
  AND status != 'CANCELLED'
  AND start_date < :newEndDate
  AND end_date > :newStartDate
```
Jeżeli istnieje nakładający się termin, operacja zostaje odrzucona z komunikatem błędu.

### 7.3. Operacje Cyklu Życia
1. **Wydanie zasobu (`createRental`):**
   - Sprawdzenie dostępności zasobu (nie może być w `MAINTENANCE` ani mieć kolizji dat).
   - Obliczenie ceny z opcją nadpisania (`totalPriceOverride`).
   - W transakcji atomowej: utworzenie rekordu w `rentals` oraz ustawienie `items.status = 'RENTED'`.
2. **Przedłużenie (`extendRental`):**
   - Obliczenie dodatkowych jednostek rozliczeniowych między starym a nowym terminem.
   - Wyliczenie dodatkowego kosztu: $\Delta \text{units} \times \text{rate\_snapshot}$.
   - W transakcji: aktualizacja `rentals.end_date`, zwiększenie `rentals.total_price` oraz utworzenie rekordu w `rental_extensions`.
   - Opcjonalnie: natychmiastowe zarejestrowanie wpłaty w `payments`.
3. **Zakończenie (`completeRental`):**
   - W transakcji atomowej: zmiana `rentals.status = 'COMPLETED'` oraz przywrócenie `items.status = 'AVAILABLE'`.
4. **Anulowanie (`cancelRental`):**
   - Zwalnia zasób (`items.status = 'AVAILABLE'`) i ustawia `rentals.status = 'CANCELLED'`, zachowując historię wpłat w audycie.


---

## 8. Moduły Aplikacji i Server Actions

### 8.1. Autoryzacja (`server/actions/auth.ts`)
- `signup(formData)`: tworzy konto w Supabase Auth + organizację (`tenants`) + usera (`users`, rola `OWNER`).
- `login(formData)`: logowanie email/hasło w Supabase Auth.
- `logout()`: wylogowanie z sesji i przekierowanie na stronę logowania.

### 8.2. Zarządzanie Flotą (`server/actions/items.ts`)
- `createItem(formData)`: dodanie nowego zasobu ze zdjęciem (wymaga roli `OWNER` lub `MANAGER`).
- `getItems({ page, search, status })`: paginowana lista zasobów z wyszukiwaniem po nazwie/kategorii i filtrowaniem po statusie.
- `updateItem(id, formData)`: edycja parametrów zasobu i opcjonalna wymiana zdjęcia w Storage.
- `deleteItem(id)`: bezpieczne usunięcie zasobu (odrzucane, jeśli istnieją powiązane umowy).

### 8.3. Obsługa Wypożyczeń (`server/actions/rentals.ts`)
- `createRental(formData)`: utworzenie umowy z blokadą kolizji datowych i kalkulacją ceny.
- `getRentals({ page, search, status, paymentStatus, itemId })`: zaawansowana lista z relacjami, wyliczoną sumą wpłat i statusami płatności.
- `extendRental(formData)`: aneks przedłużający czas trwania umowy.
- `recordPayment(formData)`: zarejestrowanie wpłaty gotówką, kartą, BLIKiem lub przelewem.
- `completeRental(id)`: zwrot zasobu i zamknięcie umowy.
- `cancelRental(id)`: anulowanie umowy i zwolnienie zasobu.
- `uploadRentalAttachment(rentalId, formData)`: wgranie załącznika (PDF, JPEG, PNG itp.) do umowy.
- `deleteRentalAttachment(rentalId, attachmentUrl)`: usunięcie załącznika ze Storage i rekordu umowy.

### 8.4. Ustawienia i Zespół (`server/actions/settings.ts`)
- `updateProfile(formData)`: aktualizacja imienia i nazwiska zalogowanego użytkownika.
- `updatePassword(formData)`: zmiana hasła w Supabase Auth.
- `getOrganization()` / `updateOrganization(formData)`: odczyt i edycja nazwy firmy oraz NIP (tylko `OWNER`).
- `getTeamMembers()`: lista członków organizacji (tylko `OWNER`).
- `createMember(formData)`: utworzenie nowego konta pracownika przez Supabase Admin API z przypisaniem roli (`MANAGER` / `STAFF`).
- `removeMember(memberId)`: usunięcie konta pracownika z bazy i auth (z blokadą usunięcia samego siebie).

---

## 9. Pliki i Storage (Supabase Storage)

Pliki binarne **nigdy nie są przechowywane bezpośrednio w bazie danych**.
Do obsługi plików służy usługa **Supabase Storage** (bucket `items`).

### Organizacja ścieżek w buckecie:
- **Zdjęcia zasobów:** `{tenant_id}/{timestamp}-{random}.{ext}`
- **Załączniki do wypożyczeń:** `{tenant_id}/rentals/{rental_id}/{timestamp}-{random}.{ext}`

### Ograniczenia i bezpieczeństwo:
- **Rozmiar pliku:** maksymalnie 10 MB na plik.
- **Dozwolone typy MIME:** `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `application/pdf`.
- **Izolacja:** Ścieżka pliku zawiera identyfikator `tenantId`, uniemożliwiając nadpisywanie plików pomiędzy organizacjami.


---

## 10. Środowisko Developerskie (Lokalne) i Baza Danych w Terminalu

Z racji ograniczeń darmowego planu Supabase (1 baza w chmurze), środowisko developerskie uruchamiane jest w całości lokalnie za pomocą **Supabase CLI** i **Dockera**.

### 10.1. Jak działa lokalny stos Supabase?
Polecenie `pnpm supabase:start` powołuje zestaw lekkich kontenerów Docker:
- **`supabase_db_stan-floty` (PostgreSQL 17):** Główna baza danych ze schematami `public`, `auth`, `storage`.
- **`supabase_auth_stan-floty` (GoTrue):** Silnik autentykacji obsługujący rejestrację, tokeny JWT i sesje.
- **`supabase_storage_stan-floty`:** API obiektowe dla plików i obrazów (zgodne z S3).
- **`supabase_kong_stan-floty` (Kong Gateway):** Główna brama API łącząca wszystkie usługi pod jednym portem `54321`.
- **`supabase_studio_stan-floty`:** Webowy panel administracyjny Supabase na porcie `54323`.
- **`supabase_mailpit_stan-floty`:** Lokalny serwer SMTP z webmailem na porcie `54324` przechwytujący maile aktywacyjne.

#### Porty i adresy lokalne:
| Usługa | Adres / Port | Przeznaczenie |
|---|---|---|
| **Kong API Gateway** | `http://127.0.0.1:54321` | Główny endpoint Supabase URL (`NEXT_PUBLIC_SUPABASE_URL`) |
| **Baza PostgreSQL** | `127.0.0.1:54322` | Bezpośrednie połączenie SQL (`DATABASE_URL`) |
| **Supabase Studio GUI** | `http://127.0.0.1:54323` | Graficzny panel bazy danych, auth i storage |
| **Mailpit Webmail** | `http://127.0.0.1:54324` | Podgląd e-maili systemowych (rejestracja, reset hasła) |

---

### 10.2. Poruszanie się po lokalnej bazie danych w terminalu

#### 1. Wejście do konsoli PostgreSQL (`psql`)
Najprostszy sposób bez konieczności instalowania `psql` na maszynie to wejście bezpośrednio przez kontener Dockera:
```bash
docker exec -it supabase_db_stan-floty psql -U postgres -d postgres
```
Alternatywnie, mając zainstalowanego klienta `psql` na systemie:
```bash
psql -h 127.0.0.1 -p 54322 -U postgres -d postgres
# Domyślne hasło lokalne: postgres
```

#### 2. Podstawowe komendy w konsoli `psql`
- `\dt` — wyświetla listę tabel w schemacie `public` (`items`, `rentals`, `users` itd.)
- `\d nazwa_tabeli` — opis struktury tabeli (np. `\d items`, `\d rentals`), typy kolumn, klucze i ograniczenia
- `\dn` — lista schematów w bazie (`public`, `auth`, `storage`, `extensions`)
- `\du` — lista użytkowników i ról w PostgreSQL
- `\x` — przełączenie widoku rozszerzonego (bardzo wygodne przy czytaniu szerokich wierszy z wieloma kolumnami)
- `\q` — wyjście z konsoli `psql`

#### 3. Przykładowe zapytania diagnostyczne w terminalu:
```sql
-- 1. Podgląd zarejestrowanych organizacji (tenants)
SELECT id, name, nip, plan, created_at FROM tenants;

-- 2. Podgląd pracowników i ich ról
SELECT id, email, full_name, role, tenant_id FROM users;

-- 3. Sprawdzenie stanu floty zasobów
SELECT id, name, identifier, rate, rate_unit, status FROM items;

-- 4. Zestawienie umów z wyliczonym statusem płatności
SELECT 
  r.id,
  r.customer_name,
  r.total_price,
  r.status,
  COALESCE(SUM(p.amount), 0) AS total_paid,
  (r.total_price - COALESCE(SUM(p.amount), 0)) AS balance_due
FROM rentals r
LEFT JOIN payments p ON p.rental_id = r.id
GROUP BY r.id;
```

#### 4. Jednolinijkowe wykonanie zapytania z terminala (bez wchodzenia w interaktywną konsolę)
Możesz szybko sprawdzić dane bezpośrednio z PowerShell / Bash:
```bash
docker exec -i supabase_db_stan-floty psql -U postgres -d postgres -c "SELECT name, status, rate FROM items;"
```

---

### 10.3. Interfejsy Graficzne w środowisku Dev
1. **Supabase Studio (`http://127.0.0.1:54323`):**
   - Wbudowane w lokalny stos, w 100% zgodne z panelem chmurowym Supabase.
   - Umożliwia edycję tabel, przeglądanie użytkowników w zakładce **Authentication** oraz podgląd plików w **Storage**.
2. **Drizzle Studio (`pnpm db:studio`):**
   - Interfejs dedykowany dla schematu Drizzle ORM.
   - Uruchamia lokalny serwer i pozwala nawigować po powiązaniach relacyjnych tabel.
3. **Mailpit (`http://127.0.0.1:54324`):**
   - Narzędzie do przechwytywania wychodzących wiadomości email bez ryzyka wysłania ich do prawdziwych odbiorców.


---

## 11. Środowisko Produkcyjne i Wdrożenie

Produkcja oparta jest o **Vercel** (hosting aplikacji Next.js) oraz **Supabase Cloud** (zarządzana baza PostgreSQL, Auth i Storage w regionie AWS Frankfurt / Irlandia).

### 11.1. Zmienne środowiskowe na produkcji
W panelu Vercel (Project Settings → Environment Variables) oraz pliku `.env.production` konfigurowane są:
- `NEXT_PUBLIC_SUPABASE_URL` — adres URL projektu w Supabase Cloud (`https://[ref].supabase.co`)
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — publiczny klucz klienta anonimowego (`sb_publishable_...`)
- `SUPABASE_SERVICE_ROLE_KEY` — prywatny klucz administracyjny (`sb_secret_...`)
- `DATABASE_URL` — adres połączenia PostgreSQL (Supabase Connection Pooler, port 5432 lub 6543)
- `VERIFICATION_SECRET` — losowy sekret kryptograficzny

### 11.2. Wdrażanie migracji na bazę produkcyjną
- **Zasada ZERO `db:push` na produkcji:** Nigdy nie wolno używać `drizzle-kit push` przeciwko bazie produkcyjnej, ponieważ może to doprowadzić do utraty danych.
- **Bezpieczny schemat:**
  1. Generujesz migrację lokalnie: `pnpm db:generate`.
  2. Weryfikujesz wygenerowany plik `.sql` w katalogu `drizzle/`.
  3. Aplikujesz migrację na produkcji za pomocą dedykowanego connection stringa:
     ```bash
     DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-eu-west-1.pooler.supabase.com:5432/postgres" pnpm db:migrate
     ```

---

## 12. Zestawienie Komend: Dev vs Produkcja

| Zadanie | Środowisko Lokalne (DEV) | Środowisko Produkcyjne (PROD) |
|---|---|---|
| **Uruchomienie bazy danych** | `pnpm supabase:start` | Usługa zarządzana w Supabase Cloud |
| **Zatrzymanie bazy** | `pnpm supabase:stop` | — |
| **Status kontenerów i klucze** | `pnpm supabase:status` | Panel supabase.com |
| **Start aplikacji** | `pnpm dev` (Next.js dev server) | `pnpm start` (po `pnpm build`) / Vercel |
| **Generowanie migracji SQL** | `pnpm db:generate` | Wykonywane w repozytorium |
| **Aplikowanie migracji** | `pnpm db:migrate` | `DATABASE_URL=... pnpm db:migrate` |
| **Graficzny podgląd bazy** | `http://127.0.0.1:54323` lub `pnpm db:studio` | Panel webowy Supabase Cloud |
| **Dostęp SQL w terminalu** | `docker exec -it supabase_db_stan-floty psql -U postgres -d postgres` | Zewnętrzny klient `psql` z connection stringiem |
| **Podgląd e-maili systemowych** | `http://127.0.0.1:54324` (Mailpit) | Dostawca SMTP (Resend / SendGrid) |
| **Testy automatyczne** | `pnpm exec vitest run` / `pnpm exec vitest` | CI/CD pipeline przed wdrożeniem |
| **Sprawdzenie typów** | `pnpm exec tsc --noEmit` | `pnpm build` na Vercel |
| **Linter kodu** | `pnpm lint` | CI/CD pipeline |

---

## 13. Zasady Kodowania i Standardy Bezpieczeństwa

Każdy programista i agent AI pracujący w repozytorium zobowiązany jest do przestrzegania poniższych zasad:

1. **Język kodu i interfejsu:**
   - Identyfikatory kodu, zmienne, tabele, kolumny, commity i komentarze techniczne piszemy wyłącznie w języku **angielskim**.
   - Wszystkie teksty widoczne dla użytkownika końcowego (etykiety, komunikaty błędów, toasty, przyciski, modale) piszemy w naturalnym języku **polskim**.
2. **Brak tolerancji dla `any`:**
   - Całość kodu musi być w pełni otypowana w TypeScript (`strict: true`).
3. **Bezpieczeństwo danych i PII:**
   - Numery PESEL, NIP, numery telefonów i dane osobowe klientów **nigdy nie mogą trafiać do logów serwera**.
   - Hasła i klucze prywatne (`SUPABASE_SERVICE_ROLE_KEY`) nigdy nie mogą być przekazywane do klienta przeglądarki (`"server-only"`).
4. **Zasada TDD (Test-Driven Development):**
   - Nowa logika biznesowa, reguły finansowe i kalkulacje muszą posiadać testy jednostkowe napisane przed lub w trakcie implementacji.
5. **Transakcyjność zmian powiązanych:**
   - Jeżeli operacja zmienia jednocześnie stan dwóch tabel (np. tworzy wypożyczenie i zmienia status zasobu na `RENTED`), **musi** być wykonana wewnątrz `db.transaction(async (tx) => { ... })`.

---

## 14. Ważne Wskazówki i Troubleshooting

### 1. Co zrobić, gdy porty są zajęte?
Lokalny Supabase rezerwuje porty `54321` (Kong), `54322` (Postgres), `54323` (Studio), `54324` (Mailpit).
- Jeżeli masz uruchomionego lokalnego PostgreSQL w systemie (np. na domyślnym 5432), nie koliduje on, ponieważ Supabase używa `54322`.
- W razie błędu `port already in use`, sprawdź zajęte porty:
  ```powershell
  Get-NetTCPConnection -LocalPort 54321,54322,54323,54324 | Select-Object LocalPort, OwningProcess
  ```

### 2. Docker daemon nie odpowiada
Jeżeli `pnpm supabase:start` zgłasza błąd połączenia z Dockerem, upewnij się, że **Docker Desktop** jest uruchomiony i działa poprawnie.

### 3. Resetowanie bazy lokalnej do czystego stanu
Jeżeli baza lokalna ulegnie rozsynchronizowaniu lub chcesz wyczyścić wszystkie dane testowe:
```bash
# Zresetowanie bazy danych i odtworzenie schematu od zera:
pnpm exec supabase db reset
pnpm db:migrate
```

### 4. Testowanie rejestracji i linków aktywacyjnych
Supabase domyślnie wymaga potwierdzenia adresu e-mail. Wszystkie maile weryfikacyjne i linki resetu hasła wysyłane w trybie developerskim trafiają natychmiast do **Mailpita**:
👉 Otwórz przeglądarkę pod adresem: `http://127.0.0.1:54324` i kliknij w wygenerowany link.

### 5. Daty i strefy czasowe (Europe/Warsaw vs UTC)
- Baza danych PostgreSQL przechowuje wszystkie znaczniki jako `TIMESTAMPTZ` w UTC.
- UI oraz silnik naliczania dni (`calculateBillingUnits`) zawsze traktują czas operacyjny w kontekście strefy `Europe/Warsaw`.
- Nigdy nie używaj natywnych operacji `getDate()` bez uwzględnienia strefy czasowej użytkownika.

---

## 15. Zarządzanie Kontem Administratora (ADMIN) w Dev i Produkcji

Model B2B SaaS aplikacji opiera się na **zamkniętej rejestracji**. Użytkownicy z zewnątrz nie mają możliwości samodzielnego założenia konta ani organizacji. Rejestrację nowych wypożyczalni przeprowadza wyłącznie użytkownik z rolą `ADMIN` (Superadmin) z poziomu Panelu Administratora (`/admin`) lub ścieżki `/rejestracja`.

Poniżej znajdują się instrukcje, jak nadać uprawnienia `ADMIN` pierwszemu użytkownikowi w środowisku developerskim oraz na produkcji.

---

### 15.1. Środowisko Developerskie (Lokalne)

#### Metoda 1: Promocja istniejącego konta przez konsolę PostgreSQL (zalecana)
Jeżeli w lokalnej bazie posiadasz już dowolnego użytkownika:
```bash
docker exec -i supabase_db_stan-floty psql -U postgres -d postgres -c "UPDATE public.users SET role = 'ADMIN' WHERE email = 'twoj-email@domena.pl';"
```

#### Metoda 2: Utworzenie pierwszego Administratora od zera (SQL)
Jeżeli lokalna baza jest pusta i chcesz założyć pierwszego administratora bez powiązania z obcą organizacją:
```bash
docker exec -it supabase_db_stan-floty psql -U postgres -d postgres
```
Wklej poniższy blok SQL:
```sql
DO $$
DECLARE
  v_tenant_id uuid := gen_random_uuid();
  v_user_id uuid := gen_random_uuid();
  v_email text := 'admin@stanfloty.pl';
  v_password text := 'Admin123!@#';
BEGIN
  -- 1. Utwórz organizację systemową dla Administratora
  INSERT INTO public.tenants (id, name, nip, plan)
  VALUES (v_tenant_id, 'Stan Floty Administracja', '0000000000', 'PRO');

  -- 2. Utwórz konto w schemacie auth Supabase
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, recovery_sent_at, last_sign_in_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    v_email,
    crypt(v_password, gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Główny Administrator"}',
    now(), now(), '', '', '', ''
  );

  -- 3. Utwórz tożsamość email w auth.identities
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(),
    v_user_id,
    jsonb_build_object('sub', v_user_id::text, 'email', v_email),
    'email',
    v_user_id::text,
    now(), now(), now()
  );

  -- 4. Utwórz profil w public.users z rolą ADMIN
  INSERT INTO public.users (id, tenant_id, email, role, full_name, created_at, updated_at)
  VALUES (v_user_id, v_tenant_id, v_email, 'ADMIN', 'Główny Administrator', now(), now());

  RAISE NOTICE 'Administrator utworzony pomyślnie: %', v_email;
END $$;
```

---

### 15.2. Środowisko Produkcyjne (Supabase Cloud)

Na produkcji najbezpieczniejszym i najprostszym podejściem jest użycie oficjalnego panelu Supabase Cloud:

#### Krok 1: Utworzenie rekordu organizacji systemowej (SQL Editor)
W panelu **Supabase Cloud Dashboard** przejdź do zakładki **SQL Editor** i wykonaj:
```sql
-- Utwórz organizację administracyjną (jeśli jeszcze nie istnieje)
INSERT INTO public.tenants (id, name, plan)
VALUES ('00000000-0000-0000-0000-000000000001', 'Stan Floty Platform', 'ENTERPRISE')
ON CONFLICT (id) DO NOTHING;
```

#### Krok 2: Utworzenie użytkownika w Supabase Auth
1. W panelu bocznym Supabase przejdź do **Authentication → Users**.
2. Kliknij **Add user** → **Create user**.
3. Wprowadź docelowy adres e-mail (np. `admin@twojadomena.pl`) oraz bezpieczne, silne hasło.
4. Zaznacz opcję **Auto Confirm User?** (tak, aby konto było natychmiast aktywne).
5. Kliknij **Create user** i skopiuj wygenerowane **User UID**.

#### Krok 3: Dodanie rekordu profilu z rolą `ADMIN` w `public.users` (SQL Editor)
W zakładce **SQL Editor** uruchom zapytanie:
```sql
INSERT INTO public.users (
  id,
  tenant_id,
  email,
  role,
  full_name,
  created_at,
  updated_at
) VALUES (
  'TUTAJ_WKLEJ_SKOPIOWANE_USER_UID',
  '00000000-0000-0000-0000-000000000001',
  'admin@twojadomena.pl',
  'ADMIN',
  'Główny Administrator',
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE SET role = 'ADMIN';
```

#### Krok 4: Nadanie roli `ADMIN` już istniejącemu użytkownikowi (jeśli konto już istniało)
Jeżeli konto zostało wcześniej zarejestrowane:
```sql
UPDATE public.users 
SET role = 'ADMIN' 
WHERE email = 'admin@twojadomena.pl';
```

---

### 15.3. Bezpieczeństwo i Zasada Braku Podglądu Haseł
- Administrator **nie ma** i ze względów bezpieczeństwa kryptograficznego **nigdy nie może mieć** dostępu do jawnych haseł użytkowników (hasła w bazie są hashowane algorytmem bcrypt / argon2).
- Z poziomu panelu `/admin` administrator ma możliwość **wyłącznie nadania nowego hasła** (write-only) użytkownikowi za pośrednictwem bezpiecznego Supabase Admin API (`auth.admin.updateUserById`).


