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
			# Stacking: several objects in one cell, idempotent repaint, removal.
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
		10:
			# Display merge: custom-tile components + edge neighbors + flag.
			var m = load("res://scripts/grid_map.gd").new()
			_check(m.merge_adjacent == true, "merge default on")
			m.grid_type = 0
			m.add_object(Vector2i(0, 0), "custom", "ЯМА")
			m.add_object(Vector2i(1, 0), "custom", "ЯМА")
			m.add_object(Vector2i(0, 1), "custom", "ЯМА")
			m.add_object(Vector2i(1, 1), "custom", "ЯМА")
			m.add_object(Vector2i(3, 0), "custom", "ЯМА")
			m.add_object(Vector2i(0, 2), "custom", "Алтарь")
			m.add_object(Vector2i(1, 1), "wall")
			var comps = m.custom_components()
			_check(comps.size() == 3, "three components")
			var big_found: bool = false
			for c in comps:
				if str(c["text"]) == "ЯМА" and (c["cells"] as Array).size() == 4:
					big_found = true
			_check(big_found, "2x2 block is one component")
			_check(m.cell_edge_neighbor(Vector2i(0, 0), 0) == Vector2i(0, -1), "square edge 0 top")
			_check(m.cell_edge_neighbor(Vector2i(0, 0), 1) == Vector2i(1, 0), "square edge 1 right")
			_check(m.cell_edge_neighbor(Vector2i(0, 0), 2) == Vector2i(0, 1), "square edge 2 bottom")
			_check(m.cell_edge_neighbor(Vector2i(0, 0), 3) == Vector2i(-1, 0), "square edge 3 left")
			var d = load("res://scripts/grid_map.gd").new()
			d.add_object(Vector2i(0, 0), "custom", "ЯМА")
			d.add_object(Vector2i(1, 1), "custom", "ЯМА")
			_check(d.custom_components().size() == 2, "diagonal does not merge")
			var h = load("res://scripts/grid_map.gd").new()
			h.grid_type = 1
			h.add_object(Vector2i(0, 0), "custom", "ЯМА")
			h.add_object(Vector2i(0, 1), "custom", "ЯМА")
			h.add_object(Vector2i(1, 0), "custom", "ЯМА")
			_check(h.custom_components().size() == 1, "hex neighbors merge")
			_check(h.cell_edge_neighbor(Vector2i(0, 0), 0) == Vector2i(0, 1), "hex edge 0")
			_check(h.cell_edge_neighbor(Vector2i(0, 0), 5) == Vector2i(1, 0), "hex edge 5")
			m.merge_adjacent = false
			var s: String = m.to_json_string()
			var m2 = load("res://scripts/grid_map.gd").new()
			_check(m2.from_json_string(s) == true, "merge json parse")
			_check(m2.merge_adjacent == false, "merge flag roundtrip")
			var m3 = load("res://scripts/grid_map.gd").new()
			_check(m3.from_json_string("{\"grid\":\"square\",\"cells\":{},\"notes\":{}}") == true, "json without merge parses")
			_check(m3.merge_adjacent == true, "json without merge defaults on")
		11:
			# Custom tile colors: default, set, JSON roundtrip, stamp, merge split.
			var S = load("res://scripts/grid_map.gd")
			var m = S.new()
			m.grid_type = 0
			var k1: Vector2i = Vector2i(0, 0)
			_check(m.add_object(k1, "custom", "") == true, "color default add")
			_check(str(m.stack_of(k1)[0].get("color", "")) == S.DEFAULT_CUSTOM_COLOR, "color default value")
			_check(m.add_object(k1, "custom", "ЯМА", "#c0392b") == true, "color set")
			_check(str(m.stack_of(k1)[0].get("color", "")) == "#c0392b", "color stored")
			_check(str(m.stack_of(k1)[0].get("text", "")) == "ЯМА", "color set keeps text")
			_check(m.add_object(k1, "custom", "ЯМА", "#c0392b") == false, "color idempotent")
			var s: String = m.to_json_string()
			var m2 = S.new()
			_check(m2.from_json_string(s) == true, "color json parse")
			_check(str(m2.stack_of(k1)[0].get("color", "")) == "#c0392b", "color json roundtrip")
			var m3 = S.new()
			_check(m3.from_json_string("{\"grid\":\"square\",\"cells\":{\"0,0\":[{\"type\":\"custom\",\"text\":\"ЯМА\"}]},\"notes\":{}}") == true, "json without color parses")
			_check(str(m3.stack_of(Vector2i(0, 0))[0].get("color", "")) == S.DEFAULT_CUSTOM_COLOR, "json without color defaults")
			var dst: Vector2i = Vector2i(5, 5)
			_check(m.stamp_stack(dst, m.stack_copy(k1)) == true, "stamp color changed")
			_check(str(m.stack_of(dst)[0].get("color", "")) == "#c0392b", "stamp color carried")
			var g = S.new()
			g.grid_type = 0
			g.add_object(Vector2i(0, 0), "custom", "ЯМА", "#c0392b")
			g.add_object(Vector2i(1, 0), "custom", "ЯМА", "#c0392b")
			g.add_object(Vector2i(2, 0), "custom", "ЯМА", "#1e8449")
			_check(g.custom_components().size() == 2, "same text different color splits")
			var sizes: Array = []
			var cols: Array = []
			for c in g.custom_components():
				sizes.append((c["cells"] as Array).size())
				cols.append(str(c["color"]))
			sizes.sort()
			_check(sizes == [1, 2], "color split sizes")
			_check(cols.has("#c0392b") and cols.has("#1e8449"), "component colors")
			var h2 = S.new()
			h2.grid_type = 0
			h2.add_object(Vector2i(0, 0), "custom", "ЯМА", "#c0392b")
			h2.add_object(Vector2i(1, 0), "custom", "ЯМА", "#c0392b")
			_check(h2.custom_components().size() == 1, "same text same color merges")
		12:
			# Legend: derived rows, order, label overrides, JSON roundtrip.
			var S = load("res://scripts/grid_map.gd")
			var m = S.new()
			m.grid_type = 0
			_check(m.legend_rows().size() == 0, "legend empty map")
			m.add_object(Vector2i(0, 0), "wall")
			m.add_object(Vector2i(1, 0), "door")
			m.add_object(Vector2i(2, 0), "custom", "ЯМА", "#c0392b")
			m.add_object(Vector2i(3, 0), "custom", "ЯМА", "#1e8449")
			m.add_object(Vector2i(4, 0), "custom", "Алтарь", "#c0392b")
			m.set_note(Vector2i(0, 0), "Заметка")
			var rows = m.legend_rows()
			_check(rows.size() == 4, "legend four rows")
			_check(str(rows[0]["key"]) == "type:wall" and str(rows[0]["label"]) == "Стена", "legend wall row")
			_check(str(rows[1]["key"]) == "type:door" and str(rows[1]["label"]) == "Дверь", "legend door row")
			_check(str(rows[2]["key"]) == "custom:#c0392b" and str(rows[2]["default"]) == "ЯМА", "legend red row default first meaning")
			_check(str(rows[3]["key"]) == "custom:#1e8449" and str(rows[3]["label"]) == "ЯМА", "legend green row")
			m.set_legend_label("custom:#c0392b", "Опасность", "ЯМА")
			_check(str(m.legend_rows()[2]["label"]) == "Опасность", "legend override applied")
			m.set_legend_label("custom:#c0392b", "ЯМА", "ЯМА")
			_check(str(m.legend_rows()[2]["label"]) == "ЯМА" and not m.legend_labels.has("custom:#c0392b"), "legend override erased on default")
			m.set_legend_label("custom:#c0392b", "Опасность", "ЯМА")
			m.clear_cell(Vector2i(2, 0))
			m.clear_cell(Vector2i(4, 0))
			_check(m.legend_rows().size() == 3, "legend row leaves with color")
			m.add_object(Vector2i(2, 0), "custom", "Ловушка", "#c0392b")
			_check(str(m.legend_rows()[2]["label"]) == "Опасность", "legend override survives absence")
			_check(str(m.legend_rows()[2]["default"]) == "Ловушка", "legend default follows new meaning")
			m.add_object(Vector2i(5, 0), "custom", "Тайник", "#123456")
			var rows2 = m.legend_rows()
			_check(str(rows2[rows2.size() - 1]["key"]) == "custom:#123456", "legend unknown color last")
			m.legend_pos = Vector2(100.0, 200.0)
			m.has_legend_pos = true
			var s: String = m.to_json_string()
			var m2 = S.new()
			_check(m2.from_json_string(s) == true, "legend json parse")
			_check(m2.has_legend_pos == true and m2.legend_pos == Vector2(100.0, 200.0), "legend pos roundtrip")
			_check(str(m2.legend_labels.get("custom:#c0392b", "")) == "Опасность", "legend labels roundtrip")
			var m3 = S.new()
			_check(m3.from_json_string("{\"grid\":\"square\",\"cells\":{},\"notes\":{}}") == true, "json without legend parses")
			_check(m3.legend_labels.is_empty() and m3.has_legend_pos == false, "json without legend defaults")
			m.clear_all()
			_check(m.legend_labels.is_empty() and m.has_legend_pos == false and m.legend_rows().size() == 0, "clear all resets legend")
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
