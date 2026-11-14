// v64: справочник действий. Реакции и протоколы, которые дают таланты и системы.
// Источники: корбук (реакции по умолчанию и талантов — сверены), lancer-data systems.json
// (какая система даёт какое действие) + ru_systems (русский текст), корбук (тексты реакций).
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
  ]
};
// Проверка, есть ли у игрока фича, дающая действие (талант с нужным рангом или система).
function actionGranted(a){
  if(!a.grant) return true;
  if(a.grant.talent){
    const t = (S.talents||[]).find(x=>x.name===a.grant.talent);
    return !!t && (t.rank||1) >= (a.grant.rank||1);
  }
  if(a.grant.system){
    return (S.systems||[]).some(x=>x.name===a.grant.system);
  }
  return true;
}
// Рендер секции «Твои действия» на вкладке «Правила»: свои реакции и протоколы —
// только те, что даёт твоя сборка; они выводятся выше дефолтных.
function renderMyActions(){
  const box = document.getElementById('myActions');
  if(!box) return;
  const en = (typeof LANG!=='undefined' && LANG==='en');
  const myRe = ACTIONS_REF.reactions.filter(a=>!a.def && actionGranted(a));
  const myPr = ACTIONS_REF.protocols.filter(a=>actionGranted(a));
  if(!myRe.length && !myPr.length){
    box.innerHTML = '<p class="hint">' + esc(L('u232')) + '</p>';
    return;
  }
  let h = '';
  if(myRe.length){
    h += '<h3>' + esc(L('u230')) + '</h3><ul>';
    for(const a of myRe){
      const nm = en ? a.name : (a.ru || a.name);
      h += '<li><b>' + esc(nm) + (a.per ? ' (' + esc(a.per) + ')' : ' (1/раунд)') + '</b> — <i>' + esc(en ? 'Trigger' : 'Триггер') + ':</i> ' + esc(en ? a.tr_en : a.tr_ru) + ' <i>' + esc(en ? 'Effect' : 'Эффект') + ':</i> ' + esc(en ? a.ef_en : a.ef_ru) + '</li>';
    }
    h += '</ul>';
  }
  if(myPr.length){
    h += '<h3>' + esc(L('u231')) + '</h3><ul>';
    for(const a of myPr){
      const nm = en ? a.name : (a.ru || a.name);
      h += '<li><b>' + esc(nm) + '</b> — ' + esc(en ? a.tx_en : a.tx_ru) + '</li>';
    }
    h += '</ul>';
  }
  box.innerHTML = h;
}
