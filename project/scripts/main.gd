extends Node
## Wires the toolbox UI, text popups, autosave, undo, PNG export and the
## "В Gemini" handoff (image to clipboard + Gemini tab + editable prompt).
## All UI is built in code so the prototype stays in three scripts.

const SAVE_PATH: String = "user://map.json"
const EXPORT_NAME: String = "map_plan.png"
const GEMINI_PROMPT_PATH: String = "user://gemini_prompt.txt"
const GEMINI_URL: String = "https://gemini.google.com/"
const GEMINI_PROMPT_DEFAULT: String = """Преврати этот схематичный план карты подземелья в красивую карту для D&D, вид строго сверху. Сохрани точную геометрию: все стены, двери, окна и ямы должны остаться ровно на тех же местах — ничего не двигай, не добавляй и не убирай. Тонкие линии сетки — вспомогательные, в итоговой карте сетку не рисуй. Текст и подписи не рисуй. Стиль: рисованная от руки фэнтезийная карта на пергаменте, тёплые цвета, чёткие контуры."""

const TOOLS: Array = [
	{"id": "wall", "label": "Стена (1)"},
	{"id": "door", "label": "Дверь (2)"},
	{"id": "window", "label": "Окно (3)"},
	{"id": "pit", "label": "Яма (4)"},
	{"id": "custom", "label": "Свой тайл (5)"},
	{"id": "text", "label": "Текст (6)"},
	{"id": "eraser", "label": "Ластик (7)"},
	{"id": "bounds", "label": "Границы (8)"},
]

@onready var map_view: Node2D = $MapView
@onready var camera: Camera2D = $Camera2D

var model: GridMapData = null
var current_tool: String = "wall"
var undo_stack: Array[String] = []
# Demo mode (?demo=1 on the web build): a sample map for quick testing.
# It never overwrites the autosave, so opening it cannot eat a real map.
var _demo_mode: bool = false

var _ui_layer: CanvasLayer = null
var _tool_buttons: Dictionary = {}
var _grid_buttons: Dictionary = {}
var _status_label: Label = null
var _save_label: Label = null
var _popup: Panel = null
var _popup_label: Label = null
var _popup_edit: LineEdit = null
var _popup_cell: Vector2i = Vector2i.ZERO
var _popup_kind: String = ""
var _merge_check: CheckBox = null
var _gemini_dialog: Panel = null
var _gemini_edit: TextEdit = null
var _last_status: String = ""

func _ready() -> void:
	model = GridMapData.new()
	_load()
	map_view.model = model
	map_view.camera = camera
	map_view.tool = current_tool
	map_view.stroke_started.connect(_on_stroke_started)
	map_view.stroke_ended.connect(_on_stroke_ended)
	map_view.text_requested.connect(_on_text_requested)
	_build_ui()
	_select_tool("wall")
	_grid_buttons[model.grid_type].button_pressed = true
	_fit_view()
	if OS.has_feature("web"):
		_apply_web_query()

