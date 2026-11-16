// Справочник действий (копия из index.html; авторитетна копия в index.html).
// Синхронизировано с index.html (v210): ACTIONS_REF + actionGranted + renderMyActions.
// Реакции и протоколы, которые дают таланты, системы, фреймы, оружие и Core Bonus.
// Показ: только если у игрока есть фича, которая даёт действие (grant).
// Порядок: свои действия — выше дефолтных (в секции «Твои действия» на вкладке «Правила»).

const ACTIONS_REF = {
  reactions: [
    {key:'brace', name:'Brace', ru:'Стойка', def:true,
     tr_ru:'По тебе попали, и урон уже брошен.',
     ef_ru:'Сопротивление всему урону, теплу и Burn от этой атаки. До конца твоего следующего хода все остальные атаки по тебе — с +1 Difficulty. Цена: нельзя брать реакции до конца следующего хода, а в этот ход — только одно быстрое действие (без оверчарджа, движения, полных и свободных действий).',
     tr_en:'You are hit by an attack and damage has been rolled.',
     ef_en:'Resistance to all damage, heat and Burn from the triggering attack. Until the end of your next turn, all other attacks against you are made at +1 Difficulty. Cost: you cannot take reactions until the end of your next turn, and on that turn you can only take one quick action (no overcharge, movement, full or free actions).'},
    {key:'overwatch', name:'Overwatch', ru:'Дозор', def:true,
     tr_ru:'Враждебный персонаж начинает любое движение (включая Boost и другие действия) в пределах Threat одного из твоих оружий.',
     ef_ru:'Немедленно Skirmish этим оружием по нему как реакцией, до того как он двинется.',
     tr_en:'A hostile character starts any movement (including Boost and other actions) inside the Threat of one of your weapons.',
     ef_en:'Immediately Skirmish with that weapon against them as a reaction, before they move.'},
    {key:'intercede', name:'Intercede', ru:'Вмешательство', grant:{talent:'Bonded', rank:2},
     tr_ru:'Ты соседствуешь со своим bondmate (пилотом или мехом), и он получает урон от источника в твоей линии видимости.',
     ef_ru:'Ты можешь принять этот урон на себя.',
     tr_en:'You are adjacent to your bondmate (pilot or mech) and they take damage from a source within your line of sight.',
     ef_en:'You may take the damage instead.'},
    {key:'supersonic', name:'Supersonic', ru:'Сверхзвук', grant:{talent:'Ace', rank:3},
     tr_ru:'Ход твоей цели заканчивается. (Сначала: как быстрое действие на своём ходу разгони двигатели; если закончишь ход в полёте, назначь персонажа в пределах дальности, равной твоей Speed, и в линии видимости — и получи эту реакцию.)',
     ef_ru:'Ты перелетаешь в свободное пространство, соседнее с целью.',
     tr_en:'Your target\u2019s turn ends. (First: as a quick action on your turn, spin up your thrusters; if you end your turn flying, nominate a character within Range equal to your Speed and line of sight, and gain this reaction.)',
     ef_en:'You fly to a space free and adjacent to them.'},
    {key:'returnfire', name:'Return Fire', ru:'Ответный огонь', grant:{talent:'Gunslinger', rank:2},
     tr_ru:'Персонаж попадает по тебе дальней атакой.',
     ef_ru:'Ты можешь немедленно атаковать его одним вспомогательным (Aux) дальним оружием, если он в пределах дальности.',
     tr_en:'A character hits you with a ranged attack.',
     ef_en:'You may immediately attack them with a single Auxiliary ranged weapon if they are within Range.'},
    {key:'valiantaid', name:'Valiant Aid', ru:'Доблестная помощь', grant:{talent:'Exemplar', rank:1},
     tr_ru:'Союзник атакует персонажа с твоей меткой Exemplar и промахивается.',
     ef_ru:'Он может перебросить атаку. Второй результат обязателен, даже если хуже.',
     tr_en:'An ally attacks your mark and misses.',
     ef_en:'They may reroll the attack. They must use the second result, even if it is worse.'},
    {key:'flank', name:'Flank', ru:'Фланг', grant:{talent:'Tactician', rank:3},
     tr_ru:'Персонаж, у которого нет укрытия от твоей позиции, успешно атакован союзным персонажем.',
     ef_ru:'Ты можешь нацелить его своим Overwatch, нанося половину урона при попадании.',
     tr_en:'A character who does not have cover from your position is successfully attacked by an allied character.',
     ef_en:'You may target them with Overwatch, dealing half damage on a hit.'},
    {key:'exposedsingularity', name:'Exposed Singularity', ru:'Обнажённая сингулярность', grant:{system:'Singularity Motivator'},
     tr_ru:'Твой мех получает урон.',
     ef_ru:'Ты можешь немедленно телепортироваться в свободное пространство в пределах 1d6 клеток.',
     tr_en:'Your mech takes damage.',
     ef_en:'You may immediately teleport to a free space within 1d6 spaces.'},
    {key:'battlefieldawareness', name:'Battlefield Awareness', ru:'Осведомлённость о поле боя', grant:{system:'Mimic Mesh'},
     tr_ru:'Против твоей цели (союзника, выбранного при активации мимик-сети) совершается враждебное действие.',
     ef_ru:'Ты можешь переместиться на 3 клетки к своей цели кратчайшим маршрутом. Это перемещение прерывает провоцирующее действие и разрешается раньше него, игнорирует вовлечённость и не провоцирует реакций. Можно совершать столько раз за раунд, сколько раз провоцируется. (Даётся активацией мимик-сети как быстрое действие на союзника в пределах сенсоров.)',
     tr_en:'A hostile action is taken against your target (the ally chosen when you activated the mimic mesh).',
     ef_en:'You may move 3 spaces towards your target, by the most direct route possible. This movement interrupts and resolves before the triggering action, ignores engagement and does not provoke reactions. This reaction can be taken as many times per round as it is triggered. (Granted by activating the mimic mesh as a quick action on an ally within Sensors.)'},
    {key:'unleashscylla', name:'Unleash SCYLLA', ru:'Высвободить Сциллу', grant:{system:'SCYLLA-Class NHP'}, per:'2/раунд',
     tr_ru:'Одно из следующего, выбранное при «Высвободить Сциллу»: враждебный персонаж атакует тебя или союзного персонажа в пределах дальности 3 от тебя; или враждебный персонаж пытается атаковать объект, выбранный при «Высвободить Сциллу», или взаимодействовать с ним, в пределах линии видимости.',
     ef_ru:'Skirmish против персонажа, вызвавшего реакцию. При попадании — половина урона, тепла или ожога. (Даётся быстрым действием «Высвободить Сциллу».)',
     tr_en:'One of the following, chosen when you Unleash SCYLLA: a hostile character attacks you or an allied character within Range 3 of you; or a hostile character attempts to attack or interact with an object chosen when you Unleashed SCYLLA, within line of sight.',
     ef_en:'Skirmish against the character that triggered the reaction. This skirmish deals half damage, heat or burn on hit. (Granted by the Unleash SCYLLA quick action.)'},
    {key:'probabilisticcannibalism', name:'Probabilistic Cannibalism', ru:'Вероятностный каннибализм', grant:{system:'SISYPHUS-Class NHP'}, per:'2/раунд',
     tr_ru:'Ты или любой другой персонаж в пределах сенсоров должен бросить d20.',
     ef_ru:'Выбери X или Y (два d20, брошенных при «Искривлении вероятности»). Это число немедленно становится результатом броска. Можно использовать не более двух раз до начала твоего следующего хода. (Даётся полной техникой «Искривление вероятности».)',
     tr_en:'You or any other character within Sensors must roll a d20.',
     ef_en:'Choose X or Y (the two d20 rolled when you used Probability Warp). That number immediately becomes the result of the roll. This reaction can be used no more than two times before the start of your next turn. (Granted by the Probability Warp full tech.)'},
    {key:'interdictionpoint', name:'Interdiction Point', ru:'Точка перехвата', grant:{system:'Stasis Bolt'},
     tr_ru:'Ты или союзный персонаж в пределах дальности 5 становитесь целью дальней атаки.',
     ef_ru:'Соверши противоборствующий бросок дальней атаки: если выиграешь, атака автоматически промахивается. Стазис-болт теряет заряд. (Даётся, пока стазис-болт заряжен.)',
     tr_en:'You or an allied character within Range 5 becomes the target of a ranged attack.',
     ef_en:'Make a contested ranged attack roll: if you win the contested roll, the attack automatically misses. The Stasis Bolt loses its charge. (Granted while the Stasis Bolt is charged.)'},
    {key:'blinkfieldintervention', name:'Blinkfield Intervention', ru:'Вмешательство блинк-поля', grant:{system:'ENCLAVE-Pattern Support Shield'},
     tr_ru:'Персонаж или объект в зоне поражения (купол вспышки 3) атакован.',
     ef_ru:'Получи 2 тепла, затем предоставь цели атаки сопротивление всему урону от этой атаки. (Даётся, пока активен купол щита ENCLAVE.)',
     tr_en:'A character or object in the blast area (flash dome 3) is attacked.',
     ef_en:'Take two Heat, then grant the attack\u2019s target Resistance to all damage from this attack. (Granted while the ENCLAVE shield dome is active.)'},
    {key:'flashlock', name:'Flash Lock', ru:'Блокировка вспышки', grant:{system:'Flash Anchor'},
     tr_ru:'Тебя или союзного персонажа в пределах сенсоров и линии обзора толкают, тянут, отбрасывают или сбивают с ног.',
     ef_ru:'Получи 2 тепла. Перемещение или статус предотвращаются, и цель получает иммунитет ко всем этим эффектам до начала её следующего хода.',
     tr_en:'You or an allied character within Sensors and line of sight is pushed, pulled, knocked back, or knocked prone.',
     ef_en:'Take 2 Heat. The movement or status is prevented, and the target gains Immunity to all the above effects until the start of their next turn.'},
    {key:'turretattack', name:'Turret Attack', ru:'Атака турели', grant:{system:'Turret Drones'}, per:'1/раунд за дрон',
     tr_ru:'Союзный персонаж в пределах дальности 10 от дрон-турели успешно атакует.',
     ef_ru:'Дрон-турель наносит 3 кинетического урона его цели, если у него есть линия видимости до цели. Можно использовать один раз за каждую развёрнутую дрон-турель.',
     tr_en:'An allied character within Range 10 of a turret drone makes a successful attack.',
     ef_en:'The turret drone deals 3 Kinetic damage to their target, as long as it has line of sight to their target. It can be taken once for each deployed turret drone.'},
    {key:'areadenial', name:'Area Denial', ru:'Запрет зоны', grant:{system:'Assassin Drone'}, per:'без ограничений',
     tr_ru:'Враждебный персонаж начинает движение в зоне, на которую нацелен ваш дрон-убийца, или входит в неё.',
     ef_ru:'Вы можете совершить по нему дальнюю атаку дроном, добавляя свой Grit к броску, и нанести 3 кинетического урона. Можно использовать любое число раз за раунд.',
     tr_en:'A hostile character starts movement in or enters the area targeted by your assassin drone.',
     ef_en:'You can make a ranged attack against them with the drone, gaining your Grit as a bonus to its roll, and dealing 3 Kinetic Damage. It can be used any number of times per round.'}
,
    {key:'reactivecode', name:'Reactive Code', ru:'Реактивный код', grant:{frame:'Goblin'},
     tr_ru:'По тебе попали техатакой.',
     ef_ru:'1/раунд: ты можешь выполнить любое действие БЫСТРОЙ ТЕХНИКИ против атакующего в качестве реакции.',
     tr_en:'You are hit by a tech attack.',
     ef_en:'1/round, you may take any QUICK TECH option against the attacker as a reaction.'}
,
    // v210 (Б1): реакции фреймов — Defensive Pulse дословно из БД; Tactical Simulation:
    // EN из корбука, RU — черновой перевод. Условие (активный щит/протокол) — пометкой
    // в тексте, actionGranted состояний не знает.
    {key:'defensivepulse', name:'Defensive Pulse', ru:'Защитный импульс', grant:{frame:'Saladin'},
     tr_ru:'Ваша цель атакована.',
     ef_ru:'Вы усиливаете её тахионный щит импульсом энергии. Она получает сопротивление всему урону от атаки, а если атака промахивается, вы можете заставить атакующего перебросить её против персонажа или объекта по вашему выбору, проверяя прямую видимость и дальность от вашей цели вместо атакующего. Если атака была частью области эффекта, новая цель должна находиться внутри той же области эффекта исходной атаки. Только пока активен тахионный щит.',
     tr_en:'Your target is attacked.',
     ef_en:'You empower their tachyon shield with a pulse of energy. They gain Resistance to all damage from the attack, and if the attack misses, you may force the attacker to reroll it against a character or object of your choice, checking line of sight and Range from your target instead of from the attacker. If the attack was part of an area of effect, the new target must be inside the same area of effect from the original attack instead. Only while Tachyon Shield is active.'},
    {key:'tacticalsimulation', name:'Tactical Simulation', ru:'Тактическое моделирование', grant:{frame:'Swallowtail'},
     tr_ru:'Союзный персонаж в линии видимости получает урон от другого персонажа в линии видимости.',
     ef_ru:'Бросьте 1d6. При 4+ атака на самом деле была симуляцией, предсказанной вашим процессором: ваш союзник получает сопротивление всему урону от атаки и может телепортироваться на расстояние до 3 клеток, что представляет его «истинное» местоположение. При 3 и меньше — сбой: ваш союзник не получает сопротивление, но может телепортироваться на расстояние до 6 клеток. Только пока активно «Пророческое вмешательство».',
     tr_en:'An allied character in line of sight is damaged by another character in line of sight.',
     ef_en:'Roll 1d6. On 4+, the attack was actually a simulation predicted by your processor — your ally gains RESISTANCE to all damage dealt by the attack and may teleport up to 3 spaces, representing their "true" location. On 3 or less, there’s a glitch — your ally doesn’t gain RESISTANCE, but can teleport up to 6 spaces. Only while Prophetic Interjection is active.'}
,
    // v210 (Б1): реакции оружия — дословно из БД; грант {weapon:...} — новая ветка actionGranted.
    {key:'autonomousassault', name:'Autonomous Assault', ru:'Автономная атака', grant:{weapon:'Autopod'},
     tr_ru:'Другой персонаж атакует цель в пределах дальности 15 от вас и расходует захват цели.',
     ef_ru:'Вы автоматически попадаете по его цели из автопода.',
     tr_en:'Another character attacks a target within range 15 of you and consumes Lock On',
     ef_en:'You may automatically hit their target with the Autopod.'},
    {key:'snickersnack', name:'Snicker-Snack', ru:'Хруп-хруп', grant:{weapon:'Vorpal Gun'},
     tr_ru:'Враждебный персонаж в пределах дальности вопальной пушки и в линии видимости наносит урон союзному персонажу.',
     ef_ru:'Вы можете совершить атаку по враждебному персонажу из вопальной пушки.',
     tr_en:'A hostile character within Range of the Vorpal Gun and line of sight deals damage to an allied character.',
     ef_en:'You may make an attack against the hostile character with the Vorpal Gun.'}
,
    // v210 (Б1): реакция Core Bonus — дословно из CORE_BONUSES; грант {coreBonus:...} —
    // новая ветка actionGranted (проверка по S.pilot.coreBonuses).
    {key:'heldimage', name:'The Lesson of the Held Image', ru:'Урок удерживаемого образа', grant:{coreBonus:'The Lesson of the Held Image'},
     tr_ru:'Начало хода союзного персонажа.',
     ef_ru:'Вы можете попытаться наложить LOCK ON на любого персонажа в пределах сенсоров.',
     tr_en:'An allied character’s turn starts.',
     ef_en:'You may attempt to LOCK ON to any character within Sensors.'}
,
    // v210 (Б1): реакции дронов OROCHI (Hydra) — EN из корбука, RU — черновой перевод.
    // per '1/раунд на персонажа': в книге лимита 1/раунд нет, ограничение — в триггере
    // (впервые за раунд на каждого персонажа). Действуют только пока дрон развёрнут.
    {key:'orochisnare', name:'Snare Drone', ru:'Дрон-ловушка', grant:{frame:'Hydra'}, per:'1/раунд на персонажа',
     tr_ru:'Персонаж начинает свой ход рядом с этим дроном или впервые за раунд перемещается рядом с ним.',
     ef_ru:'Вы можете заставить его совершить спасбросок ловкости. При провале он становится обездвиженным. Он перестаёт быть обездвиженным, только когда дрон уничтожен, больше не рядом с ним или когда персонаж преуспевает в спасброске ловкости как быстрое действие. Только пока этот дрон развёрнут.',
     tr_en:'A character starts their turn adjacent to this drone, or moves adjacent to it for the first time in a round.',
     ef_en:'You may force them to make an AGILITY save. On a failure, they become IMMOBILIZED. They only cease to be IMMOBILIZED when the drone is destroyed or no longer adjacent, or they succeed on an AGILITY save as a quick action. Only while this drone is deployed.'},
    {key:'orochishredder', name:'Shredder Drone', ru:'Дрон-шинковщик', grant:{frame:'Hydra'}, per:'1/раунд на персонажа',
     tr_ru:'Персонаж начинает свой ход рядом с этим дроном или впервые за раунд перемещается рядом с ним.',
     ef_ru:'Вы можете заставить его совершить спасбросок корпуса. При провале он получает 1 энергетического урона и становится изорванным до конца своего следующего хода. Только пока этот дрон развёрнут.',
     tr_en:'A character starts their turn adjacent to this drone, or moves adjacent to it for the first time in a round.',
     ef_en:'You may force them to make a HULL save. On a failure, they take 1 Energy damage and become SHREDDED until the end of their next turn. Only while this drone is deployed.'},
    {key:'orochihunted', name:'Hunted Drone', ru:'Дрон-загонщик', grant:{frame:'Hydra'}, per:'1/раунд на персонажа',
     tr_ru:'Персонаж начинает свой ход рядом с этим дроном или впервые за раунд перемещается рядом с ним.',
     ef_ru:'Вы можете заставить его совершить спасбросок систем. При провале он получает захват цели. Только пока этот дрон развёрнут.',
     tr_en:'A character starts their turn adjacent to this drone, or moves adjacent to it for the first time in a round.',
     ef_en:'You may force them to make a SYSTEMS save. On a failure, they receive LOCK ON. Only while this drone is deployed.'}
  ],
  protocols: [
    {key:'shepherd', name:'Shepherd', ru:'Пастух', grant:{talent:'Drone Commander', rank:1},
     tx_ru:'Вы можете переместить одного дрона, которым вы управляете и который находится в пределах ваших сенсоров, на расстояние до 4 клеток.',
     tx_en:'You may move one drone that you control and that is within SENSORS up to 4 spaces.'},
    {key:'steadyaim', name:'Steady Aim', ru:'Прицелиться', grant:{talent:'Crack Shot', rank:1},
     tx_ru:'Протоколом вы можете прицелиться. Если вы это сделаете, вы становитесь обездвиженным до начала вашего следующего хода, но получаете +1 к точности на все атаки, совершаемые винтовками.',
     tx_en:'As a protocol, you may steady your aim. If you do, you become Immobilized until the start of your next turn but gain +1 Accuracy on all attacks you make with Rifles.'},
    {key:'engagecompcon', name:'Engage COMP/CON', ru:'Включить COMP/CON', grant:{system:'COMP/CON-Class Assistant Unit'},
     tx_ru:'Передаёшь управление мехом его COMP/CON: мех действует независимо в твой ход со своим набором действий. У меха под COMP/CON нет собственной инициативы — нужны прямые указания.',
     tx_en:'You give control of your mech to its COMP/CON, allowing your mech to act independently on your turn with its own set of actions. Unlike other AIs, a mech controlled by a COMP/CON has no independent initiative and requires direct input.'},
    {key:'transfercontrol', name:'Transfer Control', ru:'Передать управление', grant:{system:'Expanded Compartment'},
     tx_ru:'Передаёшь управление мехом пассажиру (не-меху размера 1/2) в кабине или забираешь обратно. Если пассажир берёт управление, мех становится Impaired и Slowed.',
     tx_en:'You hand over or take back control to or from a non-Mech character or object of Size 1/2 riding as a passenger in the cockpit. If they take over the controls from you, the mech becomes Impaired and Slowed.'},
    {key:'projectshield', name:'Project Shield', ru:'Проецируемый щит', grant:{system:'Type-3 Projected Shield'},
     tx_ru:'Назначь персонажа в пределах линии видимости: все дальние или рукопашные атаки, которые он совершает против тебя или которые ты совершаешь против него, получают +2 к сложности до начала твоего следующего хода.',
     tx_en:'Nominate a character within line of sight: all ranged or melee attacks that they make against you or that you make against them gain +2 Difficulty until the start of your next turn.'},
    {key:'sekhmetprotocol', name:'SEKHMET Protocol', ru:'Протокол «Сехмет»', grant:{system:'SEKHMET-Class NHP'},
     tx_ru:'Передаёшь управление мехом своему NHP. Преимущества: все критические попадания в ближнем бою наносят +1d6 бонусного урона; 1/раунд можешь Skirmish только рукопашным оружием как свободное действие.',
     tx_en:'When activated, you give control of your mech to your NHP and gain the following benefits: all melee critical hits deal +1d6 bonus damage; 1/round, you can Skirmish with melee weapons only as a free action.'},
    {key:'takebackcontrol', name:'Take Back Control', ru:'Вернуть управление', grant:{system:'SEKHMET-Class NHP'},
     tx_ru:'Забираешь управление мехом у SEKHMET. Ты становишься Stunned до начала своего следующего хода.',
     tx_en:'You take back control of your mech from SEKHMET. You become Stunned until the start of your next turn.'},
    {key:'ramjet', name:'Ramjet', ru:'Рамджет', grant:{system:'Ramjet'},
     tx_ru:'До начала твоего следующего хода: при Boost можешь двигаться на +2 клетки, а твои рукопашные атаки (включая таран, захват и т.д.) получают отброс 2. Двигаясь, ты должен пройти всю Speed по прямой (можешь остановиться при столкновении).',
     tx_en:'Until the start of your next turn, you can move +2 spaces when you Boost and your melee attacks (including Ram, Grapple, and so on) gain Knockback 2. When you move during this time, you must move your full Speed in a straight line; however, you can stop if you would collide.'},
    {key:'coresiphon', name:'Core Siphon', ru:'Отвод ядра', grant:{system:'Core Siphon'},
     tx_ru:'При активации: +1 к точности на первый бросок атаки в этот ход, но +1 к сложности на все остальные броски атаки до конца хода.',
     tx_en:'When you activate this protocol, you gain +1 accuracy on your first attack roll this turn, but receive +1 difficulty on all other attack rolls until the end of the turn.'},
    {key:'oasiswall', name:'OASIS Wall', ru:'Стена ОАЗИС', grant:{system:'OASIS Wall'},
     tx_ru:'До начала твоего следующего хода можешь двигаться только по прямой; двигаясь, создаёшь за собой голографический след — световой барьер из смежных секций того же размера, что и твой мех, в каждой клетке, через которую проходишь.',
     tx_en:'Until the start of your next turn, you can only move in straight lines; however, you create a holographic trail behind you as you move, creating a light barrier made of contiguous sections the same Size as your mech in each space you move through.'},
    {key:'activecamouflage', name:'Active Camouflage', ru:'Активный камуфляж', grant:{system:'Active Camouflage'},
     tx_ru:'Ты становишься Invisible, пока не получишь урон или до конца своего следующего хода.',
     tx_en:'You become Invisible until you take damage, or until the end of your next turn.'},
    {key:'tlalocprotocol', name:'TLALOC Protocol', ru:'Протокол «Тлалок»', grant:{system:'TLALOC-Class NHP'},
     tx_ru:'Твой NHP быстро стреляет и перенацеливает твоё оружие. Ты становишься Immobilized до начала своего следующего хода; за это время можешь перебросить каждый промахнувшийся бросок рукопашной или дальней атаки один раз, выбрав новую цель в пределах дальности атаки.',
     tx_en:'Your NHP can rapidly fire and retarget your weapons. You become Immobilized until the start of your next turn; however, during this time, you may reroll each missed melee or ranged attack roll once, choosing a new target within the attack\u2019s Range.'},
    {key:'retractableprofile', name:'Retractable Profile', ru:'Убираемый профиль', grant:{system:'Retractable Profile'},
     tx_ru:'Мех убирает свои основные системы, уменьшая профиль. Пока активен: броски на твоё обнаружение получают +1 к сложности, пока ты Hidden; дальние и тех-атаки против тебя получают +1 к сложности; ты становишься Slowed и не можешь атаковать.',
     tx_en:'Your mech can retract its major systems to reduce its profile. While active: rolls to locate you receive +1 difficulty while you are Hidden; ranged and tech attacks against you receive +1 difficulty; you become Slowed and can\u2019t make attacks of any kind.'},
    {key:'lightninggenerator', name:'Lightning Generator', ru:'Генератор молний', grant:{system:'Lightning Generator'},
     tx_ru:'При активации: получи 1 тепло и нанеси 2 энергетического урона всем персонажам и объектам, соседним с тобой. Если в начале твоего хода ты в Danger Zone, протокол активируется автоматически, а урон возрастает до 4 AP энергетического.',
     tx_en:'When you activate this protocol, take 1 heat and deal 2 energy to all characters and objects adjacent to you. If you are in the Danger Zone at the start of your turn, this protocol activates automatically, but the damage increases to 4 AP energy.'},
    {key:'autocooler', name:'Auto-Cooler', ru:'Автоохладитель', grant:{system:'Auto-Cooler'},
     tx_ru:'Пока ты не получаешь урон, не двигаешься и не превышаешь предел тепла, ты сбрасываешь всё тепло в начале своего следующего хода.',
     tx_en:'As long as you don\u2019t take damage, move, or exceed your Heat Cap, you clear all heat at the start of your next turn.'},
    {key:'agniprotocol', name:'AGNI Protocol', ru:'Протокол AGNI', grant:{system:'AGNI-Class NHP'},
     tx_ru:'1/сцена, потрать заряд, чтобы автоматически сбросить всё тепло в конце своего хода, выпустив его волной вспышки 2. Персонажи в зоне должны преуспеть в спасброске Engineering или получить 2 burn и быть оттолкнутыми за пределы зоны.',
     tx_en:'1/scene, expend a charge to automatically clear all heat at the end of your turn, venting it in a burst 2 wave. Characters within the affected area must succeed on an Engineering save or take 2 burn and be pushed outside the area.'},
    {key:'deactivatehardlight', name:'Deactivate Hardlight Defense System', ru:'Отключить твёрдосветную защиту', grant:{system:'Hardlight Defense System'},
     tx_ru:'Отключить твёрдосветную защиту, сняв Immobilized, который она накладывает.',
     tx_en:'Deactivate the Hardlight Defense System, removing the Immobilized condition it inflicts.'},
    {key:'asuraprotocol', name:'ASURA Protocol', ru:'Протокол ASURA', grant:{system:'ASURA-Class NHP'},
     tx_ru:'1/сцена, потрать заряд, чтобы совершить два дополнительных быстрых действия или одно дополнительное полное действие в этот ход. Действия должны соблюдать ограничения на повторы.',
     tx_en:'1/scene, expend a charge to take two additional quick actions or one additional full action this turn. These actions must obey restrictions on duplicate actions.'},
    {key:'luciferprotocol', name:'LUCIFER Protocol', ru:'Протокол LUCIFER', grant:{system:'LUCIFER-Class NHP'},
     tx_ru:'Потрать заряд, чтобы твоя следующая дальняя или рукопашная атака в этот ход при попадании наносила бонусный урон, равный твоему текущему теплу после активации протокола, если оружие наносит энергетический урон.',
     tx_en:'Expend a charge to give your next ranged or melee attack this turn bonus damage on hit equal to your current heat after activating this protocol, as long as the weapon deals any energy.'}
  ],
  quick: [
    {key:'activaterestockdrone', name:'Activate Restock Drone', ru:'Активировать дрон снабжения', grant:{system:'Restock Drone'},
     tx_ru:'Снимите 1d6 тепла и одно состояние и перезарядите одно оружие с Перезарядкой. После активации дрон немедленно распадается.',
     tx_en:'Clear 1d6 heat and one condition, and reload one Loading weapon. After being activated, the drone immediately disintegrates.'},
    {key:'detonatebreachingcharge', name:'Detonate', ru:'Подорвать (проломный заряд)', grant:{system:'BB Breach/Blast Charges'},
     tx_ru:'Персонажи в зоне взрыва 1 должны преуспеть в спасброске ловкости, иначе получат 2d6 бронебойного взрывного урона. При успехе — половину урона. Объекты и местность поражаются автоматически и получают 30 бронебойного взрывного урона.',
     tx_en:'Characters within a Burst 1 area must succeed on an Agility save or take 2d6 AP explosive damage. On a success, they take half damage. Objects and terrain are hit automatically and take 30 AP explosive damage.'},
    {key:'moveiceoutdrone', name:'Move ICEOUT Drone', ru:'Переместить дрон ICEOUT', grant:{system:'ICEOUT Drone'},
     tx_ru:'Дрон ICEOUT можно переместить в любую точку в пределах сенсоров.',
     tx_en:'The ICEOUT drone can be moved to any point within Sensors.'},
    {key:'detonategroundingmine', name:'Detonate Grounding Mine', ru:'Подорвать заземляющую мину', grant:{system:'Grounding Charges'},
     tx_ru:'Подрыв заземляющей мины поражает одного персонажа в пределах дальности 5 от мины: он должен пройти спасбросок корпуса, иначе его притягивает как можно ближе к мине и сбивает с ног. Летающие персонажи, провалившие спасбросок, подвергаются тому же эффекту, но также вынуждены приземлиться (это считается падением, но без урона).',
     tx_en:'Detonating the Grounding Mine affects a single character within range 5 of the mine: they must succeed on a Hull save or be pulled as far as possible toward the mine and knocked Prone. Flying characters that fail the save are affected the same way, except they are also forced to land (this counts as falling but without damage).'}
,
    {key:'invigorate', name:'Invigorate', ru:'Воодушевление', grant:{talent:'Drone Commander', rank:3},
     tx_ru:'Быстрым действием вы можете послать импульс энергии союзному персонажу (включая дронов) в пределах 3, проведя к нему ЛИНИЮ. Вы можете продлить импульс от вашей цели к другому союзному персонажу, продлив ЛИНИЮ к нему, пока он в пределах 3, и продолжать продлевать импульс (и ЛИНИЮ) так, пока не нацелитесь на одного персонажа дважды. Союзные персонажи на пути ЛИНИИ могут восстановить +1d6 HP (бросок один на всех); враждебные персонажи получают энергетический урон, равный выпавшему числу.',
     tx_en:'As a quick action, you may send a pulse of energy to an allied character (including DRONES) within 3, drawing a LINE to them. You may extend the pulse from your target to another allied character, extending the LINE to them, as long as they are within 3, and you may continue extending the pulse (and LINE) like this as long as you don\u2019t target the same character twice. Allied characters in the LINE\u2019s path can restore +1d6 HP (rolled once); hostile characters take energy damage equal to the amount rolled.'},
    {key:'coveringfire', name:'Covering Fire', ru:'Прикрывающий огонь', grant:{talent:'Heavy Gunner', rank:1},
     tx_ru:'Быстрым действием выберите персонажа в пределах дальности и линии видимости одного из ваших тяжёлых дальнобойных оружий и в пределах 10 клеток: он получает Ослабление до начала вашего следующего хода. Пока действует эффект, если ваша цель перемещается больше чем на 1 клетку, она снимает Ослабление, но вы можете атаковать её реакцией из тяжёлого дальнобойного оружия за половину урона, тепла или ожога, после чего эффект заканчивается. Вы можете совершить эту атаку в любой момент её перемещения (например, дождавшись, пока она выйдет из укрытия). ПРИКРЫВАЮЩИЙ ОГОНЬ может действовать только на одного персонажа за раз — повторное использование заменяет предыдущее — и немедленно заканчивается, если ваша цель наносит вам урон.',
     tx_en:'As a quick action, choose a character within Range and line of sight of one of your heavy ranged weapons, and within 10 spaces: they are Impaired until the start of your next turn. For the duration, if your target moves more than 1 space, they clear Impaired, but you may attack them as a reaction with a heavy ranged weapon for half damage, heat, or burn, then this effect ends. You can make this attack at any point during their movement (e.g., waiting until they exit cover). COVERING FIRE can only affect one character at a time \u2013 subsequent uses replace previous ones \u2013 and it immediately ends if your target damages you.'},
    {key:'balancecontrollockout', name:'Balance Control Lockout', ru:'Блокировка контроля равновесия', grant:{frame:'Chomolungma'},
     tx_ru:'Опция Вторжения: притяните цель на 2 клетки в любом направлении и сбейте её с ног. Если она уже лежит, она становится обездвиженной до конца своего следующего хода.',
     tx_en:'Invade option: Pull your target 2 spaces in any direction and knock them Prone. If they are already Prone, they become Immobilized until the end of their next turn.'},
    {key:'systemcrusher', name:'System Crusher', ru:'Крушитель систем', grant:{frame:'Chomolungma'},
     tx_ru:'Опция Вторжения: цель получает дополнительно 2 тепла, всего 4 тепла. Если это приводит к превышению максимального уровня тепла, цель также получает 4 единицы ожога. Можно использовать только 1 раз за сцену на каждом персонаже.',
     tx_en:'Invade option: Your target takes an additional 2 heat, for a total of 4 heat. If this Invade causes them to exceed their Heat Cap, they take 4 burn as well. This can only be used 1/scene on each character.'}
,
    // v210 (Б1): 16 опций Вторжения из 8 систем — дословно из БД (x/xr систем).
    {key:'shrikecode', name:'Shrike Code', ru:'Код «Сорокопут»', grant:{system:'Neurospike'},
     tx_ru:'Опция Вторжения: до конца следующего хода цели всякий раз, когда она атакует, она сначала получает 2 тепла.',
     tx_en:'Invade option: Until the end of the target’s next turn, they first take 2 heat whenever they attack.'},
    {key:'mirage', name:'Mirage', ru:'Мираж', grant:{system:'Neurospike'},
     tx_ru:'Опция Вторжения: выберите себя или союзного персонажа: ваши системы передают размытые, иллюзорные образы поверх их реального силуэта. Ваша цель считает вас или выбранного вами персонажа невидимым до конца своего следующего хода.',
     tx_en:'Invade option: Choose yourself or an allied character: your systems relay blurred, illusory images over their actual silhouette. Your target treats you, or the character you chose, as Invisible until the end of their next turn.'},
    {key:'stalkprey', name:'Stalk Prey', ru:'Выследить добычу', grant:{system:'Hunter Logic Suite'},
     tx_ru:'Опция Вторжения: вы заражаете цель вирусным кодом, который стирает ваш образ с её сенсоров. Она считает вас невидимым, пока не получит от вас урон. Одновременно может действовать только на одну цель.',
     tx_en:'Invade option: You infect the target with a viral logic that wipes your image from their sensors. They treat you as Invisible until you next take damage from them. This can only affect one target at a time.'},
    {key:'terrify', name:'Terrify', ru:'Устрашить', grant:{system:'Hunter Logic Suite'},
     tx_ru:'Опция Вторжения: вы заражаете цель вирусным кодом, из-за которого ваш мех кажется ей ужасающим. До конца её следующего хода она становится ослабленной и не может совершать добровольные перемещения, приближающие её к вам.',
     tx_en:'Invade option: You infect the target with a viral logic that makes your mech appear horrifying. Until the end of their next turn, they become Impaired and cannot make any voluntary movements that bring them closer to you.'},
    {key:'puppetsystem', name:'Puppet System', ru:'Система «Марионетка»', grant:{system:'H0R_OS System Upgrade I'},
     tx_ru:'Опция Вторжения: цель перемещается на максимальную скорость в выбранном вами направлении. Её можно переместить в опасные области и на другие препятствия, но на неё по-прежнему действуют сложная местность, препятствия и так далее. Это перемещение недобровольное, но провоцирует реакции и вовлечённость как обычно и не считается отбрасыванием, толканием или притягиванием.',
     tx_en:'Invade option: Your target moves its maximum Speed in a direction of your choice. They can be moved into hazardous areas and other obstacles, but are still affected by difficult terrain, obstructions, and so on. This movement is involuntary, but provokes reactions and Engagement as normal and doesn’t count as Knockback, pushing, or pulling.'},
    {key:'ejectpowercores', name:'Eject Power Cores', ru:'Сброс энергоядер', grant:{system:'H0R_OS System Upgrade I'},
     tx_ru:'Опция Вторжения: цель становится заглушенной до конца своего следующего хода: вы временно нарушаете работу её систем, сбрасывая магазины с боеприпасами и охлаждающие стержни. Персонажи, соседние с целью, получают 2 ед. энергетического урона. Можно использовать 1 раз за сцену на каждого персонажа.',
     tx_en:'Invade option: Your target becomes Jammed until the end of their next turn as you temporarily disrupt their systems, ejecting ammo magazines and cooling rods. Characters adjacent to your target take 2 energy damage. This can only be used 1/scene on each character.'},
    {key:'dimensionalemblems', name:'Dimensional Emblems', ru:'Измерение эмблем', grant:{system:'H0R_OS System Upgrade III'},
     tx_ru:'Опция Вторжения: вы создаёте три конструкта данных размера 1 в свободных пространствах, соседних с вашей целью, но не соседних друг с другом. Когда персонаж проходит сквозь один из конструктов, он получает 2 тепла, а конструкт исчезает. Они существуют до конца сцены или пока не будут уничтожены, пока вы снова не используете это действие или не удалите их свободным действием. Конструкт может быть уничтожен соседним персонажем при успешной проверке навыка систем быстрым действием.',
     tx_en:'Invade option: You create three Size 1 data constructs in free spaces adjacent to your target, but not adjacent to each other. When a character passes through one of the constructs, they take 2 heat and the construct disappears. They last for the rest of the scene or until either they are destroyed, you take this action again, or you delete them as a free action. A construct can be destroyed by an adjacent character with a successful Systems skill check as a quick action.'},
    {key:'celestialshackles', name:'Celestial Shackles', ru:'Небесные оковы', grant:{system:'H0R_OS System Upgrade III'},
     tx_ru:'Опция Вторжения: отметьте пространство, которое сейчас занимает ваша цель. Если она покинет отмеченное пространство, один раз в любой момент вашего хода вы можете свободным действием телепортировать её обратно в это пространство или как можно ближе к нему, прекращая этот эффект. Пострадавший персонаж может попытаться пройти спасбросок систем быстрым действием, чтобы прекратить эффект, иначе он длится до конца сцены.',
     tx_en:'Invade option: Mark a space your target currently occupies. If they leave the affected space, once at any point during your turn, you may take a free action to teleport them back to that space, or as close as possible, ending this effect. An affected character can attempt to succeed on a Systems save as a quick action to end the effect, otherwise it lasts until the end of the scene.'},
    {key:'beckon', name:'Beckon', ru:'Зов', grant:{system:'Beckoner'},
     tx_ru:'Опция Вторжения: Вы получаете 1к6+2 бронебойного энергетического урона и меняетесь местами с целью — оба персонажа телепортируются на позиции друг друга. Ваша цель должна быть мехом того же размера, что и вы, или больше, иначе действие не удаётся. Персонажей можно менять местами только на пространства, где они обычно могли бы стоять или перемещаться (т.е. если персонаж не может летать, его нельзя поменять местами в воздухе).',
     tx_en:'Invade option: You take 1d6+2 AP energy damage and swap places with your target, both characters teleporting to the other’s position. Your target must be a Mech and be the same Size as you or larger, or this action fails. Characters can only be swapped to spaces they could normally stand or move on (i.e., if a character cannot fly it can’t be swapped midair).'},
    {key:'summon', name:'Summon', ru:'Призыв', grant:{system:'Beckoner'},
     tx_ru:'Опция Вторжения: Все персонажи в пределах дальности 3 от вашей цели притягиваются вплотную к ней или как можно ближе.',
     tx_en:'Invade option: All characters within range 3 of your target are pulled adjacent to them, or as close as possible.'},
    {key:'smite', name:'Smite', ru:'Кара', grant:{system:'Smite'},
     tx_ru:'Опция Вторжения: вы получаете 1d6 бронебойного энергетического урона, а ваша цель должна преуспеть в спасброске систем, иначе становится оглушённой до конца своего следующего хода. Каждый персонаж может быть оглушён этим эффектом только один раз за сцену.',
     tx_en:'Invade option: You take 1d6 AP energy damage and your target must succeed on a Systems save or become Stunned until the end of their next turn. Each character can only be Stunned by this effect once per scene.'},
    {key:'sear', name:'Sear', ru:'Ожог', grant:{system:'Smite'},
     tx_ru:'Опция Вторжения: вы получаете 1d6 бронебойного энергетического урона и наносите 2 тепла вашей цели за каждого другого персонажа размера 1 или больше, находящегося в сцеплении с ней или рядом с ней — включая вас, — до максимума в 6 тепла.',
     tx_en:'Invade option: You take 1d6 AP energy damage and you deal 2 heat to your target for each other character of Size 1 or larger that is Engaged with or adjacent to them – including you – up to a maximum of 6 heat.'},
    {key:'logicbomb', name:'Logic Bomb', ru:'Логическая бомба', grant:{system:'Viral Logic Suite'},
     tx_ru:'Опция Вторжения: все персонажи по вашему выбору в пределах вспышки 2 от вашей цели должны преуспеть в спасброске систем, иначе становятся замедленными, пока не завершат один из своих ходов, не находясь рядом ни с одним персонажем.',
     tx_en:'Invade option: All characters of your choice within burst 2 of your target must succeed on a Systems save or become Slowed until they end one of their turns not adjacent to any character.'},
    {key:'banish', name:'Banish', ru:'Изгнание', grant:{system:'Viral Logic Suite'},
     tx_ru:'Опция Вторжения: до конца следующего хода вашей цели она получает 2 тепла за каждую клетку, на которую добровольно перемещается, до максимума в 6 тепла.',
     tx_en:'Invade option: Until the end of your target’s next turn, they take 2 heat for every space they voluntarily move, up to a maximum of 6 heat.'},
    {key:'ophidiantrek', name:'Ophidian Trek', ru:'Змеиная тропа', grant:{system:'Metafold Carver'},
     tx_ru:'Опция Вторжения: ваша цель телепортируется на 1d6+1 клеток прямо к вам или как можно ближе. Если этот эффект переместил бы её в пространство, занятое персонажем, объектом или элементом местности, телепортация не срабатывает.',
     tx_en:'Invade option: Your target is teleported 1d6+1 spaces directly toward you, or as close as possible. If this effect would move them to a space occupied by a character, object, or piece of terrain, the teleport fails.'},
    {key:'foldspace', name:'Fold Space', ru:'Сложить пространство', grant:{system:'Metafold Carver'},
     tx_ru:'Опция Вторжения: ваша цель исчезает с поля боя до начала своего следующего хода. Она возвращается в то же пространство, из которого исчезла, или в свободное пространство по своему выбору как можно ближе к нему.',
     tx_en:'Invade option: Your target disappears from the battlefield until the start of its next turn. It returns in the same space they disappeared from, or in a free space of their choice as close as possible.'}
,
    // v210 (Б1): опции Hacker II — EN из корбука, RU — черновой перевод (проверить).
    {key:'jamcockpit', name:'Jam Cockpit', ru:'Заклинить кабину', grant:{talent:'Hacker', rank:2},
     tx_ru:'Опция Вторжения: персонажи не могут садиться в мех цели или покидать его, пока кабина не будет починена успешной проверкой инженерии как полное действие.',
     tx_en:'Invade option: Characters may not MOUNT or DISMOUNT your target until the cockpit is fixed with a successful ENGINEERING check as a full action.'},
    {key:'disablelifesupport', name:'Disable Life Support', ru:'Отключить жизнеобеспечение', grant:{talent:'Hacker', rank:2},
     tx_ru:'Опция Вторжения: ваша цель получает +1 к сложности всех спасбросков, пока система жизнеобеспечения не будет перезапущена успешной проверкой систем как быстрое действие.',
     tx_en:'Invade option: Your target receives +1 Difficulty on all saves until the life-support system is rebooted with a successful SYSTEMS check as a quick action.'},
    {key:'hackslash', name:'Hack./Slash', ru:'Взлом/Резня', grant:{talent:'Hacker', rank:2},
     tx_ru:'Опция Вторжения: ваша цель не может получать выгоду от быстрых или полных техдействий и совершать их, пока мех не будет выключен или его центральный компьютер не будет перезагружен успешной проверкой систем как быстрое действие.',
     tx_en:'Invade option: Your target cannot benefit from or take QUICK OR FULL TECH actions until the mech is either SHUT DOWN or its core computer is rebooted with a successful SYSTEMS check as a quick action.'}
,
    // v210 (Б1): действия талантов — Jackhammer и Bentham/Foucault дословно из БД.
    {key:'jackhammer', name:'Jackhammer', ru:'Отбойный молоток', grant:{talent:'Siege Specialist', rank:1},
     tx_ru:'Если у вас есть пушка, быстрым действием вы можете выстрелить отбойным снарядом из подствольного гранатомёта, автоматически нанося 10 бронебойного кинетического урона секции размера 1 любого объекта в пределах дальности (например, укрытия, развёртываемого оборудования, зданий или местности). Любые персонажи, соседние с вашей целью, отбрасываются от неё на 2 клетки и получают 2 кинетического урона.',
     tx_en:'If you have a Cannon, as a quick action, you can fire a jackhammer round from an underslung launcher, automatically dealing 10 AP Kinetic damage to a Size 1 section of any object within Range (e.g., cover, deployable equipment, buildings, or terrain). Any characters adjacent to your target are knocked back from it by 2 spaces and take 2 Kinetic damage.'},
    {key:'benthamfoucault', name:'Bentham/Foucault Elimination', ru:'Ликвидация Бентама/Фуко', grant:{talent:'Spotter', rank:3},
     tx_ru:'Быстрым действием, когда вы совершаете захват цели, вы можете назначить союзного персонажа рядом с вами: он может немедленно совершить любое быстрое действие реакцией, тратя состояние захвата цели вашей цели. Его действие не обязано быть атакой, но он получает выгоду от траты состояния захвата цели, если решает атаковать.',
     tx_en:'As a quick action when you Lock On, you may nominate an allied character adjacent to you: they may immediately make any quick action as a reaction, consuming your target’s Lock On condition. Their action does not need to be an attack, but they benefit from consuming the Lock On condition if they do choose to attack.'}
,
    // v210 (Б1): действия фреймов и Hacker III / Issue Order — списков Full Tech / Full Action /
    // Free Action в ACTIONS_REF нет, поэтому кладутся в quick с префиксом типа в тексте
    // (как «Опция Вторжения:» у Чомолунгмы). RU у Hologram Teleport, Blinkspace Jump,
    // Last Argument и Issue Order — черновой перевод (проверить).
    {key:'hologramteleport', name:'Hologram Teleport', ru:'Голографическая телепортация', grant:{frame:'Dusk Wing'},
     tx_ru:'Быстрое действие: вы можете мгновенно телепортироваться к любой голограмме в пределах дальности 50. Когда вы это делаете, все существующие голограммы детонируют, создавая взрывы вспышкой 1 с тем же эффектом, что выше, — и вы не можете создавать новые голограммы до начала своего следующего хода.',
     tx_en:'Quick Action: You may instantly teleport to the location of any hologram within Range 50. When you do so, all extant holograms detonate – creating Burst 1 explosions with the same effect as above – and you may not create any new holograms until the start of your next turn.'},
    {key:'fulldeployment', name:'Full Deployment', ru:'Полное развёртывание', grant:{frame:'Hydra'},
     tx_ru:'Активное (1 CP): Все четыре дрона OROCHI развёртываются в отдельные точки в пределах сенсоров; они остаются активными до конца сцены. Вы можете отозвать или повторно развернуть любое их число за раз.',
     tx_en:'Active (1 CP): All four OROCHI drones are deployed to separate points within Sensors; they remain active for the rest of the scene. You may recall or redeploy any number of them at a time.'},
    {key:'lastargumentofkings', name:'Last Argument of Kings', ru:'Последний довод королей', grant:{talent:'Hacker', rank:3},
     tx_ru:'Полная техника: совершите техатаку по цели в пределах сенсоров и в линии видимости. При успехе вы внедряете вирус, вызывающий небольшой расплав реактора цели: она немедленно получает ожог, равный её текущему теплу. Если это действие заставляет цель перегреться, оно разрешается до того, как она сбросит свой предел тепла.',
     tx_en:'Full Tech: Make a tech attack against a target within SENSORS and line of sight. On a success, you implant a virus that triggers a minor meltdown in your target’s reactor: they immediately take BURN equal to their current HEAT. If this action causes your target to overheat, it resolves before they reset their HEAT CAP.'},
    {key:'blinkspacejump', name:'Blinkspace Jump', ru:'Блинк-прыжок', grant:{frame:'Mourning Cloak'},
     tx_ru:'Полное действие: вы телепортируетесь в клетку в пределах дальности 3d6. Прямая видимость не требуется, но попытка телепортироваться в занятую клетку приводит к тому, что вы остаётесь на месте и теряете это действие. Если на всех трёх костях выпало одинаковое число, вы исчезаете, пока ваша группа не отдохнёт, после чего появляетесь рядом.',
     tx_en:'Full Action: You teleport to a space within Range 3d6. You don’t require line of sight, but attempts to teleport to occupied spaces cause you to remain stationary and lose this action. If you roll the same number on all three dice, you disappear until your group rests, at which point you reappear nearby.'},
    {key:'issueorder', name:'Issue Order', ru:'Отдать приказ', grant:{talent:'Leader', rank:1},
     tx_ru:'Свободное действие: один раз в свой ход вы можете отдать приказ союзному пилоту, с которым можете общаться, описав ход действий, и дать ему кость лидерства. Он может либо потратить кость лидерства, чтобы получить +1 к точности на любое действие, непосредственно следующее из этого приказа, либо вернуть её вам свободным действием. У союзников может быть только одна кость лидерства за раз, она действует, пока не использована или до конца текущей сцены. На ранге II вы также можете отдавать приказ реакцией в начале хода любого другого игрока, любое количество раз за раунд.',
     tx_en:'Free Action: Once on your turn, you may give an order to an allied PC you can communicate with, describing a course of action, and give them a LEADERSHIP DIE. They may either expend the LEADERSHIP DIE to gain +1 Accuracy on any action that directly follows from that order, or they may return it to you as a free action. Allies can have one LEADERSHIP DIE at a time, which lasts until used or until the end of the current scene. At rank II, you may also issue a command as a reaction at the start of any other player’s turn, any number of times per round.'}
  ]
};

