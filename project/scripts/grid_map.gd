class_name GridMapData
extends RefCounted
## Data model for the map plan: two grid types, per-cell object stacks,
## per-cell text notes, JSON save/load. No rendering here.

enum GridType { SQUARE, HEX }

const CELL_SIZE: float = 48.0
const HEX_RADIUS: float = 30.0
const SQRT3: float = 1.7320508075688772

const TYPE_NAMES: Dictionary = {
	"wall": "Стена",
	"door": "Дверь",
	"window": "Окно",
	"pit": "Яма",
	"custom": "Свой тайл",
}

# Custom tile colors, as #rrggbb strings. Index 0 is the default: it matches
# the purple the view used before colors existed, so old maps render
# exactly as before. All eight are dark enough to read as text on the
# light parchment background.
const DEFAULT_CUSTOM_COLOR: String = "#8c4db3"
const CUSTOM_COLORS: Array[String] = [
	DEFAULT_CUSTOM_COLOR, "#c0392b", "#d35400", "#b7950b",
	"#1e8449", "#148f77", "#2471a3", "#795548",
]

var grid_type: int = GridType.SQUARE
# Vector2i cell key -> Array of {"type": String, "text": String}
var cells: Dictionary = {}
# Vector2i cell key -> String note drawn on top of the cell
var notes: Dictionary = {}
# User-defined export rect (world coords). When unset, export frames the
# painted content with a margin — so there is room for a legend if needed.
var export_bounds: Rect2 = Rect2()
var has_export_bounds: bool = false
# Display merge: adjacent custom tiles with identical meaning render as one
# polygon with one centered label. Persisted with the map so the export
# always matches what the user sees.
var merge_adjacent: bool = true

func effective_bounds() -> Rect2:
	if has_export_bounds:
		return export_bounds
	return bounds().grow(48.0)

func set_export_bounds(r: Rect2) -> void:
	export_bounds = r
	has_export_bounds = true

func clear_export_bounds() -> void:
	has_export_bounds = false

# Normalized rect from two dragged corner points.
static func rect_from_points(a: Vector2, b: Vector2) -> Rect2:
	var mn: Vector2 = Vector2(min(a.x, b.x), min(a.y, b.y))
	var mx: Vector2 = Vector2(max(a.x, b.x), max(a.y, b.y))
	return Rect2(mn, mx - mn)

func cell_key_from_world(p: Vector2) -> Vector2i:
	if grid_type == GridType.HEX:
		return _hex_key_from_world(p)
	return Vector2i(int(floor(p.x / CELL_SIZE)), int(floor(p.y / CELL_SIZE)))

func _hex_key_from_world(p: Vector2) -> Vector2i:
	# Flat-top axial layout, pointy-top hexes (vertex up):
	# center = (R*sqrt(3)*(q + r/2), R*1.5*r), corners at 30 + 60*k degrees.
	var qf: float = (SQRT3 / 3.0 * p.x - 1.0 / 3.0 * p.y) / HEX_RADIUS
	var rf: float = (2.0 / 3.0 * p.y) / HEX_RADIUS
	return _hex_round(qf, rf)

func _hex_round(qf: float, rf: float) -> Vector2i:
	var x: float = qf
	var z: float = rf
	var y: float = -x - z
	var rx: int = int(round(x))
	var ry: int = int(round(y))
	var rz: int = int(round(z))
	var dx: float = abs(float(rx) - x)
	var dy: float = abs(float(ry) - y)
	var dz: float = abs(float(rz) - z)
	if dx > dy and dx > dz:
		rx = -ry - rz
	elif dy > dz:
		ry = -rx - rz
	else:
		rz = -rx - ry
	return Vector2i(rx, rz)

func cell_center(key: Vector2i) -> Vector2:
	if grid_type == GridType.HEX:
		return Vector2(
			HEX_RADIUS * SQRT3 * (float(key.x) + float(key.y) / 2.0),
			HEX_RADIUS * 1.5 * float(key.y)
		)
	return Vector2((float(key.x) + 0.5) * CELL_SIZE, (float(key.y) + 0.5) * CELL_SIZE)

func cell_corners(key: Vector2i) -> PackedVector2Array:
	if grid_type == GridType.HEX:
		var c: Vector2 = cell_center(key)
		var pts: PackedVector2Array = PackedVector2Array()
		for i in range(6):
			var a: float = deg_to_rad(60.0 * float(i) + 30.0)
			pts.append(c + Vector2(cos(a), sin(a)) * HEX_RADIUS)
		return pts
	var x0: float = float(key.x) * CELL_SIZE
	var y0: float = float(key.y) * CELL_SIZE
	return PackedVector2Array([
		Vector2(x0, y0), Vector2(x0 + CELL_SIZE, y0),
		Vector2(x0 + CELL_SIZE, y0 + CELL_SIZE), Vector2(x0, y0 + CELL_SIZE),
	])