func _build_ui() -> void:
	_ui_layer = CanvasLayer.new()
	_ui_layer.name = "UI"
	add_child(_ui_layer)

	var toolbox: PanelContainer = PanelContainer.new()
	toolbox.anchor_left = 0.0
	toolbox.anchor_top = 0.0
	toolbox.anchor_right = 0.0
	toolbox.anchor_bottom = 1.0
	toolbox.offset_left = 8.0
	toolbox.offset_top = 8.0
	toolbox.offset_right = 216.0
	toolbox.offset_bottom = -8.0
	_ui_layer.add_child(toolbox)

	var box: VBoxContainer = VBoxContainer.new()
	box.add_theme_constant_override("separation", 6)
	toolbox.add_child(box)

	var title: Label = Label.new()
	title.text = "Инструменты"
	box.add_child(title)

	var tool_group: ButtonGroup = ButtonGroup.new()
	for t in TOOLS:
		var b: Button = Button.new()
		b.text = t["label"]
		b.toggle_mode = true
		b.button_group = tool_group
		b.pressed.connect(_on_tool_button_pressed.bind(t["id"]))
		box.add_child(b)
		_tool_buttons[t["id"]] = b

	var copy_hint: Label = Label.new()
	copy_hint.text = "Копия клетки: Ctrl+C взять, Ctrl+V поставить"
	box.add_child(copy_hint)
	_merge_check = CheckBox.new()
	_merge_check.text = "Объединять соседние"
	_merge_check.button_pressed = model.merge_adjacent
	_merge_check.toggled.connect(_on_merge_toggled)
	box.add_child(_merge_check)

	box.add_child(HSeparator.new())
	var grid_label: Label = Label.new()
	grid_label.text = "Сетка (G — переключить)"
	box.add_child(grid_label)
	var grid_group: ButtonGroup = ButtonGroup.new()
	var sq: Button = Button.new()
	sq.text = "Квадратная"
	sq.toggle_mode = true
	sq.button_group = grid_group
	sq.pressed.connect(_on_grid_button_pressed.bind(0))
	box.add_child(sq)
	_grid_buttons[0] = sq
	var hx: Button = Button.new()
	hx.text = "Хексовая"
	hx.toggle_mode = true
	hx.button_group = grid_group
	hx.pressed.connect(_on_grid_button_pressed.bind(1))
	box.add_child(hx)
	_grid_buttons[1] = hx

	box.add_child(HSeparator.new())
	var fit_btn: Button = Button.new()
	fit_btn.text = "Вписать в экран (F)"
	fit_btn.pressed.connect(_fit_view)
	box.add_child(fit_btn)
	var undo_btn: Button = Button.new()
	undo_btn.text = "Отменить (Ctrl+Z)"
	undo_btn.pressed.connect(_undo)
	box.add_child(undo_btn)
	var export_btn: Button = Button.new()
	export_btn.text = "Экспорт PNG"
	export_btn.pressed.connect(_export_png)
	box.add_child(export_btn)
	var copy_btn: Button = Button.new()
	copy_btn.text = "Копировать в буфер"
	copy_btn.pressed.connect(_copy_to_clipboard)
	box.add_child(copy_btn)
	var gemini_btn: Button = Button.new()
	gemini_btn.text = "В Gemini"
	gemini_btn.pressed.connect(_on_gemini_pressed)
	box.add_child(gemini_btn)
	var fit_bounds_btn: Button = Button.new()
	fit_bounds_btn.text = "Границы по содержимому"
	fit_bounds_btn.pressed.connect(_fit_bounds_to_content)
	box.add_child(fit_bounds_btn)
	var clear_bounds_btn: Button = Button.new()
	clear_bounds_btn.text = "Сбросить границы"
	clear_bounds_btn.pressed.connect(_clear_bounds)
	box.add_child(clear_bounds_btn)
	var clear_btn: Button = Button.new()
	clear_btn.text = "Очистить всё"
	clear_btn.pressed.connect(_clear_all)
	box.add_child(clear_btn)
	_save_label = Label.new()
	_save_label.text = "Автосохранение включено"
	box.add_child(_save_label)

	var status_bar: PanelContainer = PanelContainer.new()
	status_bar.anchor_left = 0.0
	status_bar.anchor_top = 1.0
	status_bar.anchor_right = 1.0
	status_bar.anchor_bottom = 1.0
	status_bar.offset_left = 224.0
	status_bar.offset_top = -40.0
	status_bar.offset_bottom = -8.0
	status_bar.offset_right = -8.0
	_ui_layer.add_child(status_bar)
	var status_box: HBoxContainer = HBoxContainer.new()
	status_bar.add_child(status_box)
	_status_label = Label.new()
	_status_label.text = ""
	status_box.add_child(_status_label)

	_popup = Panel.new()
	_popup.anchor_left = 0.5
	_popup.anchor_top = 0.5
	_popup.anchor_right = 0.5
	_popup.anchor_bottom = 0.5
	_popup.offset_left = -260.0
	_popup.offset_top = -70.0
	_popup.offset_right = 260.0
	_popup.offset_bottom = 70.0
	_popup.visible = false
	_ui_layer.add_child(_popup)
	var pop_box: VBoxContainer = VBoxContainer.new()
	pop_box.set_anchors_preset(Control.PRESET_FULL_RECT)
	pop_box.add_theme_constant_override("separation", 6)
	_popup.add_child(pop_box)
	_popup_label = Label.new()
	pop_box.add_child(_popup_label)
	_popup_edit = LineEdit.new()
	_popup_edit.text_submitted.connect(_on_popup_ok)
	pop_box.add_child(_popup_edit)
	var pop_btns: HBoxContainer = HBoxContainer.new()
	pop_box.add_child(pop_btns)
	var ok_btn: Button = Button.new()
	ok_btn.text = "Готово"
	ok_btn.pressed.connect(_on_popup_ok)
	pop_btns.add_child(ok_btn)
	var cancel_btn: Button = Button.new()
	cancel_btn.text = "Отмена"
	cancel_btn.pressed.connect(_on_popup_cancel)
	pop_btns.add_child(cancel_btn)

	_gemini_dialog = Panel.new()
	_gemini_dialog.anchor_left = 0.5
	_gemini_dialog.anchor_top = 0.5
	_gemini_dialog.anchor_right = 0.5
	_gemini_dialog.anchor_bottom = 0.5
	_gemini_dialog.offset_left = -300.0
	_gemini_dialog.offset_top = -190.0
	_gemini_dialog.offset_right = 300.0
	_gemini_dialog.offset_bottom = 190.0
	_gemini_dialog.visible = false
	_ui_layer.add_child(_gemini_dialog)
	var gem_box: VBoxContainer = VBoxContainer.new()
	gem_box.set_anchors_preset(Control.PRESET_FULL_RECT)
	gem_box.add_theme_constant_override("separation", 6)
	_gemini_dialog.add_child(gem_box)
	var gem_hint: Label = Label.new()
	gem_hint.text = "Картинка копируется в буфер обмена (статус — внизу слева).\nНажми «Открыть Gemini» и вставь картинку в чат (Ctrl+V).\nПотом вернись сюда, нажми «Скопировать промпт» и вставь\nего в чат. Текст промпта сохраняется и подставится\nв следующий раз."
	gem_hint.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	gem_box.add_child(gem_hint)
	_gemini_edit = TextEdit.new()
	_gemini_edit.wrap_mode = TextEdit.LINE_WRAPPING_BOUNDARY
	_gemini_edit.custom_minimum_size = Vector2(560.0, 220.0)
	gem_box.add_child(_gemini_edit)
	var gem_btns: HBoxContainer = HBoxContainer.new()
	gem_box.add_child(gem_btns)
	var gem_open_btn: Button = Button.new()
	gem_open_btn.text = "Открыть Gemini"
	gem_open_btn.pressed.connect(_open_gemini)
	gem_btns.add_child(gem_open_btn)
	var gem_copy_btn: Button = Button.new()
	gem_copy_btn.text = "Скопировать промпт"
	gem_copy_btn.pressed.connect(_copy_gemini_prompt)
	gem_btns.add_child(gem_copy_btn)
	var gem_close_btn: Button = Button.new()
	gem_close_btn.text = "Закрыть"
	gem_close_btn.pressed.connect(_close_gemini_dialog)
	gem_btns.add_child(gem_close_btn)

