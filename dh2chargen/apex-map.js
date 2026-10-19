'use strict';

// Polish names used by the creator -> English entries in the Apex 0.1.4 compendiums.
// The right-hand side must match the installed system's compendium item name.
const APEX_TALENT_NAMES = Object.fromEntries(`
Błyskawiczne przeładowanie|Rapid Reload
Broń specjalna|Weapon Training
Furia|Frenzy
Informatorzy w tłumie|Clues from the Crowds
Intuicja|Keen Intuition
Krzepkość|Sound Constitution
Na cztery łapy|Catfall
Oburęczność|Ambidextrous
Odporność|Resistance
Powalenie|Takedown
Powstanie|Leap Up
Przyzwanie żelaza|Ferric Summons
Ramię w ramię|Double Team
Rozbrajanie|Disarm
Szklana pułapka|Die Hard
Szybka naprawa|Technical Knock
Szybkie dobycie|Quick Draw
Techmodlitwa|Weapon-Tech
Walka na ślepo|Blind Fighting
Wróg|Enemy
Zobojętniały|Jaded
Zmysł Osnowy|Warp Sense
Znajomości|Peer
Znikąd osłony|Nowhere to Hide
Żelazna szczęka|Iron Jaw
Broń egzotyczna|Exotic Weapon Training
Kontratak|Counter Attack
Magnetyczna lewitacja|Maglev Transcendence
Mistrz walki|Combat Master
Mistrz walki bez broni|Unarmed Specialist
Nabite bicepsy|Bulging Biceps
Nie dozwól wiedźmie|Deny the Witch
Nierozpoznawalny|Face in a Crowd
Nieuchronny atak|Inescapable Attack
Nieustanna czujność|Constant Vigilance
Niezależne celowanie|Independent Targeting
Niszczycielskie natarcie|Devastating Assault
Nienawiść|Hatred
Podwójny strzał|Double Tap
Potęga woli|Strong Minded
Precyzyjny zabójca|Precision Killer
Prosangwiniczny|Prosanguine
Przewodnik Osnowy|Warp Conduit
Sieć kontaktów|Contact Network
Strzał z biodra|Hip Shooting
Strzelec wyborowy|Marksman
Szał bitewny|Battle Rage
Szybki atak|Swift Attack
Świetlisty wstrząs|Luminen Shock
Trudny cel|Hard Target
Twardziel|Hardy
Ulepszenie zbroi|Armour-Monger
Używanie mechadendrytów|Mechadendrite Use
Walka dwiema broniami|Two-Weapon Wielder
Wir śmierci|Whirlwind of Death
Wspólne przesłuchiwanie|Coordinated Interrogation
Zabójczy atak|Killing Strike
Zatuszowanie|Cover-Up
Aura dowódcy|Halo of Command
Błyskawiczny atak|Lightning Attack
Bycza szarża|Thunder Charge
Głos zabójcy|Assassin Strike
Delikatne przesłuchiwanie|Delicate Interrogation
Forteca woli|Bastion of Iron Will
Miażdżący cios|Crushing Blow
Mistrz ostrza|Blademaster
Mistrz dwóch broni|Two-Weapon Master
Mistrzostwo|Mastery
Mocarny strzał|Mighty Shot
Nadludzka szybkość|Preternatural Speed
Niezłomna wiara|Adamantium Faith
Niezłomny|Never Die
Niosący śmierć|Deathdealer
Odcięcie Osnowy|Warp Lock
Oko zemsty|Eye of Vengeance
Potężny cios|Hammer Blow
Prawdziwe męstwo|True Grit
Przebłysk intuicji|Flash of Insight
Sprint|Sprint
Świetlisty podmuch|Luminen Blast
Ulubieniec Osnowy|Favoured by the Warp
Wiedza wpojona|Infused Knowledge
Wybitny chirurgon|Superior Chirurgeon
Wybór celu|Target Selection
Zejście z linii|Step Aside
Bezduszna aura|Soulless Aura
Psioniczne wytłumienie|Psychic Null
Zaburzenie Osnowy|Warp Disruption
Sfera wytłumienia|Null Field
`.trim().split('\n').map(line=>line.split('|')));

