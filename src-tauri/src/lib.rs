use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use tauri::Manager;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

const CREATE_NO_WINDOW: u32 = 0x08000000;

fn hide_window(cmd: &mut Command) {
    #[cfg(target_os = "windows")]
    cmd.creation_flags(CREATE_NO_WINDOW);
}

struct Backend {
    child: Mutex<Option<Child>>,
}

fn spawn_backend(label: &str, mut cmd: Command) -> Option<Child> {
    hide_window(&mut cmd);
    cmd.stdout(Stdio::null()).stderr(Stdio::null());
    match cmd.spawn() {
        Ok(child) => {
            println!("[Tauri] ✅ 后端已启动 ({}) PID:{}", label, child.id());
            Some(child)
        }
        Err(e) => {
            eprintln!("[Tauri] ❌ {} 启动失败: {}", label, e);
            None
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let exe_dir = std::env::current_exe()
                .ok()
                .and_then(|p| p.parent().map(|d| d.to_path_buf()))
                .unwrap_or_default();
            // In dev: target/release/ → 3 levels up to project root
            // In release: exe_dir itself is the working dir
            let dev_root = exe_dir.join("..").join("..").join("..");
            let project_root = if dev_root.join("package.json").exists() {
                dev_root.canonicalize().unwrap_or(dev_root)
            } else {
                // Portable / installed mode: use exe_dir
                exe_dir.clone()
            };

            println!("[Tauri] project_root: {:?}", project_root);

            // Try multiple methods, prefer bundled script for installed apps
            let mut child: Option<Child> = None;

            // Method 1: node + bundled script (bundled in installer)
            {
                let script = exe_dir.join("resources").join("backend-bundle.cjs");
                // Also check next to exe for non-installed copies
                let script2 = exe_dir.join("backend-bundle.cjs");

                let found = if script.exists() { Some(&script) }
                    else if script2.exists() { Some(&script2) }
                    else { None };

                if let Some(s) = found {
                    let mut cmd = Command::new("node");
                    cmd.arg(s).current_dir(exe_dir.join("..").join("..").join(".."));
                    child = spawn_backend("node+bundled", cmd);
                }
            }

            // Method 2: cmd /c npx tsx (dev mode, works from Explorer)
            if child.is_none() {
                let mut cmd = Command::new("cmd");
                cmd.args(["/c", "npx.cmd", "tsx", "backend\\server.ts"])
                    .current_dir(&project_root);
                child = spawn_backend("cmd→npx", cmd);
            }

            // Method 3: npx tsx directly
            if child.is_none() {
                let mut cmd = Command::new("npx.cmd");
                cmd.args(["tsx", "backend/server.ts"]).current_dir(&project_root);
                child = spawn_backend("npx", cmd);
            }

            match child {
                Some(c) => {
                    app.manage(Backend { child: Mutex::new(Some(c)) });
                }
                None => {
                    eprintln!("[Tauri] ❌ 后端启动失败！");
                    eprintln!("[Tauri] 请安装 Node.js: https://nodejs.org");
                    // Show native dialog on Windows
                    #[cfg(target_os = "windows")]
                    {
                        let _ = Command::new("cmd")
                            .args(["/c", "start", "msg", "*", "AI写作引擎需要 Node.js 才能运行 AI 功能。\n请从 https://nodejs.org 下载安装。\n\n窗口可以继续使用，但 AI 续写等功能将不可用。"])
                            .spawn();
                    }
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
