# Dark Heresy 2 — polski kreator postaci

Przeglądarkowy kreator Akolity do **Dark Heresy, 2. edycji**, oparty na [oryginalnym kreatorze ajott](https://github.com/ajott/ajott.github.io/tree/master/dh2chargen). Polska adaptacja korzysta z terminologii polskiego *Podręcznika Głównego* i udostępnia opcje postaci z tego podręcznika.

**[Otwórz kreator](https://nienawisc.github.io/Dark-Heresy-2-Kreator-Postaci/)**

## Co można zrobić

- Wybrać pochodzenie, przeszłość i rolę z podręcznika głównego oraz przejść przez losowanie cech, wróżbę, umiejętności, zdolności i początkowe wyposażenie.
- Opcjonalnie wydać do 1000 PD na rozwinięcia cech, umiejętności i zdolności. Koszty uwzględniają predyspozycje i wymagania; niewydane PD pozostają na karcie.
- Wybrać dodatkowe wyposażenie według dostępności i premii wynikającej z Wpływu. Kreator uwzględnia premie Administratum i Adeptus Mechanicus oraz cybernetykę.
- Utworzyć Mistyka z automatycznym Rozwinięciem Elitarnym Psionik i jego początkowymi premiami. Kupowanie mocy psionicznych za PD nie jest dostępne.
- Obejrzeć i wydrukować kartę postaci z polami rozwinięć oraz zapisać postać w przeglądarce lub przenieść ją kodem eksportu.
- Pobrać JSON aktora do [Dark Heresy 2E — Vendare dla Foundry VTT](https://github.com/Vendare/DarkHeresy2E-FoundryVTT).

Niektóre specjalizacje, np. „dowolna” grupa zdolności, wymagają wyboru podczas tworzenia postaci. Dane dodatków pozostają w kodzie pierwowzoru, ale nie są oferowane w interfejsie i nie zostały przetłumaczone.

## Uruchomienie lokalne

Otwórz `index.html` w Chrome lub Edge. Kreator działa bez instalowania pakietów i bez połączenia z internetem. Można go także uruchomić z lokalnego serwera plików:

```sh
python -m http.server 8080 --bind 127.0.0.1
```

Następnie otwórz `http://127.0.0.1:8080/`. Polski PDF podręcznika służył jako lokalny materiał odniesienia; **nie jest dołączony do repozytorium ani publikowany na GitHub Pages**.

Zapisy przeglądarki są przypisane do adresu strony. Przed przejściem między wersją lokalną a GitHub Pages skopiuj kod eksportu postaci.

## Import do Foundry VTT

Na karcie postaci kliknij **Pobierz do Foundry**. Jeśli chcesz najpierw wpisać imię postaci, zrób to w oknie **Eksport / zapis** i użyj przycisku **Pobierz JSON do Foundry**. W świecie z systemem Vendare utwórz aktora typu **Acolyte**, kliknij go prawym przyciskiem w katalogu aktorów i wybierz **Import Data**. Wskaż pobrany plik; import zastępuje zawartość wybranego aktora. Eksporter przygotowano według schematu Vendare **4.4.0.1** (Foundry 13–14).

Plik zawiera cechy i ich rozwinięcia, umiejętności ze specjalizacjami, predyspozycje, zdolności, premię wróżby, wyposażenie, cybernetykę, Żywotność, Przeznaczenie, dane Psionika i rozliczenie PD. Parametry broni i pancerzy są wypełniane tam, gdzie istnieją w danych kreatora. Przy przedmiotach bez pełnych statystyk JSON zachowuje nazwę i masę, a w notatkach aktora wymienia pola do uzupełnienia. Własne specjalizacje spoza listy Vendare też są zapisane w JSON, lecz mogą wymagać sprawdzenia po imporcie. System Vendare domyślnie nie przelicza automatycznie kosztów PD; włączenie opcji **Calculate XP Costs** może zmienić bilans po imporcie.

## Pochodzenie i prawa

Kod i część grafik pochodzą z [ajott/ajott.github.io, katalog `dh2chargen`](https://github.com/ajott/ajott.github.io/tree/master/dh2chargen), rewizja `dc025bd871a34db0f51f6705c65eaf75875ec687` (pobrana 24.09.2026). Polska adaptacja, logika rozwoju i testy powstały na potrzeby tego projektu. [Dokumentacja tłumaczenia](docs/TRANSLATION.md) wskazuje użyte fragmenty podręcznika i różnice względem pierwowzoru.

Licencja MIT w pliku [LICENSE](LICENSE) dotyczy wyłącznie oryginalnych zmian autora tej adaptacji. Nie obejmuje kodu i grafik pierwowzoru, dołączonych bibliotek ani treści i znaków związanych z Dark Heresy lub Warhammer, do których prawa zachowują ich właściciele. Projekt fanowski nie jest powiązany z wydawcami gry.

## Testy

Testy wymagają Node.js, Playwright i Chrome:

```sh
npm install
npm test
```

Sprawdzają 672 ścieżki tworzenia postaci, rozwój, kartę, zapis i import oraz układ na ekranie mobilnym. Zrzuty kontrolne trafiają do ignorowanego katalogu `test-results/`.

Skrypt `scripts/localize_source.py` dokumentuje jednorazową migrację tekstów pierwowzoru. Nie jest potrzebny do używania kreatora.
