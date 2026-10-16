use crate::error::AppError;
use notify::{Event, RecommendedWatcher, RecursiveMode, Watcher};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Emitter, State};

/// Exports the review markdown to ~/.revu/{repo-name}-{epoch}.md and returns the absolute path.
#[tauri::command]
pub async fn export_review(repo_path: String, markdown: String) -> Result<String, AppError> {
    let home = std::env::var("HOME").map_err(|_| {
        std::io::Error::new(
            std::io::ErrorKind::NotFound,
            "HOME environment variable not set",
        )
    })?;

    let revu_dir = Path::new(&home).join(".revu");
    fs::create_dir_all(&revu_dir)?;

    let repo_name = Path::new(&repo_path)
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| "unknown".to_string());

    let epoch = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();

    let filename = format!("{}-{}.md", repo_name, epoch);
    let output_path = revu_dir.join(filename);
    fs::write(&output_path, &markdown)?;

    Ok(output_path.to_string_lossy().to_string())
}

/// Resolves `path`, accepting only a file directly inside the (canonical) `revu_dir`.
fn resolve_review_path(revu_dir: &Path, path: &str) -> Result<PathBuf, AppError> {
    let review_path = fs::canonicalize(path)?;
    if review_path.parent() != Some(revu_dir) {
        return Err(AppError::Custom(
            "Review path is outside ~/.revu".to_string(),
        ));
    }
    Ok(review_path)
}

#[derive(Default)]
pub struct ReviewWatcher(Mutex<Option<RecommendedWatcher>>);

/// Returns an exported review's contents, then emits `review-changed` with the new
/// contents whenever it is written. Replaces any review watched before.
#[tauri::command]
pub async fn watch_review(
    app: AppHandle,
    watcher: State<'_, ReviewWatcher>,
    path: String,
) -> Result<String, AppError> {
    let home = std::env::var("HOME")
        .map_err(|_| AppError::Custom("HOME environment variable not set".to_string()))?;
    let revu_dir = fs::canonicalize(Path::new(&home).join(".revu"))?;
    let review_path = resolve_review_path(&revu_dir, &path)?;

    // Watch the directory, not the file: agents often save by writing a temp
    // file and renaming it over the original, which ends a watch on the file.
    let watched_path = review_path.clone();
    let mut new_watcher = notify::recommended_watcher(move |res: notify::Result<Event>| {
        let Ok(event) = res else { return };
        if event.kind.is_access() || !event.paths.contains(&watched_path) {
            return;
        }
        if let Ok(review) = fs::read_to_string(&watched_path) {
            let _ = app.emit("review-changed", review);
        }
    })
    .map_err(|e| AppError::Custom(e.to_string()))?;
    new_watcher
        .watch(&revu_dir, RecursiveMode::NonRecursive)
        .map_err(|e| AppError::Custom(e.to_string()))?;

    *watcher.0.lock().unwrap() = Some(new_watcher);
    Ok(fs::read_to_string(&review_path)?)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn temp_dir(name: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!("revu-test-{}-{}", name, std::process::id()));
        fs::create_dir_all(&dir).unwrap();
        fs::canonicalize(dir).unwrap()
    }

    fn touch(path: &Path) -> String {
        fs::create_dir_all(path.parent().unwrap()).unwrap();
        fs::write(path, "").unwrap();
        path.to_string_lossy().to_string()
    }

    #[test]
    fn accepts_a_review_directly_inside_revu_dir() {
        let revu_dir = temp_dir("accepts");
        let review = touch(&revu_dir.join("repo-1.md"));

        assert_eq!(
            resolve_review_path(&revu_dir, &review).unwrap(),
            revu_dir.join("repo-1.md")
        );
    }

    #[test]
    fn rejects_a_file_outside_revu_dir() {
        let revu_dir = temp_dir("outside");
        let other = touch(&temp_dir("outside-other").join("secret.md"));

        assert!(resolve_review_path(&revu_dir, &other).is_err());
    }

    #[test]
    fn rejects_a_path_that_climbs_out_of_revu_dir() {
        let revu_dir = temp_dir("climbs");
        touch(&temp_dir("climbs-other").join("secret.md"));
        let escape = revu_dir.join("..").join(format!(
            "revu-test-climbs-other-{}/secret.md",
            std::process::id()
        ));

        assert!(resolve_review_path(&revu_dir, &escape.to_string_lossy()).is_err());
    }

    #[test]
    fn rejects_a_file_in_a_subfolder() {
        let revu_dir = temp_dir("subfolder");
        let nested = touch(&revu_dir.join("nested").join("repo-1.md"));

        assert!(resolve_review_path(&revu_dir, &nested).is_err());
    }
}