# Neighbors sharing an edge (square: 4 sides, hex: 6 axial directions).
func cell_neighbors(key: Vector2i) -> Array[Vector2i]:
	if grid_type == GridType.HEX:
		return [key + Vector2i(1, 0), key + Vector2i(0, 1), key + Vector2i(-1, 1), key + Vector2i(-1, 0), key + Vector2i(0, -1), key + Vector2i(1, -1)]
	return [key + Vector2i(1, 0), key + Vector2i(0, 1), key + Vector2i(-1, 0), key + Vector2i(0, -1)]

# The neighbor across one cell edge: edge i runs corner i -> corner i+1
# (see cell_corners). Square corners are TL, TR, BR, BL; hex corners sit
# at 30 + 60*k degrees, so each hex edge's outward normal points at the
# matching axial neighbor.
func cell_edge_neighbor(key: Vector2i, edge: int) -> Vector2i:
	if grid_type == GridType.HEX:
		var dirs: Array[Vector2i] = [Vector2i(0, 1), Vector2i(-1, 1), Vector2i(-1, 0), Vector2i(0, -1), Vector2i(1, -1), Vector2i(1, 0)]
		return key + dirs[edge % 6]
	var dirs: Array[Vector2i] = [Vector2i(0, -1), Vector2i(1, 0), Vector2i(0, 1), Vector2i(-1, 0)]
	return key + dirs[edge % 4]

# Conservative q/r range covering a world rect (used for hex grid drawing).
func hex_range(rect: Rect2) -> Dictionary:
	var rmin: int = int(floor(rect.position.y / (HEX_RADIUS * 1.5))) - 2
	var rmax: int = int(floor(rect.end.y / (HEX_RADIUS * 1.5))) + 2
	var qmin: int = int(floor(rect.position.x / (HEX_RADIUS * SQRT3))) - 3
	var qmax: int = int(floor(rect.end.x / (HEX_RADIUS * SQRT3))) + 3
	return {"qmin": qmin, "qmax": qmax, "rmin": rmin, "rmax": rmax}

func stack_of(key: Vector2i) -> Array:
	if cells.has(key):
		return cells[key]
	return []

# Adds an object; same type twice in one cell is idempotent (no duplicates).
# For a custom tile, re-adding with new non-empty text updates its meaning
# and with a new color updates its color. New custom tiles get the
# default color unless one is passed (the creation dialog passes it).
func add_object(key: Vector2i, type: String, text: String = "", color: String = "") -> bool:
	var stack: Array = stack_of(key)
	for obj in stack:
		if obj["type"] == type:
			if type == "custom":
				var changed: bool = false
				if text != "" and obj["text"] != text:
					obj["text"] = text
					changed = true
				if color != "" and str(obj.get("color", "")) != color:
					obj["color"] = color
					changed = true
				return changed
			return false
	if type == "custom":
		stack.append({"type": type, "text": text, "color": color if color != "" else DEFAULT_CUSTOM_COLOR})
	else:
		stack.append({"type": type, "text": text})
	cells[key] = stack
	return true

func remove_top(key: Vector2i) -> bool:
	if not cells.has(key):
		return false
	var stack: Array = cells[key]
	stack.pop_back()
	if stack.is_empty():
		cells.erase(key)
	return true

func clear_cell(key: Vector2i) -> bool:
	var had: bool = cells.has(key) or notes.has(key)
	cells.erase(key)
	notes.erase(key)
	return had

func clear_all() -> void:
	cells.clear()
	notes.clear()

func set_note(key: Vector2i, text: String) -> void:
	if text.strip_edges() == "":
		notes.erase(key)
	else:
		notes[key] = text

func stack_names(key: Vector2i) -> String:
	return describe_stack(stack_of(key))

func describe_stack(stack: Array) -> String:
	var names: Array[String] = []
	for obj in stack:
		names.append(TYPE_NAMES.get(obj["type"], obj["type"]))
	return ", ".join(names)

# Deep copy of a cell's stack (for the copy tool's buffer).
func stack_copy(key: Vector2i) -> Array:
	var out: Array = []
	for obj in stack_of(key):
		out.append(obj.duplicate())
	return out

# Merges a copied stack into a cell: missing types are added, existing ones
# stay (a custom tile's meaning and color update). Returns true if anything changed.
func stamp_stack(key: Vector2i, stack: Array) -> bool:
	var changed: bool = false
	for obj in stack:
		if add_object(key, str(obj["type"]), str(obj.get("text", "")), str(obj.get("color", ""))):
			changed = true
	return changed

func _custom_text(key: Vector2i) -> String:
	for obj in stack_of(key):
		if obj["type"] == "custom":
			return str(obj.get("text", ""))
	return ""

func _has_custom(key: Vector2i) -> bool:
	for obj in stack_of(key):
		if obj["type"] == "custom":
			return true
	return false

