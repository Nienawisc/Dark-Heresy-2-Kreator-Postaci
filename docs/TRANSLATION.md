# Źródła polskich nazw i zakres adaptacji

Podstawą jest dostarczony lokalnie plik `Dark Heresy II - Podręcznik Główny [PL].pdf` (449 stron). Numery poniżej oznaczają numer strony podręcznika, zgodny z indeksem strony PDF liczonym od 1. Tekst był odczytywany z PDF-u; niepewne fragmenty sprawdzano na renderowanych obrazach stron.

| Obszar | Strony | Użycie |
| --- | --- | --- |
| Cechy i skróty | 21–22 | WW, US, S, Wt, Zr, Int, Per, SW, Ogd, Wp |
| Zakres tworzenia postaci | 28, 31 | 6 pochodzeń, 7 przeszłości, 8 ról |
| Arystokracja | 32 | nazwa, premia, modyfikatory |
| Dziki świat | 34 | Sprawdzone metody |
| Pustka kosmosu | 36 | Dziecko ciemności, Potęga woli |
| Świat-katedra | 38 | Wiara w Kredo |
| Świat-kopiec | 40 | Nieprzebrane tłumy pośród stalowych szczytów |
| Świat-kuźnia | 42 | Wybraniec Omnisjasza |
| Adeptus Administratum / Arbites / Astra Telepathica | 46 / 48 / 50 | przeszłości i początkowe wybory |
| Adeptus Mechanicus / Ministorum | 52 / 54 | przeszłości i początkowe wybory |
| Gwardia Imperialna / Wygnaniec | 56 / 58 | przeszłości i początkowe wybory |
| Chirurgon / Hierofant / Mędrzec / Mistyk | 62 / 64 / 66 / 68 | role, premie, zdolności |
| Ryzykant / Śledczy / Wojownik / Zabójca | 70 / 72 / 74 / 76 | role, premie, zdolności |
| Predyspozycje | 79–81 | m.in. Charyzma, Erudycja, Przystosowanie; zastępowanie duplikatów |
| Rozwój za PD i wyposażenie z Wpływu | 78–81 | 1000 PD, koszty pięciu poziomów cech, czterech rang umiejętności, trzech poziomów zdolności; limit przedmiotów |
| Rozwinięcia Elitarne | 87–92 | Inkwizytor, Psionik, Nietykalny, ich warunki i natychmiastowe skutki |
| Wróżby | 84–85 | 25 nazw przepowiedni i opisów skutków |
| Umiejętności | 96–117 | polskie nazwy i krótkie objaśnienia |
| Zdolności | 120–132 | m.in. Szybka naprawa, Techmodlitwa, Na cztery łapy |
| Broń | 144–160 | nazwy, statystyki i cechy specjalne |
| Ekwipunek, pancerz i cybernetyka | rozdział V | nazwy początkowego sprzętu i skróty opisów |
| Zbrojownia do wyboru dodatkowych rzeczy | 141, 152–175 | poziomy dostępności, uzbrojenie, pancerz, sprzęt, modyfikacje i narzędzia |
| Typy obrażeń | 232 | energia, uderzenia, rozpruwanie |

Teksty pomocnicze interfejsu napisano po polsku. Opisy kart, zdolności, umiejętności i wyposażenia są zwięzłymi objaśnieniami, a nie pełną transkrypcją podręcznika. Obok każdej karty wyboru widnieje numer strony źródłowej.

## Rozbieżności w dostarczonym PDF-ie i angielskim kreatorze

Przyjęto poniższe odczyty lokalnego PDF-u; nie są to twierdzenia o oficjalnej erracie gry:

- Świat-katedra: PDF s. 38 podaje **7+1k5** Żywotności; źródłowy kreator podawał 8+1k5.
- Adeptus Astra Telepathica: PDF s. 50 używa **„Laserowa lub Niezaawansowana”**. Dlatego jest to wybór jednej zdolności, podczas gdy kreator przyznawał obie.
- Ryzykant: PDF s. 70 wymienia **Charyzmę**, nie Ogładę. Zastosowano Charyzmę.
- Wróżba 68–71: PDF s. 85 daje **+3 do Percepcji**, źródło angielskie +2. W polskim opisie jest +3. Efekt nadal wymaga ręcznego zastosowania.
- Wróżba 72–75: opis PDF-u s. 85 mówi o kolejnym teście **w tej samej turze**. Zachowano ten zapis.
- Nazwa premii arystokracji na obrazie s. 32 brzmi **„Wysoko wodzom”**. Zachowano zapis dostarczonego podręcznika, choć wygląda nietypowo.
- Szybka naprawa: tabela na s. 120 wspomina akcję darmową, lecz pełny opis na s. 129 mówi o **akcji zwykłej zamiast podwójnej**, raz na rundę. W objaśnieniu użyto pełnego opisu.
- Autogun: oryginalny skrót opisu podawał 300 m, chociaż jego tabela broni i PDF s. 152 podają **100 m**. Polski opis jest zgodny z tabelą.

## Poprawki działania konieczne przy adaptacji

- Zastępowanie powtarzających się predyspozycji gwarantuje osiem różnych predyspozycji, także po zmianie wyboru.
- Ponowne budowanie lub import karty nie powiela wierszy ani masy wyposażenia.
- Zestawy „pistolet laserowy oraz miecz” i „młot bojowy oraz rewolwer” mają zsumowane masy (4,5 kg i 6 kg), zamiast tekstu rozdzielonego ukośnikiem.
- Dwa angielskie wpisy `Whip` nadpisywały się nawzajem; przywrócono statystyki zwykłego bicza, dostępnego w przeszłości Astra Telepathica.
- Import sprawdza dane przed zastąpieniem postaci. Odrzuca błędne kody, nierozstrzygnięte wybory i pochodzenia, przeszłości lub role z dodatków.
- Eksport używa UTF-8 z prefiksem `DH2PL1:`. Import rozpoznaje również oryginalny format Base64.
- Oryginalne zapisy na serwerze autora zastąpiono `localStorage`; kod nie wysyła postaci ani danych użytkownika na zewnętrzne serwery.

## Dane dodatków

Dodatkowe pochodzenia, przeszłości i role pozostają w `main.js` w oryginalnym języku. `CORE` w `pl-data.js` jest jedyną listą opcji dopuszczanych przez wybory i import. Nie ma przełącznika dodatków dla gracza. Zmiana zakresu wymaga świadomej aktualizacji tej listy, uzupełnienia tłumaczeń oraz źródeł.

## Granice funkcjonalności

Kreator nie kupuje mocy psionicznych za PD i nie stosuje mechanicznie skutków wróżb. Katalog zdolności i przedmiotów nie przepisuje całych rozdziałów IV–V: pozycje spoza katalogu można wpisać ręcznie z danymi z podręcznika, przy czym wymagania takiej zdolności potwierdza gracz. Zgoda MG na Rozwinięcie Elitarne także pozostaje poza aplikacją.
