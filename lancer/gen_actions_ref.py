#!/usr/bin/env python3
"""Генератор данных справочника действий (v64) для Lancer-трекера.

Источники:
- lancer-data systems.json (https://github.com/massif-press/lancer-data) — поле actions[]
  (activation: Reaction/Protocol/Quick/Full, name, detail) — источник истины, КАКАЯ
  система даёт КАКОЕ действие.
- ru_systems_a/b/c.json (локальные русские переводы описаний систем) — русский текст
  действия (первая часть описания до " | ").
- Корбук (~/workspace/lancer-core-book.txt) — тексты реакций талантов (проверены вручную).

Вывод: JS-объект ACTIONS_REF в stdout (для вставки в index.html).
"""
import json

# --- Талантовые реакции: сверены с корбуком, перевод русский ---
# grant: (талант, минимальный ранг)
TALENT_REACTIONS = [
    {
        "key": "intercede", "name": "Intercede", "ru": "Вмешательство",
        "grant": {"talent": "Bonded", "rank": 2},
        "trigger": "Ты соседствуешь со своим bondmate (пилотом или мехом), и он получает урон от источника в твоей линии видимости.",
        "effect": "Ты можешь принять этот урон на себя.",
    },
    {
        "key": "supersonic", "name": "Supersonic", "ru": "Сверхзвук",
        "grant": {"talent": "Ace", "rank": 3},
        "trigger": "Ход твоей цели заканчивается. (Перед этим: как быстрое действие на своём ходу разгони двигатели; если закончишь ход в полёте, назначь персонажа в пределах дальности, равной твоей Speed, и в линии видимости — и получи эту реакцию.)",
        "effect": "Ты перелетаешь в свободное пространство, соседнее с целью.",
    },
    {
        "key": "returnfire", "name": "Return Fire", "ru": "Ответный огонь",
        "grant": {"talent": "Gunslinger", "rank": 2},
        "trigger": "Персонаж попадает по тебе дальней атакой.",
        "effect": "Ты можешь немедленно атаковать его одним вспомогательным (Aux) дальним оружием, если он в пределах дальности.",
    },
    {
        "key": "valiantaid", "name": "Valiant Aid", "ru": "Доблестная помощь",
        "grant": {"talent": "Exemplar", "rank": 1},
        "trigger": "Союзник атакует персонажа с твоей меткой Exemplar и промахивается.",
        "effect": "Он может перебросить атаку. Второй результат обязателен, даже если хуже.",
    },
    {
        "key": "flank", "name": "Flank", "ru": "Фланг",
        "grant": {"talent": "Tactician", "rank": 3},
        "trigger": "Персонаж, у которого нет укрытия от твоей позиции, успешно атакован союзным персонажем.",
        "effect": "Ты можешь нацелить его своим Overwatch, нанося половину урона при попадании.",
    },
]

# --- Протоколы талантов: сверены с корбуком (v107) ---
# В отличие от реакций талантов, протоколы талантов в lancer-data не лежат
# отдельным списком — они описаны внутри текста фичи таланта. Источник:
# корбук, раздел талантов. Shepherd — Drone Commander I, Steady Aim — Crack Shot I.
TALENT_PROTOCOLS = [
    {
        "key": "shepherd", "name": "Shepherd", "ru": "Пастух",
        "grant": {"talent": "Drone Commander", "rank": 1},
        "tx_en": "You may move one drone that you control and that is within SENSORS up to 4 spaces.",
        "tx_ru": "Вы можете переместить одного дрона, которым вы управляете и который находится в пределах ваших сенсоров, на расстояние до 4 клеток.",
    },
    {
        "key": "steadyaim", "name": "Steady Aim", "ru": "Прицелиться",
        "grant": {"talent": "Crack Shot", "rank": 1},
        "tx_en": "As a protocol, you may steady your aim. If you do, you become Immobilized until the start of your next turn but gain +1 Accuracy on all attacks you make with Rifles.",
        "tx_ru": "Протоколом вы можете прицелиться. Если вы это сделаете, вы становитесь обездвиженным до начала вашего следующего хода, но получаете +1 к точности на все атаки, совершаемые винтовками.",
    },
]

