# Code Block Showcase

MD Editor supports syntax highlighting for over 100 programming languages via **highlight.js**.

---

## Python

```python
from dataclasses import dataclass
from typing import Optional

@dataclass
class Document:
    title: str
    content: str
    path: Optional[str] = None

    @property
    def word_count(self) -> int:
        return len(self.content.split())

doc = Document("Welcome", "Hello, **world**!")
print(f"{doc.title}: {doc.word_count} words")
```

## JavaScript / TypeScript

```typescript
interface MarkdownFile {
  path: string;
  content: string;
  isDirty: boolean;
}

async function saveDocument(file: MarkdownFile): Promise<void> {
  if (!file.isDirty) return;
  await fs.writeTextFile(file.path, file.content);
  console.log(`Saved: ${file.path}`);
}
```

## Rust

```rust
use std::fs;
use std::path::Path;

fn read_markdown(path: &Path) -> anyhow::Result<String> {
    let content = fs::read_to_string(path)?;
    println!("Loaded {} bytes from {:?}", content.len(), path);
    Ok(content)
}
```

## SQL

```sql
SELECT
    f.file_name,
    f.last_modified,
    COUNT(w.id) AS word_count
FROM files f
LEFT JOIN words w ON w.file_id = f.id
WHERE f.extension = 'md'
GROUP BY f.id
ORDER BY f.last_modified DESC
LIMIT 10;
```

## Bash

```bash
#!/bin/bash
# Build and release MD Editor
VERSION=$(cat package.json | jq -r '.version')

echo "Building v${VERSION}..."
npm run tauri build

echo "Creating release tag..."
git tag "v${VERSION}"
git push origin "v${VERSION}"
echo "Done! GitHub Actions will handle the rest."
```

## JSON

```json
{
  "name": "md-editor",
  "version": "1.0.5",
  "description": "A minimal Markdown editor built with Tauri",
  "keywords": ["markdown", "editor", "tauri", "desktop"],
  "repository": {
    "type": "git",
    "url": "https://github.com/rushabhpasad/md-editor"
  }
}
```

---

*Switch to Preview mode (⌘⇧P) to see the syntax highlighting in action!*
