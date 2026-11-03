extends Node2D
## Renders the map plan and handles mouse painting.
## Speed-first input: drag to paint, right-drag to erase, wheel to zoom,
## middle-drag to pan. Clicks over UI panels never paint.

signal stroke_started
signal stroke_ended
signal text_requested(cell: Vector2i, kind: String)

const GRID_COLOR: Color = Color(0.82, 0.82, 0.82)
const BG_COLOR: Color = Color(0.96, 0.94, 0.87)
const HOVER_COLOR: Color = Color(0.85, 0.65, 0.15)
const WALL_COLOR: Color = Color(0.22, 0.22, 0.26)
const WALL_EDGE: Color = Color(0.1, 0.1, 0.12)
const PIT_COLOR: Color = Color(0.05, 0.05, 0.07)
const DOOR_COLOR: Color = Color(0.55, 0.38, 0.22)
const DOOR_EDGE: Color = Color(0.3, 0.2, 0.1)
const WINDOW_COLOR: Color = Color(0.62, 0.76, 0.92)
const WINDOW_EDGE: Color = Color(0.35, 0.5, 0.65)
const CUSTOM_COLOR: Color = Color(0.55, 0.3, 0.7)
const NOTE_BG: Color = Color(1.0, 0.95, 0.8, 0.88)
const NOTE_FG: Color = Color(0.3, 0.15, 0.05)
const BOUNDS_COLOR: Color = Color(0.85, 0.65, 0.15)
const BOUNDS_PREVIEW_COLOR: Color = Color(0.2, 0.6, 0.9)

var model: GridMapData = null
var camera: Camera2D = null
var tool: String = "wall"
# Export suppresses overlays (bounds rect, hover) so the plan stays clean.
var show_overlays: bool = true
# Copy tool buffer: a deep-copied cell stack (Alt+click grabs, click/drag stamps).
var copy_buffer: Array = []

var hover_key: Vector2i = Vector2i.ZERO
var has_hover: bool = false

var _painting: bool = false
var _erasing: bool = false
var _panning: bool = false
var _last_screen: Vector2 = Vector2.ZERO
var _stroke_cells: Dictionary = {}
var _bounds_drag_start: Variant = null
var _font: Font = null

func _ready() -> void:
	_font = ThemeDB.get_fallback_font()

func refresh() -> void:
	queue_redraw()

func _draw() -> void:
	if model == null:
		return
	var rect: Rect2 = _visible_world_rect()
	draw_rect(rect, BG_COLOR)
	_draw_grid(rect)
	_draw_cells(rect)
	_draw_notes(rect)
	if show_overlays:
		if model.has_export_bounds:
			_draw_dashed_rect(model.export_bounds, BOUNDS_COLOR)
			if _font != null:
				_draw_centered_text("Экспорт", model.export_bounds.position + Vector2(model.export_bounds.size.x / 2.0, 10.0), model.export_bounds.size.x, 13, BOUNDS_COLOR)
		if _bounds_drag_start != null:
			var preview: Rect2 = GridMapData.rect_from_points(_bounds_drag_start, _drag_world_pos())
			_draw_dashed_rect(preview, BOUNDS_PREVIEW_COLOR)
		if has_hover:
			_draw_cell_outline(hover_key, HOVER_COLOR, 2.0)

func _visible_world_rect() -> Rect2:
	var vp: Vector2 = get_viewport_rect().size
	if camera != null:
		var z: Vector2 = camera.zoom
		var c: Vector2 = camera.position
		return Rect2(c - vp * 0.5 / z, vp / z)
	return Rect2(-vp * 0.5, vp)

func _draw_grid(rect: Rect2) -> void:
	if model.grid_type == GridMapData.GridType.HEX:
		var r: Dictionary = model.hex_range(rect)
		for q in range(r["qmin"], r["qmax"] + 1):
			for rr in range(r["rmin"], r["rmax"] + 1):
				var corners: PackedVector2Array = model.cell_corners(Vector2i(q, rr))
				corners.append(corners[0])
				draw_polyline(corners, GRID_COLOR, 1.0)
	else:
		var cs: float = GridMapData.CELL_SIZE
		var x: float = floor(rect.position.x / cs) * cs
		while x <= rect.end.x:
			draw_line(Vector2(x, rect.position.y), Vector2(x, rect.end.y), GRID_COLOR, 1.0)
			x += cs
		var y: float = floor(rect.position.y / cs) * cs
		while y <= rect.end.y:
			draw_line(Vector2(rect.position.x, y), Vector2(rect.end.x, y), GRID_COLOR, 1.0)
			y += cs