func _select_tool(id: String) -> void:
	current_tool = id
	map_view.tool = id
	for k in _tool_buttons.keys():
		_tool_buttons[k].button_pressed = (k == id)

func _on_tool_button_pressed(id: String) -> void:
	_select_tool(id)

func _on_merge_toggled(pressed: bool) -> void:
	model.merge_adjacent = pressed
	_save()
	map_view.refresh()

func _select_grid(type: int) -> void:
	if model.grid_type == type:
		_grid_buttons[type].button_pressed = true
		return
	_push_undo()
	model.grid_type = type
	for k in _grid_buttons.keys():
		_grid_buttons[k].button_pressed = (k == type)
	_save()
	map_view.refresh()

func _on_grid_button_pressed(type: int) -> void:
	_select_grid(type)

func _push_undo() -> void:
	undo_stack.push_back(model.to_json_string())
	if undo_stack.size() > 100:
		undo_stack.pop_front()

func _on_stroke_started() -> void:
	_push_undo()

func _on_stroke_ended() -> void:
	_save()
	map_view.refresh()

func _undo() -> void:
	if undo_stack.is_empty():
		return
	var s: String = undo_stack.pop_back()
	if model.from_json_string(s):
		_grid_buttons[model.grid_type].button_pressed = true
		if _merge_check != null:
			_merge_check.button_pressed = model.merge_adjacent
		_save()
		map_view.refresh()