# The color of a cell's custom tile (default when unset, e.g. old saves).
func custom_color(key: Vector2i) -> String:
	for obj in stack_of(key):
		if obj["type"] == "custom":
			var c: String = str(obj.get("color", ""))
			return c if c != "" else DEFAULT_CUSTOM_COLOR
	return DEFAULT_CUSTOM_COLOR

# Connected components of custom tiles, grouped by identical meaning text
# AND color: same text in different colors renders as separate polygons.
# Each entry: {"text": String, "color": String, "cells": Array[Vector2i]}.
# Pure data for the view's display merge; the model itself stays per-cell,
# so painting, erasing, undo and copy keep working cell by cell.
func custom_components() -> Array:
	var seen: Dictionary = {}
	var out: Array = []
	for key in cells.keys():
		if seen.has(key) or not _has_custom(key):
			continue
		var text: String = _custom_text(key)
		var color: String = custom_color(key)
		var comp: Array[Vector2i] = []
		var stack: Array[Vector2i] = [key]
		seen[key] = true
		while not stack.is_empty():
			var cur: Vector2i = stack.pop_back()
			comp.append(cur)
			for nb in cell_neighbors(cur):
				if seen.has(nb) or not _has_custom(nb):
					continue
				if _custom_text(nb) != text or custom_color(nb) != color:
					continue
				seen[nb] = true
				stack.append(nb)
		out.append({"text": text, "color": color, "cells": comp})
	return out

func bounds() -> Rect2:
	if cells.is_empty():
		return Rect2(-480.0, -360.0, 960.0, 720.0)
	var min_p: Vector2 = Vector2(INF, INF)
	var max_p: Vector2 = Vector2(-INF, -INF)
	for key in cells.keys():
		for pt in cell_corners(key):
			min_p.x = min(min_p.x, pt.x)
			min_p.y = min(min_p.y, pt.y)
			max_p.x = max(max_p.x, pt.x)
			max_p.y = max(max_p.y, pt.y)
	return Rect2(min_p, max_p - min_p)

static func key_to_string(key: Vector2i) -> String:
	return str(key.x) + "," + str(key.y)

static func key_from_string(s: String) -> Vector2i:
	var parts: PackedStringArray = s.split(",")
	if parts.size() != 2:
		return Vector2i.ZERO
	return Vector2i(int(parts[0]), int(parts[1]))

func to_json_string() -> String:
	var cell_data: Dictionary = {}
	for key in cells.keys():
		cell_data[key_to_string(key)] = cells[key]
	var note_data: Dictionary = {}
	for key in notes.keys():
		note_data[key_to_string(key)] = notes[key]
	var bounds_data: Variant = null
	if has_export_bounds:
		bounds_data = [export_bounds.position.x, export_bounds.position.y, export_bounds.size.x, export_bounds.size.y]
	var data: Dictionary = {
		"grid": "hex" if grid_type == GridType.HEX else "square",
		"cells": cell_data,
		"notes": note_data,
		"bounds": bounds_data,
		"merge": merge_adjacent,
	}
	return JSON.stringify(data)

# Parses into fresh containers first: a bad string leaves the model untouched.
func from_json_string(s: String) -> bool:
	var parsed: Variant = JSON.parse_string(s)
	if not (parsed is Dictionary):
		return false
	var new_cells: Dictionary = {}
	var raw_cells: Variant = parsed.get("cells", {})
	if raw_cells is Dictionary:
		for k in raw_cells.keys():
			var stack: Array = []
			var raw_stack: Variant = raw_cells[k]
			if raw_stack is Array:
				for obj in raw_stack:
					if obj is Dictionary and obj.has("type"):
						if str(obj["type"]) == "custom":
							var c: String = str(obj.get("color", ""))
							stack.append({"type": "custom", "text": str(obj.get("text", "")), "color": c if c != "" else DEFAULT_CUSTOM_COLOR})
						else:
							stack.append({"type": str(obj["type"]), "text": str(obj.get("text", ""))})
			new_cells[key_from_string(str(k))] = stack
	var new_notes: Dictionary = {}
	var raw_notes: Variant = parsed.get("notes", {})
	if raw_notes is Dictionary:
		for k in raw_notes.keys():
			new_notes[key_from_string(str(k))] = str(raw_notes[k])
	var new_bounds: Rect2 = Rect2()
	var new_has_bounds: bool = false
	var raw_bounds: Variant = parsed.get("bounds", null)
	if raw_bounds is Array and raw_bounds.size() == 4:
		new_bounds = Rect2(float(raw_bounds[0]), float(raw_bounds[1]), float(raw_bounds[2]), float(raw_bounds[3]))
		new_has_bounds = true
	grid_type = GridType.HEX if str(parsed.get("grid", "square")) == "hex" else GridType.SQUARE
	merge_adjacent = bool(parsed.get("merge", true))
	cells = new_cells
	notes = new_notes
	export_bounds = new_bounds
	has_export_bounds = new_has_bounds
	return true