func _draw_cells(rect: Rect2) -> void:
	var grow: Rect2 = rect.grow(100.0)
	for key in model.cells.keys():
		var center: Vector2 = model.cell_center(key)
		if not grow.has_point(center):
			continue
		for obj in model.cells[key]:
			_draw_object(key, center, str(obj["type"]), str(obj.get("text", "")))

func _draw_object(key: Vector2i, center: Vector2, type: String, text: String) -> void:
	var corners: PackedVector2Array = model.cell_corners(key)
	match type:
		"wall":
			if model.grid_type == GridMapData.GridType.HEX:
				draw_colored_polygon(corners, WALL_COLOR)
			else:
				draw_rect(Rect2(corners[0], Vector2(GridMapData.CELL_SIZE, GridMapData.CELL_SIZE)), WALL_COLOR)
			_draw_cell_outline(key, WALL_EDGE, 1.0)
		"pit":
			var pts: PackedVector2Array = PackedVector2Array()
			for pt in corners:
				pts.append(center + (pt - center) * 0.62)
			if model.grid_type == GridMapData.GridType.HEX:
				draw_colored_polygon(pts, PIT_COLOR)
			else:
				draw_rect(Rect2(pts[0], pts[2] - pts[0]), PIT_COLOR)
		"door":
			var w: float = _cell_width() * 0.8
			var h: float = _cell_width() * 0.3
			var r: Rect2 = Rect2(center - Vector2(w / 2.0, h / 2.0), Vector2(w, h))
			draw_rect(r, DOOR_COLOR)
			draw_rect(r, DOOR_EDGE, false, 1.0)
		"window":
			var w: float = _cell_width() * 0.7
			var h: float = _cell_width() * 0.16
			var r: Rect2 = Rect2(center - Vector2(w / 2.0, h / 2.0), Vector2(w, h))
			draw_rect(r, WINDOW_COLOR)
			draw_rect(r, WINDOW_EDGE, false, 1.0)
		"custom":
			_draw_dashed_outline(key, CUSTOM_COLOR)
			if _font != null:
				var w: float = _cell_width()
				_draw_centered_text("?", center - Vector2(0.0, 10.0), w, 18, CUSTOM_COLOR)
				if text != "":
					_draw_centered_text(text, center + Vector2(0.0, 4.0), w, 13, CUSTOM_COLOR)

func _draw_notes(rect: Rect2) -> void:
	if _font == null:
		return
	var grow: Rect2 = rect.grow(100.0)
	for key in model.notes.keys():
		var center: Vector2 = model.cell_center(key)
		if not grow.has_point(center):
			continue
		var text: String = model.notes[key]
		var size: Vector2 = _font.get_string_size(text, HORIZONTAL_ALIGNMENT_LEFT, -1, 15)
		var bg: Rect2 = Rect2(center - size / 2.0 - Vector2(4.0, 2.0), size + Vector2(8.0, 4.0))
		draw_rect(bg, NOTE_BG)
		draw_rect(bg, NOTE_FG, false, 1.0)
		draw_string(_font, Vector2(center.x - size.x / 2.0, center.y - size.y / 2.0), text, HORIZONTAL_ALIGNMENT_LEFT, -1, 15, NOTE_FG)

func _draw_cell_outline(key: Vector2i, color: Color, width: float) -> void:
	var corners: PackedVector2Array = model.cell_corners(key)
	corners.append(corners[0])
	draw_polyline(corners, color, width)

func _draw_dashed_outline(key: Vector2i, color: Color) -> void:
	var corners: PackedVector2Array = model.cell_corners(key)
	var n: int = corners.size()
	for i in n:
		_draw_dashed_line(corners[i], corners[(i + 1) % n], color)

func _draw_dashed_rect(r: Rect2, color: Color) -> void:
	_draw_dashed_line(Vector2(r.position.x, r.position.y), Vector2(r.end.x, r.position.y), color)
	_draw_dashed_line(Vector2(r.end.x, r.position.y), Vector2(r.end.x, r.end.y), color)
	_draw_dashed_line(Vector2(r.end.x, r.end.y), Vector2(r.position.x, r.end.y), color)
	_draw_dashed_line(Vector2(r.position.x, r.end.y), Vector2(r.position.x, r.position.y), color)

func _drag_world_pos() -> Vector2:
	return get_global_mouse_position()