func _save() -> void:
	if _demo_mode:
		if _save_label != null:
			_save_label.text = "Демо-режим — без сохранения"
		return
	var f: FileAccess = FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if f != null:
		f.store_string(model.to_json_string())
		f.close()
	if _save_label != null:
		_save_label.text = "Сохранено " + Time.get_time_string_from_system()

func _load() -> void:
	if FileAccess.file_exists(SAVE_PATH):
		var s: String = FileAccess.get_file_as_string(SAVE_PATH)
		model.from_json_string(s)

func _clear_all() -> void:
	_push_undo()
	model.clear_all()
	_save()
	map_view.refresh()

func _on_text_requested(cell: Vector2i, kind: String) -> void:
	_popup_cell = cell
	_popup_kind = kind
	if kind == "custom":
		_popup_label.text = "Что значит этот тайл?"
		_popup_edit.text = ""
		for obj in model.stack_of(cell):
			if obj["type"] == "custom":
				_popup_edit.text = str(obj["text"])
				break
	else:
		_popup_label.text = "Подпись на клетке:"
		_popup_edit.text = str(model.notes.get(cell, ""))
	_popup.visible = true
	_popup_edit.grab_focus()
	_popup_edit.select_all()

func _on_popup_ok(_text: String = "") -> void:
	if not _popup.visible:
		return
	_popup.visible = false
	_push_undo()
	var text: String = _popup_edit.text
	if _popup_kind == "custom":
		model.add_object(_popup_cell, "custom", text)
	else:
		model.set_note(_popup_cell, text)
	_save()
	map_view.refresh()

func _on_popup_cancel() -> void:
	_popup.visible = false

func _fit_view() -> void:
	var rect: Rect2 = model.bounds()
	var vp: Vector2 = get_viewport().get_visible_rect().size
	var avail: Vector2 = Vector2(max(vp.x - 240.0, 200.0), vp.y)
	var z: float = min(avail.x / rect.size.x, avail.y / rect.size.y)
	z = clamp(z, 0.2, 2.5)
	camera.zoom = Vector2(z, z)
	camera.position = rect.get_center()

func _fit_bounds_to_content() -> void:
	_push_undo()
	model.set_export_bounds(model.bounds().grow(48.0))
	_save()
	map_view.refresh()

func _clear_bounds() -> void:
	_push_undo()
	model.clear_export_bounds()
	_save()
	map_view.refresh()

# Renders exactly the export rect (user bounds, or content + margin) into an
# image: frames the rect with the camera, captures the viewport, crops the
# letterbox. Overlays (bounds outline, hover) are suppressed for the shot.
func _render_bounds_image() -> Image:
	var rect: Rect2 = model.effective_bounds()
	var vp: Vector2 = get_viewport().get_visible_rect().size
	var old_pos: Vector2 = camera.position
	var old_zoom: Vector2 = camera.zoom
	var old_overlays: bool = map_view.show_overlays
	map_view.show_overlays = false
	_ui_layer.visible = false
	var scale: float = min(vp.x / rect.size.x, vp.y / rect.size.y)
	camera.zoom = Vector2(scale, scale)
	camera.position = rect.get_center()
	await RenderingServer.frame_post_draw
	var full: Image = get_viewport().get_texture().get_image()
	camera.position = old_pos
	camera.zoom = old_zoom
	map_view.show_overlays = old_overlays
	_ui_layer.visible = true
	map_view.refresh()
	var drawn: Vector2 = rect.size * scale
	var offset: Vector2 = (vp - drawn) / 2.0
	var src_rect: Rect2i = Rect2i(Vector2i(int(round(offset.x)), int(round(offset.y))), Vector2i(int(round(drawn.x)), int(round(drawn.y))))
	src_rect = src_rect.intersection(Rect2i(Vector2i.ZERO, Vector2i(full.get_width(), full.get_height())))
	var out: Image = Image.create(src_rect.size.x, src_rect.size.y, false, full.get_format())
	out.blit_rect(full, src_rect, Vector2i.ZERO)
	return out

