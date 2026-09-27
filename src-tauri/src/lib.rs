// Mimlesek'in yerel kabuğu. Uygulamanın tamamı web tarafında çalışır; kabuk yalnızca
// pencereyi açar ve yedek dosyasını kaydetmek/açmak için sistem pencerelerini sağlar.

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .run(tauri::generate_context!())
        .expect("Mimlesek başlatılamadı");
}