func _draw_dashed_line(a: Vector2, b: Vector2, color: Color) -> void:
	var dist: float = a.distance_to(b)
	if dist <= 0.0:
		return
	var dir: Vector2 = (b - a) / dist
	var d: float = 0.0
	while d < dist:
		var seg: float = min(6.0, dist - d)
		draw_line(a + dir * d, a + dir * (d + seg), color, 1.5)
		d += seg + 4.0

func _draw_centered_text(text: String, center: Vector2, width: float, font_size: int, color: Color) -> void:
	draw_string(_font, Vector2(center.x - width / 2.0, center.y - font_size * 0.5), text, HORIZONTAL_ALIGNMENT_CENTER, width, font_size, color)

func _cell_width() -> float:
	if model != null and model.grid_type == GridMapData.GridType.HEX:
		return GridMapData.HEX_RADIUS * 2.0
	return GridMapData.CELL_SIZE

func _unhandled_input(event: InputEvent) -> void:
	if model == null:
		return
	if event is InputEventMouseButton:
		var mb: InputEventMouseButton = event
		if get_viewport().gui_get_hovered_control() != null:
			return
		var key: Vector2i = model.cell_key_from_world(get_global_mouse_position())
		if mb.button_index == MOUSE_BUTTON_LEFT:
			if mb.pressed:
				if tool == "bounds":
					_bounds_drag_start = get_global_mouse_position()
					stroke_started.emit()
					return
				if tool == "copy":
					if mb.alt_pressed:
						copy_buffer = model.stack_copy(key)
						queue_redraw()
						return
					if copy_buffer.is_empty():
						return
				if tool == "text":
					text_requested.emit(key, "note")
					return
				stroke_started.emit()
				_painting = true
				_stroke_cells.clear()
				_paint_cell(key)
			else:
				if _bounds_drag_start != null:
					var r: Rect2 = GridMapData.rect_from_points(_bounds_drag_start, get_global_mouse_position())
					_bounds_drag_start = null
					if r.size.x >= 10.0 and r.size.y >= 10.0:
						model.set_export_bounds(r)
					stroke_ended.emit()
					queue_redraw()
					return
				if _painting:
					_painting = false
					# Single-click with the custom tool opens the meaning editor.
					if tool == "custom" and _stroke_cells.size() == 1:
						text_requested.emit(key, "custom")
					stroke_ended.emit()
		elif mb.button_index == MOUSE_BUTTON_RIGHT:
			if mb.pressed:
				stroke_started.emit()
				_erasing = true
				_erase_cell(key)
			else:
				if _erasing:
					_erasing = false
					stroke_ended.emit()
		elif mb.button_index == MOUSE_BUTTON_MIDDLE:
			if mb.pressed:
				_panning = true
				_last_screen = mb.position
			else:
				_panning = false
		elif mb.button_index == MOUSE_BUTTON_WHEEL_UP and mb.pressed:
			_zoom_at_cursor(1.1)
		elif mb.button_index == MOUSE_BUTTON_WHEEL_DOWN and mb.pressed:
			_zoom_at_cursor(0.9)
	elif event is InputEventMouseMotion:
		var mm: InputEventMouseMotion = event
		if _panning and camera != null:
			camera.position -= (mm.position - _last_screen) / camera.zoom
			_last_screen = mm.position
			return
		if _bounds_drag_start != null:
			queue_redraw()
		if get_viewport().gui_get_hovered_control() != null:
			return
		var key: Vector2i = model.cell_key_from_world(get_global_mouse_position())
		if key != hover_key or not has_hover:
			hover_key = key
			has_hover = true
			queue_redraw()
		if _painting:
			_paint_cell(key)
		elif _erasing:
			_erase_cell(key)

func _paint_cell(key: Vector2i) -> void:
	_stroke_cells[key] = true
	var changed: bool = false
	match tool:
		"wall", "door", "window", "pit":
			changed = model.add_object(key, tool)
		"custom":
			changed = model.add_object(key, "custom", "")
		"copy":
			changed = model.stamp_stack(key, copy_buffer)
	if changed:
		queue_redraw()

func _erase_cell(key: Vector2i) -> void:
	var changed: bool = false
	if Input.is_key_pressed(KEY_SHIFT):
		changed = model.clear_cell(key)
	else:
		changed = model.remove_top(key)
	if changed:
		queue_redraw()

func _zoom_at_cursor(factor: float) -> void:
	if camera == null:
		return
	var before: Vector2 = get_global_mouse_position()
	camera.zoom = (camera.zoom * factor).clamp(Vector2(0.35, 0.35), Vector2(3.0, 3.0))
	var after: Vector2 = get_global_mouse_position()
	camera.position += before - after