func _export_png() -> void:
	if DisplayServer.get_name() == "headless":
		if _save_label != null:
			_save_label.text = "Экспорт недоступен без окна"
		return
	var img: Image = await _render_bounds_image()
	if OS.has_feature("web"):
		# user:// on the web is invisible IndexedDB storage — download instead.
		_download_png_web(img, EXPORT_NAME)
		if _save_label != null:
			_save_label.text = "PNG скачан: " + EXPORT_NAME
		return
	var path: String = OS.get_user_data_dir() + "/" + EXPORT_NAME
	var err: Error = img.save_png(path)
	if err == OK and _save_label != null:
		_save_label.text = "Экспорт: " + path

# Web-only helpers. The web build has no OS clipboard tools and no visible
# user:// folder, so export becomes a browser download and clipboard copy
# goes through the Clipboard API (HTTPS + the button click count as the
# required gesture; if the browser refuses, the PNG downloads instead).
func _download_png_web(img: Image, filename: String) -> void:
	var b64: String = Marshalls.raw_to_base64(img.save_png_to_buffer())
	JavaScriptBridge.eval("var a=document.createElement('a');a.href='data:image/png;base64," + b64 + "';a.download='" + filename + "';document.body.appendChild(a);a.click();a.remove();")

func _copy_to_clipboard_web(img: Image) -> void:
	var b64: String = Marshalls.raw_to_base64(img.save_png_to_buffer())
	JavaScriptBridge.eval("window.__mbClip='pending';(function(){var bin=atob('" + b64 + "');var bytes=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++){bytes[i]=bin.charCodeAt(i);}var blob=new Blob([bytes],{type:'image/png'});navigator.clipboard.write([new ClipboardItem({'image/png':blob})]).then(function(){window.__mbClip='ok';}).catch(function(){window.__mbClip='err';});})();")
	var result: String = "pending"
	for _i in range(15):
		await get_tree().create_timer(0.2).timeout
		result = str(JavaScriptBridge.eval("window.__mbClip"))
		if result != "pending":
			break
	if _save_label == null:
		return
	if result == "ok":
		_save_label.text = "Скопировано в буфер обмена"
	else:
		_download_png_web(img, "map_clipboard.png")
		_save_label.text = "Браузер не разрешил копирование — PNG скачан, вставь файлом"

func _apply_web_query() -> void:
	var query: String = str(JavaScriptBridge.eval("window.location.search"))
	if query.contains("grid=hex"):
		model.grid_type = 1
		_grid_buttons[1].button_pressed = true
	if query.contains("demo"):
		_demo_mode = true
		_load_demo()
		_fit_view()
		map_view.refresh()
		if _save_label != null:
			_save_label.text = "Демо-режим (?demo=1) — без сохранения"

# A small sample map: a room with a door and a stacked window, a pit with a
# note, a custom tile — one of everything, ready to click through.
func _load_demo() -> void:
	model.clear_all()
	for x in range(8):
		model.add_object(Vector2i(x, 0), "wall")
		model.add_object(Vector2i(x, 4), "wall")
	for y in range(1, 4):
		model.add_object(Vector2i(0, y), "wall")
		model.add_object(Vector2i(7, y), "wall")
	model.cells.erase(Vector2i(3, 0))
	model.add_object(Vector2i(3, 0), "door")
	model.add_object(Vector2i(6, 0), "window")
	model.add_object(Vector2i(2, 2), "pit")
	model.set_note(Vector2i(2, 2), "Здесь ловушка")
	model.add_object(Vector2i(5, 2), "custom", "Секретная дверь")
	model.set_export_bounds(Rect2(-48.0, -48.0, 624.0, 336.0))

# Godot has no image-clipboard API, so the image goes through the OS tool:
# xclip / wl-copy on Linux, PowerShell on Windows, osascript on macOS.
# The PNG file is always saved first, so a clipboard failure still leaves
# a file to paste from. On the web build, the JS Clipboard API is used.
func _copy_to_clipboard() -> void:
	if DisplayServer.get_name() == "headless":
		if _save_label != null:
			_save_label.text = "Буфер недоступен без окна"
		return
	var img: Image = await _render_bounds_image()
	if OS.has_feature("web"):
		_copy_to_clipboard_web(img)
		return
	var hint: String = _copy_image_desktop(img)
	if _save_label != null:
		if hint == "":
			_save_label.text = "Скопировано в буфер обмена"
		elif hint == "save":
			_save_label.text = "Не удалось сохранить PNG"
		else:
			_save_label.text = "Буфер не удался (" + hint + ") — PNG: " + OS.get_user_data_dir() + "/map_clipboard.png"

