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
    print('SYSTEM REACTIONS:', len(sys_reactions))
    for r in sys_reactions:
        print(f"  {r['grant']['system']} -> {r['name']}")
        print(f"    {r['text'][:180]}")
    print()
    print('SYSTEM PROTOCOLS:', len(sys_protocols))
    for p in sys_protocols:
        print(f"  {p['grant']['system']} -> {p['name']}")
        print(f"    {p['text'][:180]}")

if __name__ == '__main__':
    main()
