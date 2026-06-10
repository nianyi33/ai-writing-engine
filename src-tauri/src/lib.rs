use std::process::{Child, Command, Stdio};
use std::sync::Mutex;

struct Backend {
    child: Mutex<Option<Child>>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // Resolve paths relative to the exe
            let exe_dir = std::env::current_exe()
                .ok()
                .and_then(|p| p.parent().map(|d| d.to_path_buf()))
                .unwrap_or_default();

            // In dev mode (cargo build): target/release or target/debug
            // In production: exe_dir is the install dir with bundled resources
            let project_root = std::env::current_dir().unwrap_or(exe_dir.clone());

            // Start backend: try node + bundled script, then npx tsx
            let script = exe_dir.join("resources").join("backend-bundle.cjs");

            let mut child: Option<Child> = None;

            // Method 1: node + bundled script
            if script.exists() {
                println!("[Tauri] 启动后端 (node bundled)");
                child = Command::new("node")
                    .arg(&script)
                    .current_dir(&project_root)
                    .stdout(Stdio::null())
                    .stderr(Stdio::null())
                    .spawn()
                    .ok();
            }

            // Method 2: node from Program Files
            if child.is_none() && script.exists() {
                for node_path in &[
                    r"C:\Program Files\nodejs\node.exe",
                    r"C:\Program Files (x86)\nodejs\node.exe",
                ] {
                    if let Ok(c) = Command::new(node_path)
                        .arg(&script)
                        .current_dir(&project_root)
                        .stdout(Stdio::null())
                        .stderr(Stdio::null())
                        .spawn()
                    {
                        child = Some(c);
                        break;
                    }
                }
            }

            match child {
                Some(c) => {
                    println!("[Tauri] ✅ 后端已启动 (PID:{})", c.id());
                    app.manage(Backend { child: Mutex::new(Some(c)) });
                }
                None => {
                    eprintln!("[Tauri] ⚠️ 后端未启动 — 请确保 Node.js 已安装");
                    app.manage(Backend { child: Mutex::new(None) });
                }
            }

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("构建失败")
        .run(|app, event| {
            if let tauri::RunEvent::Exit = event {
                if let Some(state) = app.try_state::<Backend>() {
                    if let Ok(mut g) = state.child.lock() {
                        if let Some(ref mut c) = *g {
                            let _ = c.kill();
                        }
                    }
                }
            }
        });
}