# Desktop image clipboard (shared by "Копировать в буфер" and "В Gemini").
# Returns "" on success, "save" if the PNG could not be written, otherwise
# a short hint why the OS tool failed. The PNG file is always the fallback.
func _copy_image_desktop(img: Image) -> String:
	var path: String = OS.get_user_data_dir() + "/map_clipboard.png"
	if img.save_png(path) != OK:
		return "save"
	var os_name: String = OS.get_name()
	if os_name == "Linux":
		if _run_clipboard("xclip", ["-selection", "clipboard", "-t", "image/png", "-i", path]):
			return ""
		if _run_clipboard("sh", ["-c", "wl-copy --type image/png < '" + path.replace("'", "'\\''") + "'"]):
			return ""
		return "нужны xclip или wl-copy"
	if os_name == "Windows":
		var ps: String = "Add-Type -AssemblyName System.Windows.Forms; [Windows.Forms.Clipboard]::SetImage([System.Drawing.Image]::FromFile('" + path.replace("'", "''") + "'))"
		if _run_clipboard("powershell", ["-NoProfile", "-Command", ps]):
			return ""
		return "не сработал PowerShell"
	if os_name == "macOS":
		var sc: String = "set the clipboard to (read (POSIX file \"" + path + "\") as «class PNGf»)"
		if _run_clipboard("osascript", ["-e", sc]):
			return ""
		return "не сработал osascript"
	return "неизвестная ОС"

# "В Gemini" handoff: image to the clipboard, then an editable prompt
# dialog with an "Открыть Gemini" button. The tab deliberately opens from
# the dialog button, not from the toolbox button: opening a tab first
# steals the page focus and the browser then refuses the clipboard write
# (observed in QA: "Браузер не разрешил копирование"), while a click on
# the dialog button is a fresh user gesture, so no popup blocker either.
func _on_gemini_pressed() -> void:
	if DisplayServer.get_name() == "headless":
		if _save_label != null:
			_save_label.text = "Gemini недоступна без окна"
		return
	var img: Image = await _render_bounds_image()
	if OS.has_feature("web"):
		_copy_to_clipboard_web(img)
	else:
		_copy_image_desktop(img)
	_show_gemini_dialog()

func _open_gemini() -> void:
	if OS.has_feature("web"):
		JavaScriptBridge.eval("window.open('" + GEMINI_URL + "','_blank');")
	else:
		OS.shell_open(GEMINI_URL)

func _show_gemini_dialog() -> void:
	if FileAccess.file_exists(GEMINI_PROMPT_PATH):
		_gemini_edit.text = FileAccess.get_file_as_string(GEMINI_PROMPT_PATH)
	else:
		_gemini_edit.text = GEMINI_PROMPT_DEFAULT
	_gemini_dialog.visible = true
	_gemini_edit.grab_focus()

func _close_gemini_dialog() -> void:
	var f: FileAccess = FileAccess.open(GEMINI_PROMPT_PATH, FileAccess.WRITE)
	if f != null:
		f.store_string(_gemini_edit.text)
		f.close()
	_gemini_dialog.visible = false

func _copy_gemini_prompt() -> void:
	var text: String = _gemini_edit.text
	if OS.has_feature("web"):
		var b64: String = Marshalls.utf8_to_base64(text)
		JavaScriptBridge.eval("window.__mbText='pending';navigator.clipboard.writeText(new TextDecoder().decode(Uint8Array.from(atob('" + b64 + "'),function(c){return c.charCodeAt(0);}))).then(function(){window.__mbText='ok';}).catch(function(){window.__mbText='err';});")
		var result: String = "pending"
		for _i in range(10):
			await get_tree().create_timer(0.2).timeout
			result = str(JavaScriptBridge.eval("window.__mbText"))
			if result != "pending":
				break
		if _save_label != null:
			_save_label.text = "Промпт скопирован" if result == "ok" else "Промпт не скопировался — выдели текст вручную"
		return
	DisplayServer.clipboard_set(text)
	if _save_label != null:
		_save_label.text = "Промпт скопирован"

