use tauri::menu::{Menu, MenuItem, Submenu, PredefinedMenuItem, MenuItemKind};
use tauri::{Emitter, Manager, State};
use std::sync::Mutex;

pub struct AppState {
    pub recent_files_submenu: Mutex<Option<Submenu<tauri::Wry>>>,
}

impl Default for AppState {
    fn default() -> Self {
        AppState {
            recent_files_submenu: Mutex::new(None),
        }
    }
}

#[tauri::command]
fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

#[tauri::command]
fn update_recent_files(
    app: tauri::AppHandle,
    state: State<'_, AppState>,
    files: Vec<String>,
) -> Result<(), String> {
    let guard = state.recent_files_submenu.lock().map_err(|e| e.to_string())?;
    if let Some(submenu) = guard.as_ref() {
        // Clear all existing items
        let items = submenu.items().map_err(|e| e.to_string())?;
        for item in items {
            match item {
                MenuItemKind::MenuItem(i) => { let _ = submenu.remove(&i); }
                MenuItemKind::Submenu(i)  => { let _ = submenu.remove(&i); }
                MenuItemKind::Predefined(i) => { let _ = submenu.remove(&i); }
                MenuItemKind::Check(i)    => { let _ = submenu.remove(&i); }
                MenuItemKind::Icon(i)     => { let _ = submenu.remove(&i); }
            }
        }

        if files.is_empty() {
            let none = MenuItem::with_id(&app, "recent_none", "No Recent Files", false, None::<&str>)
                .map_err(|e| e.to_string())?;
            submenu.append(&none).map_err(|e| e.to_string())?;
        } else {
            for (i, path) in files.iter().take(10).enumerate() {
                let name = path.rsplit(&['/', '\\']).next().unwrap_or(path.as_str());
                let item = MenuItem::with_id(&app, format!("recent_{}", i), name, true, None::<&str>)
                    .map_err(|e| e.to_string())?;
                submenu.append(&item).map_err(|e| e.to_string())?;
            }
            let sep = PredefinedMenuItem::separator(&app).map_err(|e| e.to_string())?;
            submenu.append(&sep).map_err(|e| e.to_string())?;
            let clear = MenuItem::with_id(&app, "clear_recent", "Clear Recent Files", true, None::<&str>)
                .map_err(|e| e.to_string())?;
            submenu.append(&clear).map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppState::default())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let handle = app.handle();

            // Build "Open Recent" submenu (starts empty)
            let recent_none = MenuItem::with_id(handle, "recent_none", "No Recent Files", false, None::<&str>)?;
            let recent_submenu = Submenu::with_items(handle, "Open Recent", true, &[&recent_none])?;
            let recent_submenu_clone = recent_submenu.clone();

            let file_menu = {
                let new_file    = MenuItem::with_id(handle, "new", "New File", true, Some("CmdOrCtrl+N"))?;
                let new_tab     = MenuItem::with_id(handle, "new_tab", "New Tab", true, Some("CmdOrCtrl+Shift+N"))?;
                let open        = MenuItem::with_id(handle, "open", "Open...", true, Some("CmdOrCtrl+O"))?;
                let sep1        = PredefinedMenuItem::separator(handle)?;
                let save        = MenuItem::with_id(handle, "save", "Save", true, Some("CmdOrCtrl+S"))?;
                let save_as     = MenuItem::with_id(handle, "save_as", "Save As...", true, Some("CmdOrCtrl+Shift+S"))?;
                let sep_export  = PredefinedMenuItem::separator(handle)?;
                let export_html = MenuItem::with_id(handle, "export_html", "Export as HTML...", true, None::<&str>)?;
                let export_pdf  = MenuItem::with_id(handle, "export_pdf", "Export as PDF (Print)...", true, None::<&str>)?;
                let export_submenu = Submenu::with_items(handle, "Export", true, &[&export_html, &export_pdf])?;
                let sep2        = PredefinedMenuItem::separator(handle)?;
                let quit        = PredefinedMenuItem::quit(handle, Some("Quit"))?;
                Submenu::with_items(handle, "File", true, &[
                    &new_file, &new_tab, &open, &recent_submenu, &sep1,
                    &save, &save_as, &sep_export, &export_submenu, &sep2, &quit,
                ])?
            };

            let edit_menu = {
                let undo       = PredefinedMenuItem::undo(handle, Some("Undo"))?;
                let redo       = PredefinedMenuItem::redo(handle, Some("Redo"))?;
                let sep1       = PredefinedMenuItem::separator(handle)?;
                let cut        = PredefinedMenuItem::cut(handle, Some("Cut"))?;
                let copy       = PredefinedMenuItem::copy(handle, Some("Copy"))?;
                let paste      = PredefinedMenuItem::paste(handle, Some("Paste"))?;
                let select_all = PredefinedMenuItem::select_all(handle, Some("Select All"))?;
                let sep2       = PredefinedMenuItem::separator(handle)?;
                let find       = MenuItem::with_id(handle, "find", "Find", true, Some("CmdOrCtrl+F"))?;
                let sep3       = PredefinedMenuItem::separator(handle)?;
                let prefs      = MenuItem::with_id(handle, "preferences", "Preferences", true, Some("CmdOrCtrl+Comma"))?;
                Submenu::with_items(handle, "Edit", true, &[
                    &undo, &redo, &sep1, &cut, &copy, &paste, &select_all, &sep2, &find, &sep3, &prefs,
                ])?
            };

            let view_menu = {
                let toggle_editor      = MenuItem::with_id(handle, "toggle_editor", "Toggle Editor", true, Some("CmdOrCtrl+Shift+E"))?;
                let toggle_preview     = MenuItem::with_id(handle, "toggle_preview", "Toggle Preview", true, Some("CmdOrCtrl+Shift+P"))?;
                let toggle_toolbar     = MenuItem::with_id(handle, "toggle_toolbar", "Toggle Toolbar", true, None::<&str>)?;
                let toggle_scroll_sync = MenuItem::with_id(handle, "toggle_scroll_sync", "Toggle Scroll Sync", true, None::<&str>)?;
                let view_only          = MenuItem::with_id(handle, "view_only_mode", "View Only Mode", true, Some("CmdOrCtrl+Shift+R"))?;
                let toggle_diff        = MenuItem::with_id(handle, "toggle_diff", "Toggle Diff View", true, None::<&str>)?;
                let sep1               = PredefinedMenuItem::separator(handle)?;
                let increase_font      = MenuItem::with_id(handle, "increase_font", "Increase Font", true, Some("CmdOrCtrl+Equal"))?;
                let decrease_font      = MenuItem::with_id(handle, "decrease_font", "Decrease Font", true, Some("CmdOrCtrl+Minus"))?;
                let reset_font         = MenuItem::with_id(handle, "reset_font", "Reset Font", true, Some("CmdOrCtrl+0"))?;
                let sep2               = PredefinedMenuItem::separator(handle)?;
                let theme_light        = MenuItem::with_id(handle, "theme_light", "Light", true, None::<&str>)?;
                let theme_dark         = MenuItem::with_id(handle, "theme_dark", "Dark", true, None::<&str>)?;
                let theme_sol_light    = MenuItem::with_id(handle, "theme_solarized_light", "Solarized Light", true, None::<&str>)?;
                let theme_sol_dark     = MenuItem::with_id(handle, "theme_solarized_dark", "Solarized Dark", true, None::<&str>)?;
                let theme_submenu      = Submenu::with_items(handle, "Theme", true, &[
                    &theme_light, &theme_dark, &theme_sol_light, &theme_sol_dark,
                ])?;
                Submenu::with_items(handle, "View", true, &[
                    &toggle_editor, &toggle_preview, &toggle_toolbar, &toggle_scroll_sync,
                    &view_only, &toggle_diff, &sep1,
                    &increase_font, &decrease_font, &reset_font, &sep2, &theme_submenu,
                ])?
            };

            let help_menu = {
                let about  = MenuItem::with_id(handle, "about", "About MD Editor", true, None::<&str>)?;
                let donate = MenuItem::with_id(handle, "donate", "Donate / Support...", true, None::<&str>)?;
                Submenu::with_items(handle, "Help", true, &[&about, &donate])?
            };

            let menu = Menu::with_items(handle, &[&file_menu, &edit_menu, &view_menu, &help_menu])?;
            app.set_menu(menu)?;

            // Store the recent submenu handle so update_recent_files can mutate it
            *app.state::<AppState>().recent_files_submenu.lock().unwrap() = Some(recent_submenu_clone);

            app.on_menu_event(move |app, event| {
                let _ = app.emit("menu-event", event.id().as_ref());
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_app_version, update_recent_files])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app_handle, event| {
            if let tauri::RunEvent::Opened { urls } = event {
                for url in urls {
                    let path_str = url.path().to_string();
                    if !path_str.is_empty() {
                        let _ = app_handle.emit("open-file", path_str);
                    }
                }
            }
        });
}
