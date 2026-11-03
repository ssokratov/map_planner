extends SceneTree
## Headless logic test for the map builder model.
## Run: Godot --headless --path project --script /home/hatch/workspace/mapbuilder/map_test.gd
## (script path MUST be absolute; a relative path gives "File not found").
## Guards: a null script aborts at once instead of hanging the run.

var _step: int = 0
var _model = null
var _failed: bool = false

func _process(_delta: float) -> bool:
	if _failed:
		return true
	match _step:
		0:
			var script = load("res://scripts/grid_map.gd")
			if script == null:
				print("TEST ABORTED: grid_map.gd not found")
				_failed = true
				return true
			_model = script.new()
		1:
			# Square grid conversions.
			_model.grid_type = 0
			_check(_model.cell_key_from_world(Vector2(100.0, 70.0)) == Vector2i(2, 1), "square key (100,70)")
			_check(_model.cell_key_from_world(Vector2(-10.0, -10.0)) == Vector2i(-1, -1), "square key negative")
			_check(_model.cell_key_from_world(_model.cell_center(Vector2i(2, 1))) == Vector2i(2, 1), "square roundtrip")
			_check(_model.cell_corners(Vector2i(0, 0)).size() == 4, "square corners")
		2:
			# Hex grid conversions (pointy-top axial).
			_model.grid_type = 1
			_check(_model.cell_key_from_world(Vector2(0.0, 0.0)) == Vector2i(0, 0), "hex origin")
			_check(_model.cell_key_from_world(_model.cell_center(Vector2i(2, -1))) == Vector2i(2, -1), "hex roundtrip (2,-1)")
			_check(_model.cell_key_from_world(_model.cell_center(Vector2i(1, 2))) == Vector2i(1, 2), "hex roundtrip (1,2)")
			_check(_model.cell_key_from_world(_model.cell_center(Vector2i(-3, 4))) == Vector2i(-3, 4), "hex roundtrip (-3,4)")
			_check(_model.cell_corners(Vector2i(0, 0)).size() == 6, "hex corners")
		3:
			# Stacking: several objects in one cell, idempotent repaint, eraser.
			_model.grid_type = 0
			var key: Vector2i = Vector2i(3, 3)
			_check(_model.add_object(key, "wall") == true, "add wall")
			_check(_model.add_object(key, "door") == true, "add door")
			_check(_model.stack_of(key).size() == 2, "stack size 2")
			_check(_model.add_object(key, "wall") == false, "wall idempotent")
			_check(_model.stack_of(key).size() == 2, "stack still 2")
			_check(_model.remove_top(key) == true, "remove top")
			_check(_model.stack_of(key).size() == 1, "stack size 1 after remove")
			_check(_model.stack_names(key) == "Стена", "stack names")
			_model.set_note(key, "Здесь ловушка")
			_check(str(_model.notes.get(key, "")) == "Здесь ловушка", "note stored")
			_check(_model.clear_cell(key) == true, "clear cell")
			_check(_model.stack_of(key).size() == 0, "stack empty after clear")
		4:
			# Custom tile meaning update keeps a single tile.
			var key: Vector2i = Vector2i(1, 1)
			_check(_model.add_object(key, "custom", "") == true, "add custom")
			_check(_model.add_object(key, "custom", "Секретная дверь") == true, "custom text update")
			_check(_model.stack_of(key).size() == 1, "custom still single")
			_check(str(_model.stack_of(key)[0]["text"]) == "Секретная дверь", "custom text stored")
		5:
			# JSON roundtrip, grid switch keeps cells, bad JSON rejected.
			var key: Vector2i = Vector2i(5, 5)
			_model.add_object(key, "pit")
			_model.set_note(key, "Глубокая яма")
			var s: String = _model.to_json_string()
			var m2 = load("res://scripts/grid_map.gd").new()
			_check(m2.from_json_string(s) == true, "json parse")
			_check(m2.to_json_string() == s, "json roundtrip identical")
			m2.grid_type = 1
			_check(m2.cells.has(key), "grid switch keeps cells")
			var bad = load("res://scripts/grid_map.gd").new()
			_check(bad.from_json_string("not json") == false, "bad json rejected")
		6:
			# View + main scripts and the scene load (syntax + resource refs).
			_check(load("res://scripts/map_view.gd") != null, "map_view loads")
			_check(load("res://scripts/main.gd") != null, "main loads")
			_check(load("res://main.tscn") != null, "main.tscn loads")
		7:
			# Export bounds: user rect, effective fallback, point normalization.
			var m = load("res://scripts/grid_map.gd").new()
			_check(m.has_export_bounds == false, "no bounds by default")
			_check(m.effective_bounds() == m.bounds().grow(48.0), "effective bounds fallback")
			m.set_export_bounds(Rect2(10.0, 20.0, 100.0, 50.0))
			_check(m.has_export_bounds == true, "bounds set")
			_check(m.effective_bounds() == Rect2(10.0, 20.0, 100.0, 50.0), "effective bounds user rect")
			m.clear_export_bounds()
			_check(m.has_export_bounds == false, "bounds cleared")
			var r = m.rect_from_points(Vector2(100.0, 50.0), Vector2(20.0, 80.0))
			_check(r == Rect2(20.0, 50.0, 80.0, 30.0), "rect from points normalized")
		8:
			# Bounds survive JSON roundtrip; missing bounds stay missing.
			var m = load("res://scripts/grid_map.gd").new()
			m.set_export_bounds(Rect2(5.0, 6.0, 70.0, 80.0))
			var s: String = m.to_json_string()
			var m2 = load("res://scripts/grid_map.gd").new()
			_check(m2.from_json_string(s) == true, "bounds json parse")
			_check(m2.has_export_bounds == true and m2.export_bounds == Rect2(5.0, 6.0, 70.0, 80.0), "bounds json roundtrip")
			var m3 = load("res://scripts/grid_map.gd").new()
			_check(m3.from_json_string("{\"grid\":\"square\",\"cells\":{},\"notes\":{}}") == true, "json without bounds parses")
			_check(m3.has_export_bounds == false, "json without bounds stays unset")
		9:
			# Copy: deep copy, stamp merges idempotently, custom text travels.
			var m = load("res://scripts/grid_map.gd").new()
			var src: Vector2i = Vector2i(2, 2)
			m.add_object(src, "wall")
			m.add_object(src, "door")
			m.add_object(src, "custom", "Секрет")
			var buf = m.stack_copy(src)
			_check(buf.size() == 3, "copy size 3")
			buf[2]["text"] = "Другое"
			_check(str(m.stack_of(src)[2]["text"]) == "Секрет", "copy is deep")
			_check(m.describe_stack(buf) == "Стена, Дверь, Свой тайл", "describe stack")
			_check(m.stack_copy(Vector2i(9, 9)).size() == 0, "copy of empty cell")
			var dst: Vector2i = Vector2i(5, 5)
			_check(m.stamp_stack(dst, buf) == true, "stamp changed")
			_check(m.stack_names(dst) == "Стена, Дверь, Свой тайл", "stamped names")
			_check(str(m.stack_of(dst)[2]["text"]) == "Другое", "stamped custom text")
			_check(m.stamp_stack(dst, buf) == false, "stamp idempotent")
			var mix: Vector2i = Vector2i(6, 6)
			m.add_object(mix, "pit")
			_check(m.stamp_stack(mix, buf) == true, "stamp onto occupied changed")
			_check(m.stack_names(mix) == "Яма, Стена, Дверь, Свой тайл", "stamp merges")
			_check(m.stamp_stack(dst, []) == false, "stamp empty unchanged")
			if not _failed:
				print("ALL CHECKS PASSED")
			quit()
			return true
	if _failed:
		return true
	_step += 1
	return false

func _check(cond: bool, name: String) -> void:
	if cond:
		print("PASS: " + name)
	else:
		print("FAIL: " + name)
		_failed = true
		quit()