func _run_clipboard(cmd: String, args: Array) -> bool:
	return OS.execute(cmd, args) == 0

func _tool_name(id: String) -> String:
	for t in TOOLS:
		if t["id"] == id:
			return str(t["label"]).split(" (")[0]
	return id

func _process(_delta: float) -> void:
	if _status_label == null or map_view == null:
		return
	var grid_name: String = "квадратная" if model.grid_type == 0 else "хекс"
	var text: String = "Сетка: " + grid_name + "  |  Инструмент: " + _tool_name(current_tool)
	if model.has_export_bounds:
		text += "  |  Границы: " + str(int(model.export_bounds.size.x)) + "×" + str(int(model.export_bounds.size.y))
	if map_view.has_hover:
		var key: Vector2i = map_view.hover_key
		text += "  |  Клетка: (" + str(key.x) + ", " + str(key.y) + ")"
		var names: String = model.stack_names(key)
		if names != "":
			text += "  |  В клетке: " + names
		var note: String = str(model.notes.get(key, ""))
		if note != "":
			text += "  |  Подпись: " + note
	var buf: String = model.describe_stack(map_view.copy_buffer)
	if buf != "":
		text += "  |  Копия: " + buf + " — Ctrl+V ставит"
	if text != _last_status:
		_last_status = text
		_status_label.text = text

func _input(event: InputEvent) -> void:
	if _popup != null and _popup.visible:
		if event.is_action_pressed("ui_cancel"):
			_on_popup_cancel()
		return
	if _gemini_dialog != null and _gemini_dialog.visible:
		if event.is_action_pressed("ui_cancel"):
			_close_gemini_dialog()
		return
	var focus: Control = get_viewport().gui_get_focus_owner()
	if focus is LineEdit or focus is TextEdit:
		return
	if event is InputEventKey and event.pressed and not event.echo:
		var k: InputEventKey = event
		if k.ctrl_pressed and k.physical_keycode == KEY_Z:
			_undo()
		elif (k.ctrl_pressed or k.meta_pressed) and k.physical_keycode == KEY_C:
			# Copy the hovered cell's stack into the copy buffer.
			# physical_keycode (not keycode): in a Russian layout the
			# logical keycode of the C/V/Z keys is Cyrillic, so keycode
			# matching silently breaks all letter shortcuts.
			# Text-field focus is guarded above, so typing is never hijacked.
			if map_view.has_hover:
				map_view.copy_buffer = model.stack_copy(map_view.hover_key)
				map_view.refresh()
		elif (k.ctrl_pressed or k.meta_pressed) and k.physical_keycode == KEY_V:
			if map_view.has_hover and not map_view.copy_buffer.is_empty():
				var before: String = model.to_json_string()
				if model.stamp_stack(map_view.hover_key, map_view.copy_buffer):
					undo_stack.push_back(before)
					if undo_stack.size() > 100:
						undo_stack.pop_front()
					_save()
					map_view.refresh()
		elif k.physical_keycode == KEY_1:
			_select_tool("wall")
		elif k.physical_keycode == KEY_2:
			_select_tool("door")
		elif k.physical_keycode == KEY_3:
			_select_tool("window")
		elif k.physical_keycode == KEY_4:
			_select_tool("pit")
		elif k.physical_keycode == KEY_5:
			_select_tool("custom")
		elif k.physical_keycode == KEY_6:
			_select_tool("text")
		elif k.physical_keycode == KEY_7:
			_select_tool("eraser")
		elif k.physical_keycode == KEY_8:
			_select_tool("bounds")
		elif k.physical_keycode == KEY_DELETE or k.physical_keycode == KEY_BACKSPACE:
			# Delete the hovered cell's top object (Shift = whole cell).
			# LineEdit focus is guarded above, so typing is never affected.
			if map_view.has_hover:
				_push_undo()
				var key: Vector2i = map_view.hover_key
				if k.shift_pressed:
					model.clear_cell(key)
				else:
					model.remove_top(key)
				_save()
				map_view.refresh()
		elif k.physical_keycode == KEY_G:
			_select_grid(1 if model.grid_type == 0 else 0)
		elif k.physical_keycode == KEY_F:
			_fit_view()
