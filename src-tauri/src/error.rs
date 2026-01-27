use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Git error: {0}")]
    Git(#[from] git2::Error),

    #[error("Repository not found: {0}")]
    RepoNotFound(String),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("{0}")]
    Custom(String),
}

impl serde::Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}