# --- Дефолтные реакции: сверены с корбуком ---
DEFAULT_REACTIONS = [
    {
        "key": "brace", "name": "Brace", "ru": "Стойка", "def": True,
        "trigger": "По тебе попали, и урон уже брошен.",
        "effect": "Сопротивление всему урону, теплу и Burn от этой атаки. До конца твоего следующего хода все остальные атаки по тебе — с +1 Difficulty. Цена: нельзя брать реакции до конца следующего хода, а в этот ход — только одно быстрое действие (без оверчарджа, движения, полных и свободных действий).",
    },
    {
        "key": "overwatch", "name": "Overwatch", "ru": "Дозор", "def": True,
        "trigger": "Враждебный персонаж начинает любое движение (включая Boost и другие действия) в пределах Threat одного из твоих оружий.",
        "effect": "Немедленно Skirmish этим оружием по нему как реакцией, до того как он двинется.",
    },
]

# --- Системные реакции и протоколы: из lancer-data + ru_systems ---
def load_ru_systems():
    ru = {}
    for fn in ('ru_systems_a.json', 'ru_systems_b.json', 'ru_systems_c.json'):
        d = json.load(open(fn, encoding='utf-8'))
        for k, v in d.get('systems', {}).items():
            ru[k] = v
    return ru

def first_part(x):
    """Первая часть описания (до ' | ') — обычно текст действия."""
    if not x:
        return ''
    return x.split(' | ')[0].strip()

def main():
    ru = load_ru_systems()
    systems = json.load(open('/home/hatch/workspace/lancer-data-systems.json', encoding='utf-8'))
    sys_reactions = []
    sys_protocols = []
    dep_reactions = []
    dep_quick = []
    for s in systems:
        name = s.get('name')
        for a in (s.get('actions') or []):
            if not isinstance(a, dict):
                continue
            act = a.get('activation')
            aname = (a.get('name') or '').strip()
            if act == 'Reaction':
                v = ru.get(name, {})
                text = first_part(v.get('x', '') or '')
                sys_reactions.append({
                    'key': aname.lower().replace(' ', '').replace('-', ''),
                    'name': aname or name,
                    'ru': '',
                    'grant': {'system': name},
                    'text': text,
                })
            elif act == 'Protocol':
                v = ru.get(name, {})
                text = first_part(v.get('x', '') or '')
                sys_protocols.append({
                    'key': (aname or name).lower().replace(' ', '').replace('-', ''),
                    'name': aname or name,
                    'ru': '',
                    'grant': {'system': name},
                    'text': text,
                })
        # Действия развёртываемых объектов (v169): они лежат НЕ в actions[] системы,
        # а в deployables[].actions[] — генератор раньше их не видел (поэтому «Атака турели» пропала).
        for dep in (s.get('deployables') or []):
            for a in (dep.get('actions') or []):
                if not isinstance(a, dict):
                    continue
                act = a.get('activation')
                aname = (a.get('name') or '').strip()
                if not aname:
                    continue
                rec = {
                    'key': aname.lower().replace(' ', '').replace('-', ''),
                    'name': aname,
                    'ru': '',
                    'grant': {'system': name},
                    'deployable': dep.get('name'),
                    'text': (a.get('detail') or ''),
                }
                if act == 'Reaction':
                    dep_reactions.append(rec)
                elif act == 'Quick':
                    dep_quick.append(rec)
    print('SYSTEM REACTIONS:', len(sys_reactions))
    for r in sys_reactions:
        print(f"  {r['grant']['system']} -> {r['name']}")
        print(f"    {r['text'][:180]}")
    print()
    print('SYSTEM PROTOCOLS:', len(sys_protocols))
    for p in sys_protocols:
        print(f"  {p['grant']['system']} -> {p['name']}")
        print(f"    {p['text'][:180]}")
    print()
    print('DEPLOYABLE REACTIONS:', len(dep_reactions))
    for r in dep_reactions:
        print(f"  {r['grant']['system']} ({r['deployable']}) -> {r['name']}")
        print(f"    {r['text'][:180]}")
    print()
    print('DEPLOYABLE QUICK ACTIONS:', len(dep_quick))
    for q in dep_quick:
        print(f"  {q['grant']['system']} ({q['deployable']}) -> {q['name']}")
        print(f"    {q['text'][:180]}")

if __name__ == '__main__':
    main()