const APEX_GEAR_NAMES = Object.fromEntries(`
Pistolet laserowy|Laspistol
Karabin laserowy|Lasgun
Strzelba laserowa|Laslock
Karabin automatyczny|Autogun
Pistolet automatyczny|Autopistol
Pistolet samopowtarzalny|Stub Automatic
Rewolwer|Stub Revolver
Strzelba|Shotgun
Karabin snajperski|Sniper Rifle
Pistolet wielkokalibrowy|Hand Cannon
Strzelba bojowa|Shotgun (Combat)
Łuk|Bow
Kusza|Crossbow
Bolas|Bolas
Granatnik|Grenade Launcher
Pałka elektryczna|Shock Maul
Miecz łańcuchowy|Chainsword
Ostrze łańcuchowe|Chainblade
Topór łańcuchowy|Chainaxe
Bicz|Whip
Broń dwuręczna|Great Weapon
Kij|Staff
Miecz|Sword
Młot bojowy|Warhammer
Nóż|Knife
Pałka|Truncheon
Tarcza|Shield
Włócznia|Spear
Lanca wybuchowa|Hunting Lance
Granat duszący|Choke Grenade
Granat dymny|Smoke Grenade
Granat odłamkowy|Frag Grenade
Granat ogłuszający|Stun Grenade
Granat oślepiający|Blind Grenade
Granat halucynogenny|Hallucinogen Grenade
Bomba zapalająca|Fire Bomb
Rakieta odłamkowa|Frag Missile
Rakieta przeciwpancerna|Krak Missile
Hełm balistyczny|Flak Helmet
Rękawice balistyczne|Flak Gauntlets
Lekka peleryna balistyczna|Light Flak Cloak
Kamizelka balistyczna|Flak Vest
Peleryna balistyczna|Flak Cloak
Płaszcz balistyczny|Flak Coat
Gwardyjski pancerz balistyczny|Imperial Guard Flak Armour
Ciężkie skóry|Heavy Leathers
Imperialne szaty|Imperial Robes
Kolczuga|Chainmail Suit
Feudalna zbroja płytowa|Feudal World Plate
Plecak|Backpack
Chronometr|Chrono
Aparat oddechowy|Rebreather
Kamizelka taktyczna|Combat Vest
Kombinezon survivalowy|Survival Suit
Maska przeciwgazowa|Respirator/Gas Mask
Okulary noktowizyjne|Photo-Visors/Contacts
Skafander kosmiczny|Void Suit
Ubranie|Clothing
Ukryta kabura|Concealed Holster
Zatyczki filtrujące|Filtration Plugs
Apteczka|Medi-kit
Auspex|Auspex/Scanner
Autopis|Auto Quill
Dalmierz|Hand-Held Targeter
Dozownik|Inhaler/Injector
Fetysz psioniczny|Psy Focus
Infoczytnik|Dataslate
Kajdany|Manacles
Lina z kotwiczką|Grapnel & Line
Lumisfera|Glow-globe/Stablight
Magnokulary|Magnoculars
Megafon|Laud Hailer
Mikrokomunikator|Micro-bead
Multiklucz|Multikey
Palnik laserowy|Lascutter
Rejestrator obrazu|Pict Recorder
Szwy polowe|Field Suture
Transmiter głosowy|Vox-caster
Uprząż wspinaczkowa|Clip/Drop Harness
Wygłuszacz|Stummer
Zestaw do pisania|Writing Kit
Amasec|Amasec
Dwukofeinowa|Recaf
Grzyby z Desoleum|Desoleum Fungus
Lho-szlugi|Lho-Sticks
Racja żywnościowa|Ration Pack
Stym|Stimm
Szturmina|Slaught
Bagnet|Melee Attachment
Celownik laserowy|Red-Dot Laser Sight
Dopasowana kolba|Modified Stock
Eksterminator|Exterminator
Luneta teleskopowa|Telescopic Sight
Mocowanie na przedramieniu|Forearm Weapon Mounting
Ostrze monomolekularne|Mono
Plecak amunicyjny|Backpack Ammo Supply
Powiększony magazynek|Expanded Magazine
Święta inskrypcja|Sacred Inscriptions
Tłumik|Silencer
Trójnóg/dwójnóg|Tripod/Bipod
Wzmocniona konstrukcja|Reinforced
Zmniejszenie wymiarów|Compact
Amunicja dumdum|Dumdum Bullets
Amunicja przebijająca|Man-Stopper Bullets
Amunicja przeciążona laserowa|Hot-Shot Charge Packs
Amunicja rozrywająca|Expander Rounds
Amunicja toksyczna|Tox Rounds
Wybuchowe strzały/bełty|Explosive Arrows/Quarrels
Pistolet boltowy|Bolt Pistol
Karabin boltowy|Boltgun
Ciężki bolter|Heavy Bolter
Bolter szturmowy|Storm Bolter
Laserowy karabin snajperski|Long Las
Przeciążony pistolet laserowy|Hot-shot Laspistol
Przeciążony karabin laserowy|Hot-shot Lasgun
Ręczny miotacz ognia|Hand Flamer
Miotacz ognia|Flamer
Ciężki miotacz ognia|Heavy Flamer
Ciężki karabin maszynowy|Heavy Stubber
Działko automatyczne|Autocannon
Pistolet plazmowy|Plasma Pistol
Karabin plazmowy|Plasma Gun
Pistolet Inferno|Inferno Pistol
Karabin termiczny|Meltagun
Pistolet grawitonowy|Grav Pistol
Karabin grawitonowy|Graviton Gun
Pistolet igłowy|Needle Pistol
Karabin igłowy|Needle Rifle
Pistolet sieciowy|Web Pistol
Miotacz sieci|Webber
Wyrzutnia rakiet|Missile Launcher
Bicz elektryczny|Shock Whip
Buzdygan energetyczny (wysoka moc)|Power Maul
Buzdygan energetyczny (niska moc)|Power Maul
Miecz energetyczny|Power Sword
Rękawica energetyczna|Power Fist
Topór energetyczny|Power Axe
Topór Omnisjasza|Omnissian Axe
Rozpruwacz|Eviscerator
Kostur psioniczny|Force Staff
Miecz psioniczny|Force Sword
Granat elektromagnetyczny|Haywire Grenade
Granat fotonowo-błyskowy|Photon Flash Grenade
Granat przeciwpancerny|Krak Grenade
Granat sieciowy|Web Grenade
Bomba termiczna|Melta Bomb
Wzmocniony kombinezon|Armoured Bodyglove
Kamizelka ze skóry xenos|Xenos Hide Vest
Kamizelka splotowa|Mesh Vest
Peleryna splotowa|Mesh Cloak
Hełm skorupowy|Carapace Helm
Rękawice skorupowe|Carapace Gauntlets
Nagolenniki skorupowe|Carapace Greaves
Lekki egzekutorski pancerz skorupowy|Enforcer Light Carapace
Napierśnik skorupowy|Carapace Chestplate
Szturmowy pancerz skorupowy|Militarum Tempestus Carapace
Lekki pancerz wspomagany|Light Power Armour
Pole rozpraszające|Refractor Field
Pole konwersyjne|Conversion Field
Pole dyslokujące|Displacer Field
Osobiste pole energetyczne|Power Field (Personal)
Pole energetyczne (pojazd/stanowisko)|Power Field (Vehicle/Emplacement)
Gogle termowizyjne|Preysense Goggles
Obroża wybuchowa|Explosive Collar
Ochronniki słuchu|Deadspace Earpiece
Peleryna kamuflująca|Chameleoline Cloak
Rękawica tłumiąca|Recoil Glove
Syntskóra|Synskin
Agresor|Frenzon
Detoks|De-Tox
Dreszcz|Spook
Mrocznica|Obscura
Pacyfikator|Tranq
Święte smarowidła|Sacred Unguents
Zaawansowana apteczka|Medi-kit
Berło wytłumiające|Null Rod
Diagnozer|Diagnostor
Generator szumu|Static Generator
Grawitochron|Grav Chute
Magnetobuty|Magboots
Multikompas|Multicompass
Multinarzędzia|Combi-tool
Narzędzia tortur|Excruciator Kit
Pluskwa komunikacyjna|Comm Leech
Serwoczaszka jednozadaniowa|Monotask Servo-Skull
Wrzeszcz|Screamer
Zagłuszacz sygnału|Signal Jammer
Zestaw do charakteryzacji|Disguise Kit
Zestaw do gry w Królobójstwo|Regicide Set
Zestaw saperski|Demolition Kit
Celownik termowizyjny|Preysense Sight
Dopasowana rękojeść|Custom Grip
Dozownik trucizn|Tox Dispenser
Granatnik podczepiany|Auxiliary Grenade Launcher
Kogitator celowniczy|Targeter
Moduł kontroli głosowej|Vox-Operated
Noktowizor|Photo Sight
Omni-luneta|Omni-Scope
Przelicznik ruchu celu|Motion Predictor
Selektor amunicji|Fire Selector
Sprawny mechanizm|Fluid Action
Stabilizator|Suspensors
Szybkie przeładowanie|Quick-Release
Uchwyt pistoletowy|Pistol Grip
Usunięte zabezpieczenia|Deactivated Safety Features
Amunicja boltowa „Nawałnica”|Tempest Bolt Shells
Amunicja ćwiartująca|Amputator Shells
Amunicja halucynogenna|Scrambler Rounds
Amunicja Inferno|Inferno Shells
Amunicja Krwawniki|Bleeder Rounds
Akumulator wewnętrzny|Internal Reservoir
Autosangwinator|Autosanguine
Bioniczna ręka|Bionic Arm
Bioniczne nogi|Bionic Legs
Bioniczne płuca|Bionic Respiratory System
Bioniczne serce|Bionic Heart
Bioniczne zmysły|Bionic Senses
Bojowy interfejs MIU|MIU Weapon Interface
Calculus Logi|Calculus Logi Upgrade
Cewki magnetolewitacji|Maglev Coils
Filtr oddechowy|Respiratory Filter Implant
Gniazdo interfejsu|Interface Port
Kondensator|Luminen Capacitor
Matryca lokacyjna|Locator Matrix
Mechadendryt|Mechadendrite
Moduł impulsów umysłowych|Mind Impulse Unit
Ogranicznik|Volitor Implant
Opancerzenie czaszki|Cranial Armour
Pancerz podskórny|Subskin Armour
Sensorium|Augur Array
Skrybie szpony|Scribe-tines
Syntmięśnie|Synthmuscle
Wszczep ferromagnetyczny|Ferric Lure Implants
Wszczep głosowy|Vocal Implant
Wszczep pamięciowy|Memorance Implant
Wszczepy czaszkowe|Cerebral Implants
Złe oko|Baleful Eye
Mechadendryt (balistyczny)|Mechadendrite
Mechadendryt (manipulacyjny)|Mechadendrite
Mechadendryt (medyczny)|Mechadendrite
Mechadendryt (narzędziowy)|Mechadendrite
Mechadendryt (optyczny)|Mechadendrite
`.trim().split('\n').map(line=>line.split('|')));
