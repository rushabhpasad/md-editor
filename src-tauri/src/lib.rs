use tauri::menu::{Menu, MenuItem, Submenu, PredefinedMenuItem};
use tauri::Emitter;

#[tauri::command]
fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let handle = app.handle();

            let file_menu = {
                let new = MenuItem::with_id(handle, "new", "New File", true, Some("CmdOrCtrl+N"))?;
                let open = MenuItem::with_id(handle, "open", "Open...", true, Some("CmdOrCtrl+O"))?;
                let recent = MenuItem::with_id(handle, "recent_files", "Recent Files", true, None::<&str>)?;
                let sep1 = PredefinedMenuItem::separator(handle)?;
                let save = MenuItem::with_id(handle, "save", "Save", true, Some("CmdOrCtrl+S"))?;
                let save_as = MenuItem::with_id(handle, "save_as", "Save As...", true, Some("CmdOrCtrl+Shift+S"))?;
                let sep2 = PredefinedMenuItem::separator(handle)?;
                let quit = PredefinedMenuItem::quit(handle, Some("Quit"))?;
                Submenu::with_items(handle, "File", true, &[
                    &new, &open, &recent, &sep1, &save, &save_as, &sep2, &quit,
                ])?
            };

            let edit_menu = {
                let undo = PredefinedMenuItem::undo(handle, Some("Undo"))?;
                let redo = PredefinedMenuItem::redo(handle, Some("Redo"))?;
                let sep1 = PredefinedMenuItem::separator(handle)?;
                let cut = PredefinedMenuItem::cut(handle, Some("Cut"))?;
                let copy = PredefinedMenuItem::copy(handle, Some("Copy"))?;
                let paste = PredefinedMenuItem::paste(handle, Some("Paste"))?;
                let select_all = PredefinedMenuItem::select_all(handle, Some("Select All"))?;
                let sep2 = PredefinedMenuItem::separator(handle)?;
                let find = MenuItem::with_id(handle, "find", "Find", true, Some("CmdOrCtrl+F"))?;
                let sep3 = PredefinedMenuItem::separator(handle)?;
                let prefs = MenuItem::with_id(handle, "preferences", "Preferences", true, Some("CmdOrCtrl+Comma"))?;
                Submenu::with_items(handle, "Edit", true, &[
                    &undo, &redo, &sep1, &cut, &copy, &paste, &select_all, &sep2, &find, &sep3, &prefs,
                ])?
            };

            let view_menu = {
                let toggle_editor = MenuItem::with_id(handle, "toggle_editor", "Toggle Editor", true, Some("CmdOrCtrl+Shift+E"))?;
                let toggle_preview = MenuItem::with_id(handle, "toggle_preview", "Toggle Preview", true, Some("CmdOrCtrl+Shift+P"))?;
                let toggle_toolbar = MenuItem::with_id(handle, "toggle_toolbar", "Toggle Toolbar", true, None::<&str>)?;
                let toggle_scroll_sync = MenuItem::with_id(handle, "toggle_scroll_sync", "Toggle Scroll Sync", true, None::<&str>)?;
                let sep1 = PredefinedMenuItem::separator(handle)?;
                let increase_font = MenuItem::with_id(handle, "increase_font", "Increase Font", true, Some("CmdOrCtrl+Equal"))?;
                let decrease_font = MenuItem::with_id(handle, "decrease_font", "Decrease Font", true, Some("CmdOrCtrl+Minus"))?;
                let reset_font = MenuItem::with_id(handle, "reset_font", "Reset Font", true, Some("CmdOrCtrl+0"))?;
                let sep2 = PredefinedMenuItem::separator(handle)?;
                let theme_light = MenuItem::with_id(handle, "theme_light", "Light", true, None::<&str>)?;
                let theme_dark = MenuItem::with_id(handle, "theme_dark", "Dark", true, None::<&str>)?;
                let theme_sol_light = MenuItem::with_id(handle, "theme_solarized_light", "Solarized Light", true, None::<&str>)?;
                let theme_sol_dark = MenuItem::with_id(handle, "theme_solarized_dark", "Solarized Dark", true, None::<&str>)?;
                let theme_submenu = Submenu::with_items(handle, "Theme", true, &[
                    &theme_light, &theme_dark, &theme_sol_light, &theme_sol_dark,
                ])?;
                Submenu::with_items(handle, "View", true, &[
                    &toggle_editor, &toggle_preview, &toggle_toolbar, &toggle_scroll_sync,
                    &sep1, &increase_font, &decrease_font, &reset_font, &sep2, &theme_submenu,
                ])?
            };

            let help_menu = {
                let about = PredefinedMenuItem::about(handle, Some("About"), None)?;
                Submenu::with_items(handle, "Help", true, &[&about])?
            };

            let menu = Menu::with_items(handle, &[&file_menu, &edit_menu, &view_menu, &help_menu])?;
            app.set_menu(menu)?;

            app.on_menu_event(move |app, event| {
                let _ = app.emit("menu-event", event.id().as_ref());
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_app_version])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