function actionGranted(a){
  if(!a.grant) return true;
  if(a.grant.talent){
    const t = (S.talents||[]).find(x=>x.name===a.grant.talent);
    return !!t && (t.rank||1) >= (a.grant.rank||1);
  }
  if(a.grant.system){
    return (S.systems||[]).some(x=>x.name===a.grant.system);
  }
  if(a.grant.frame){
    return frameKey(S.mech && S.mech.frame) === a.grant.frame;
  }
  if(a.grant.weapon){
    // v210 (Б1): действие даёт оружие — оно должно стоять на маунте меха.
    return (S.mounts||[]).some(m=>(m.weapons||[]).some(w=>w.name===a.grant.weapon));
  }
  if(a.grant.coreBonus){
    // v210 (Б1): действие даёт Core Bonus — он должен быть взят пилотом.
    return (S.pilot && S.pilot.coreBonuses||[]).includes(a.grant.coreBonus);
  }
  return true;
}

function renderMyActions(){
  const box = document.getElementById('myActions');
  if(!box) return;
  const en = lang()==='en';
  const myQk = (ACTIONS_REF.quick||[]).filter(a=>actionGranted(a));
  const myRe = ACTIONS_REF.reactions.filter(a=>!a.def && actionGranted(a));
  const myPr = ACTIONS_REF.protocols.filter(a=>actionGranted(a));
  if(!myQk.length && !myRe.length && !myPr.length){
    box.innerHTML = '<p class="hint">' + esc(L('u232')) + '</p>';
    return;
  }
  let h = '';
  if(myQk.length){
    h += '<h3>' + esc(L('u235')) + '</h3><ul>';
    for(const a of myQk){
      const nm = en ? a.name : (a.ru || a.name);
      h += '<li><b>' + esc(nm) + '</b>' + actionHeatBadge(a) + ' — ' + linkTagTerms(esc(en ? a.tx_en : a.tx_ru)) + actionSource(a) + '</li>';
    }
    h += '</ul>';
  }
  if(myRe.length){
    h += '<h3>' + esc(L('u230')) + '</h3><ul>';
    for(const a of myRe){
      const nm = en ? a.name : (a.ru || a.name);
      h += '<li><b>' + esc(nm) + (a.per ? ' (' + esc(a.per) + ')' : ' (1/раунд)') + '</b>' + actionHeatBadge(a) + ' — <i>' + esc(en ? 'Trigger' : 'Триггер') + ':</i> ' + linkTagTerms(esc(en ? a.tr_en : a.tr_ru)) + ' <i>' + esc(en ? 'Effect' : 'Эффект') + ':</i> ' + linkTagTerms(esc(en ? a.ef_en : a.ef_ru)) + actionSource(a) + '</li>';
    }
    h += '</ul>';
  }
  if(myPr.length){
    h += '<h3>' + esc(L('u231')) + '</h3><ul>';
    for(const a of myPr){
      const nm = en ? a.name : (a.ru || a.name);
      h += '<li><b>' + esc(nm) + '</b>' + actionHeatBadge(a) + ' — ' + linkTagTerms(esc(en ? a.tx_en : a.tx_ru)) + actionSource(a) + '</li>';
    }
    h += '</ul>';
  }
  box.innerHTML = h;
}
