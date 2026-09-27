// Windows'ta sürüm derlemesi açılırken arkada boş bir konsol penceresi çıkmasın.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    mimlesek_lib::run()
}
