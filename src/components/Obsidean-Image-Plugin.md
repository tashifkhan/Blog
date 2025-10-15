---
title: "Auto-Upload Images to the Cloud: A Complete Guide for Obsidian Power Users"
date: 2025-10-03
author: "Tashif Ahmad Khan"
socials:
  [
    "https://www.github.com/tashifkhan",
    "https://www.linkedin.com/in/tashif-ahmad-khan-982304244/",
    "https://tashif.codes",
  ]
tags: ["Obsidean", "Nextcloud", "Github Pages", "Self Hosting"]
excerpt: "How to automatically host your Obsidian images online using GitHub Pages or Nextcloud, with a custom plugin implementation*"
---

_How to automatically host your Obsidian images online using GitHub Pages or Nextcloud, with a custom plugin implementation_

---

## The Problem: Heavy Vaults and Sync Nightmares

If you're an Obsidian power user, you've probably experienced this: your vault starts as a lightweight collection of markdown files, but over time, it balloons to gigabytes. Screenshots, diagrams, photos—they all add up. Syncing becomes slow, backups take forever, and your elegant knowledge base feels bloated.

The traditional approach embeds images directly in your vault:

```markdown
![[assets/my-diagram.png]]
```

This works, but every image lives in your vault folder. If you're syncing across devices (laptop, desktop, mobile), you're moving massive files repeatedly. And if you want to share notes? You're sending huge attachments or broken links.

**What if your images could live online instead?**

Instead of storing the actual image file in your vault, you store only a lightweight URL reference:

```markdown
![Architecture Diagram](https://user.github.io/assets/img/2025/10/diagram.png)
```

Your notes remain lean. Your images load from a reliable host. Your vault syncs in seconds.

This guide shows you how to build this workflow using two approaches: **GitHub Pages** (free, public hosting) and **Nextcloud** (private, self-hosted). We'll also build a custom Obsidian plugin that automates the entire upload-and-embed process.

---

## Why This Workflow Matters

### Benefits of Cloud-Hosted Images

**Vault Performance**

- Smaller vault size = faster sync
- Git-based vaults don't choke on binary files
- Mobile apps load faster

**Accessibility**

- Share notes without worrying about broken image paths
- Publish notes to the web with working images
- Access images from any device with internet

**Organization**

- Centralized image management
- Version control for assets (if using Git)
- Easy bulk operations (compress, convert, rename)

### Use Cases

- **Students**: Keep lecture notes lightweight while embedding diagrams and screenshots
- **Developers**: Document projects with architecture diagrams hosted alongside code
- **Researchers**: Maintain portable literature notes with embedded figures
- **Content Creators**: Draft blog posts in Obsidian with images already hosted

---

## Solution Overview: Two Paths Forward

### Path 1: GitHub Pages (Free, Public, CDN-Backed)

**Best for:**

- Public documentation, wikis, or blogs
- Users comfortable with Git workflows
- Those wanting zero-cost, zero-maintenance hosting

**Trade-offs:**

- Images are public (anyone with the URL can access them)
- Requires a GitHub account
- 1GB repository size limit (plenty for most users)

### Path 2: Nextcloud (Private, Self-Hosted, Full Control)

**Best for:**

- Private notes with sensitive images
- Users already running a home server or NAS
- Those wanting complete data ownership

**Trade-offs:**

- Requires server setup and maintenance
- Potentially slower than CDN-backed options
- Must manage your own backups and uptime

---

## Part 1: GitHub Pages Implementation

GitHub Pages turns any repository into a static website. We'll use this to host our images at a predictable URL structure.

### Step 1: Repository Setup

Create a dedicated repository for your assets:

```bash
# On GitHub, create a new public repo: obsidian-assets
# Clone it locally
git clone https://github.com/<username>/obsidian-assets.git
cd obsidian-assets

# Create image directory structure
mkdir -p img/2025/10
echo "# Obsidian Assets" > README.md
git add .
git commit -m "Initial setup"
git push
```

### Step 2: Enable GitHub Pages

1. Navigate to your repo on GitHub
2. Go to **Settings → Pages**
3. Under "Source", select **Deploy from branch**
4. Choose **main** branch and **/ (root)** folder
5. Click **Save**

After a few minutes, your site will be live at:

```
https://<username>.github.io/obsidian-assets/
```

### Step 3: Organize Your Image Structure

A good folder structure makes management easier:

```
obsidian-assets/
├── img/
│   ├── 2025/
│   │   ├── 10/
│   │   │   ├── diagram-architecture.png
│   │   │   └── screenshot-ui.png
│   │   └── 11/
│   └── 2024/
├── README.md
└── .gitignore
```

The year/month structure keeps things organized and prevents one folder from having thousands of files.

### Step 4: Upload and Embed

Manual workflow:

```bash
# Add an image
cp ~/Pictures/new-diagram.png img/2025/10/
git add img/2025/10/new-diagram.png
git commit -m "Add architecture diagram"
git push

# Get the URL
# Format: https://<username>.github.io/obsidian-assets/img/YYYY/MM/filename.png
```

In your Obsidian note:

```markdown
![System Architecture](https://username.github.io/obsidian-assets/img/2025/10/new-diagram.png)
```

### Step 5: Automation Script (Python)

Manual git commits for every image get tedious. Here's a Python script that automates the process:

```python
#!/usr/bin/env python3
import sys
import os
import subprocess
from datetime import datetime
from pathlib import Path

# Configuration
REPO_PATH = Path.home() / "obsidian-assets"
IMG_BASE = "img"
USERNAME = "your-github-username"
REPO_NAME = "obsidian-assets"

def sanitize_filename(name):
    """Remove special characters from filename"""
    return "".join(c if c.isalnum() or c in ".-_" else "_" for c in name)

def upload_image(image_path):
    """Upload image to GitHub Pages repo and return URL"""
    image_path = Path(image_path).resolve()

    if not image_path.exists():
        print(f"Error: {image_path} does not exist")
        sys.exit(1)

    # Create date-based path
    now = datetime.now()
    year = now.strftime("%Y")
    month = now.strftime("%m")

    dest_dir = REPO_PATH / IMG_BASE / year / month
    dest_dir.mkdir(parents=True, exist_ok=True)

    # Sanitize filename
    safe_name = sanitize_filename(image_path.name)
    dest_path = dest_dir / safe_name

    # Copy file
    subprocess.run(["cp", str(image_path), str(dest_path)], check=True)

    # Git operations
    os.chdir(REPO_PATH)
    rel_path = dest_path.relative_to(REPO_PATH)

    subprocess.run(["git", "add", str(rel_path)], check=True)
    subprocess.run(
        ["git", "commit", "-m", f"Add {safe_name}"],
        check=True
    )
    subprocess.run(["git", "push"], check=True)

    # Generate URL
    url = f"https://{USERNAME}.github.io/{REPO_NAME}/{IMG_BASE}/{year}/{month}/{safe_name}"

    # Generate markdown
    markdown = f"![]({url})"

    print(f"\nUploaded successfully!")
    print(f"URL: {url}")
    print(f"\nMarkdown (copied to clipboard):\n{markdown}")

    # Copy to clipboard (macOS)
    subprocess.run("pbcopy", text=True, input=markdown)

    return url

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: upload_image.py <path-to-image>")
        sys.exit(1)

    upload_image(sys.argv[1])
```

Save this as `upload_image.py`, make it executable, and use it:

```bash
chmod +x upload_image.py
./upload_image.py ~/Pictures/my-diagram.png
# Output: Markdown link copied to clipboard
# Paste directly into Obsidian
```

### Bash Alternative (Lighter Weight)

If you prefer bash:

```bash
#!/bin/bash
set -e

REPO_PATH="$HOME/obsidian-assets"
USERNAME="your-github-username"
REPO_NAME="obsidian-assets"

IMAGE_PATH="$1"
FILENAME=$(basename "$IMAGE_PATH")
YEAR=$(date +%Y)
MONTH=$(date +%m)

DEST_DIR="$REPO_PATH/img/$YEAR/$MONTH"
mkdir -p "$DEST_DIR"

cp "$IMAGE_PATH" "$DEST_DIR/$FILENAME"

cd "$REPO_PATH"
git add "img/$YEAR/$MONTH/$FILENAME"
git commit -m "Add $FILENAME"
git push

URL="https://$USERNAME.github.io/$REPO_NAME/img/$YEAR/$MONTH/$FILENAME"
MARKDOWN="![]($URL)"

echo "$MARKDOWN" | pbcopy
echo "Uploaded: $URL"
echo "Markdown copied to clipboard"
```

### Keyboard Shortcut Integration

On macOS, use **Automator** to create a Quick Action:

1. Open Automator → New → Quick Action
2. Add "Run Shell Script"
3. Paste your script path: `/path/to/upload_image.py "$1"`
4. Save as "Upload to GitHub Pages"

Now you can right-click any image file → Quick Actions → Upload to GitHub Pages.

On Linux, create a custom keyboard shortcut that calls your script with the currently selected file.

---

## Part 2: Nextcloud Implementation

Nextcloud is a self-hosted cloud platform—think Dropbox, but you own the server. It's perfect for keeping images private while still getting cloud convenience.

### Step 1: Install Nextcloud

**Option A: Docker (Recommended)**

```bash
docker run -d \
  --name nextcloud \
  -p 8080:80 \
  -v nextcloud_data:/var/www/html \
  -v nextcloud_db:/var/lib/mysql \
  -e MYSQL_ROOT_PASSWORD=secure_password \
  -e MYSQL_DATABASE=nextcloud \
  -e MYSQL_USER=nextcloud \
  -e MYSQL_PASSWORD=nextcloud_password \
  nextcloud:latest
```

Access at `http://localhost:8080` and complete setup.

**Option B: Snap (Ubuntu/Debian)**

```bash
sudo snap install nextcloud
```

**Option C: Manual Install**

Follow the [official installation guide](https://docs.nextcloud.com/server/latest/admin_manual/installation/) for your platform.

### Step 2: Configure Nextcloud

1. Create an admin account during first setup
2. Install the **Desktop Client** from [nextcloud.com/install](https://nextcloud.com/install)
3. In the web UI, create a folder: `obsidian_images`

### Step 3: Sync Setup

Using the desktop client:

1. **Add Account** → enter your Nextcloud URL
2. Configure sync folder:
   - Remote: `/obsidian_images`
   - Local: choose a folder (e.g., `~/Nextcloud/obsidian_images`)
3. Enable **Sync automatically**

### Step 4: WebDAV Access for Automation

Nextcloud exposes files via WebDAV, allowing programmatic uploads.

**WebDAV URL format:**

```
https://your-nextcloud.com/remote.php/dav/files/<username>/obsidian_images/
```

**Create an App Password:**

1. Nextcloud Settings → Security
2. Scroll to "Devices & sessions"
3. Create new app password → name it "Obsidian Uploader"
4. Save the generated password

### Step 5: Python Upload Script

```python
#!/usr/bin/env python3
import sys
import requests
from pathlib import Path
from datetime import datetime

# Configuration
NEXTCLOUD_URL = "https://your-nextcloud.com"
USERNAME = "your-username"
APP_PASSWORD = "your-app-password"
BASE_PATH = "obsidian_images"

def upload_to_nextcloud(image_path):
    """Upload image via WebDAV and return public share link"""
    image_path = Path(image_path).resolve()

    if not image_path.exists():
        print(f"Error: {image_path} does not exist")
        sys.exit(1)

    # Create date-based path
    now = datetime.now()
    year = now.strftime("%Y")
    month = now.strftime("%m")

    filename = image_path.name
    remote_path = f"{BASE_PATH}/{year}/{month}/{filename}"

    # Ensure directory exists (create parent folders)
    dav_url = f"{NEXTCLOUD_URL}/remote.php/dav/files/{USERNAME}/{remote_path}"

    with open(image_path, "rb") as f:
        response = requests.put(
            dav_url,
            auth=(USERNAME, APP_PASSWORD),
            data=f,
            headers={"Content-Type": "application/octet-stream"}
        )

    if response.status_code not in (201, 204):
        print(f"Upload failed: {response.status_code}")
        print(response.text)
        sys.exit(1)

    print(f"Uploaded to: {remote_path}")

    # Create public share link via OCS API
    share_url = f"{NEXTCLOUD_URL}/ocs/v2.php/apps/files_sharing/api/v1/shares"

    share_data = {
        "path": f"/{remote_path}",
        "shareType": 3,  # Public link
        "permissions": 1  # Read only
    }

    share_response = requests.post(
        share_url,
        auth=(USERNAME, APP_PASSWORD),
        headers={"OCS-APIRequest": "true"},
        data=share_data
    )

    if share_response.status_code == 200:
        import xml.etree.ElementTree as ET
        root = ET.fromstring(share_response.text)
        share_link = root.find(".//url").text

        # Convert share link to direct download
        direct_url = share_link.replace("/s/", "/s/") + "/download"

        markdown = f"![]({direct_url})"
        print(f"\nPublic URL: {direct_url}")
        print(f"Markdown:\n{markdown}")

        # Copy to clipboard
        import subprocess
        subprocess.run("pbcopy", text=True, input=markdown)

        return direct_url
    else:
        print("Warning: Could not create share link")
        # Fallback to WebDAV direct access (requires auth)
        fallback_url = dav_url
        print(f"Direct WebDAV URL: {fallback_url}")
        return fallback_url

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: upload_nextcloud.py <path-to-image>")
        sys.exit(1)

    upload_to_nextcloud(sys.argv[1])
```

### Step 6: Automated Sync Workflow

For a simpler approach without scripting:

1. Save screenshots/images directly to `~/Nextcloud/obsidian_images/`
2. Nextcloud client auto-syncs them
3. Right-click the file in Nextcloud web UI → **Share** → **Share link**
4. Copy the share link and append `/download` for direct access
5. Embed in Obsidian: `![](https://nextcloud.com/s/abc123/download)`

**Pro tip:** Set up a screenshot tool (like Flameshot on Linux or Shottr on macOS) to save directly to your Nextcloud sync folder.

---

## Part 3: Building a Custom Obsidian Plugin

For ultimate automation, we'll build an Obsidian plugin that intercepts paste events, uploads images automatically, and replaces the clipboard content with a hosted URL.

### Why Build a Custom Plugin?

**Existing solutions:**

- **Image Auto Upload Plugin** works well but may not support your exact workflow
- Generic plugins lack customization for your specific hosting setup
- You want tighter control over paths, naming, and metadata

**Our plugin will:**

- Detect when you paste an image
- Upload it to your GitHub Pages repo or Nextcloud
- Replace the pasted content with `![](hosted-url)`
- Organize files by date automatically
- Handle errors gracefully

### Prerequisites

```bash
# Install Node.js 18+
# Clone the Obsidian sample plugin
git clone https://github.com/obsidianmd/obsidian-sample-plugin.git gh-image-uploader
cd gh-image-uploader

# Install dependencies
npm install
```

### Plugin Architecture

```
gh-image-uploader/
├── main.ts          # Plugin logic
├── manifest.json    # Plugin metadata
├── package.json     # NPM dependencies
├── tsconfig.json    # TypeScript config
└── styles.css       # Optional styling
```

### manifest.json

```json
{
	"id": "gh-pages-image-uploader",
	"name": "GitHub Pages Image Uploader",
	"version": "1.0.0",
	"minAppVersion": "1.5.0",
	"description": "Auto-upload pasted images to GitHub Pages and embed hosted URLs",
	"author": "Your Name",
	"authorUrl": "https://your-site.com",
	"isDesktopOnly": true
}
```

### package.json

```json
{
	"name": "gh-pages-image-uploader",
	"version": "1.0.0",
	"description": "Upload images to GitHub Pages automatically",
	"main": "main.js",
	"scripts": {
		"dev": "esbuild main.ts --bundle --target=es2020 --outfile=main.js --format=cjs --external:obsidian --watch",
		"build": "esbuild main.ts --bundle --target=es2020 --minify --outfile=main.js --format=cjs --external:obsidian"
	},
	"keywords": ["obsidian", "plugin", "images", "github"],
	"author": "Your Name",
	"license": "MIT",
	"devDependencies": {
		"@types/node": "^20.11.30",
		"esbuild": "^0.21.5",
		"obsidian": "latest",
		"typescript": "^5.4.5"
	}
}
```

### tsconfig.json

```json
{
	"compilerOptions": {
		"baseUrl": ".",
		"inlineSourceMap": true,
		"inlineSources": true,
		"module": "ESNext",
		"target": "ES2020",
		"moduleResolution": "Bundler",
		"allowJs": true,
		"noImplicitAny": true,
		"strict": true,
		"types": ["node", "obsidian"],
		"lib": ["ES2020", "DOM"]
	},
	"include": ["**/*.ts"]
}
```

### main.ts (Complete Plugin Implementation)

```typescript
import {
	App,
	Editor,
	MarkdownView,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";

interface UploadSettings {
	githubToken: string;
	repo: string; // format: username/repo-name
	branch: string;
	basePath: string; // e.g., "img"
	urlBase: string; // e.g., https://username.github.io/repo-name
	prependDatePath: boolean; // use img/YYYY/MM structure
	commitMessage: string;
	autoInsertMarkdown: boolean;
}

const DEFAULT_SETTINGS: UploadSettings = {
	githubToken: "",
	repo: "",
	branch: "main",
	basePath: "img",
	urlBase: "",
	prependDatePath: true,
	commitMessage: "chore: add image from Obsidian",
	autoInsertMarkdown: true,
};

export default class GhPagesImageUploader extends Plugin {
	settings: UploadSettings;

	async onload() {
		await this.loadSettings();

		// Add settings tab
		this.addSettingTab(new UploadSettingTab(this.app, this));

		// Register paste event handler
		this.registerEvent(
			this.app.workspace.on("editor-paste", async (evt, editor) => {
				await this.handlePaste(evt, editor);
			})
		);

		// Add command for manual upload
		this.addCommand({
			id: "upload-current-image",
			name: "Upload selected image to GitHub Pages",
			editorCallback: async (editor: Editor) => {
				new Notice("Manual upload not yet implemented");
			},
		});

		console.log("GitHub Pages Image Uploader loaded");
	}

	onunload() {
		console.log("GitHub Pages Image Uploader unloaded");
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private async handlePaste(evt: ClipboardEvent, editor: Editor) {
		// Check if clipboard contains an image
		if (!evt.clipboardData) return;

		const items = evt.clipboardData.items;
		let imageItem: DataTransferItem | null = null;

		for (let i = 0; i < items.length; i++) {
			if (items[i].kind === "file" && items[i].type.startsWith("image/")) {
				imageItem = items[i];
				break;
			}
		}

		if (!imageItem) return;

		// Validate settings
		if (!this.validateSettings()) {
			new Notice("Please configure GitHub Pages settings first", 5000);
			return;
		}

		// Prevent default paste behavior
		evt.preventDefault();

		const file = imageItem.getAsFile();
		if (!file) return;

		new Notice("Uploading image...", 2000);

		try {
			const url = await this.uploadImage(file);

			if (this.settings.autoInsertMarkdown) {
				const markdown = `![](${url})`;
				editor.replaceSelection(markdown);
				new Notice("Image uploaded and embedded!", 3000);
			} else {
				await navigator.clipboard.writeText(url);
				new Notice("Image URL copied to clipboard", 3000);
			}
		} catch (error) {
			console.error("Upload failed:", error);
			new Notice(`Upload failed: ${error.message}`, 5000);
		}
	}

	private validateSettings(): boolean {
		return !!(
			this.settings.githubToken &&
			this.settings.repo &&
			this.settings.urlBase
		);
	}

	private async uploadImage(file: File): Promise<string> {
		// Read file as array buffer
		const arrayBuffer = await file.arrayBuffer();
		const bytes = new Uint8Array(arrayBuffer);

		// Generate path
		const filename = this.sanitizeFilename(
			file.name || `pasted-${Date.now()}.png`
		);
		const path = this.generatePath(filename);

		// Upload via GitHub API
		const url = await this.uploadToGitHub(bytes, path);

		return url;
	}

	private sanitizeFilename(name: string): string {
		// Remove or replace problematic characters
		return name
			.replace(/[^\w\s.-]/g, "_")
			.replace(/\s+/g, "-")
			.toLowerCase();
	}

	private generatePath(filename: string): string {
		if (this.settings.prependDatePath) {
			const now = new Date();
			const year = now.getUTCFullYear();
			const month = String(now.getUTCMonth() + 1).padStart(2, "0");
			return `${this.settings.basePath}/${year}/${month}/${filename}`;
		}
		return `${this.settings.basePath}/${filename}`;
	}

	private async uploadToGitHub(
		bytes: Uint8Array,
		path: string
	): Promise<string> {
		const { githubToken, repo, branch, commitMessage, urlBase } = this.settings;

		// Convert to base64
		const base64Content = this.arrayBufferToBase64(bytes);

		// GitHub Contents API endpoint
		const apiUrl = `https://api.github.com/repos/${repo}/contents/${encodeURIComponent(
			path
		)}`;

		// Prepare request body
		const body = {
			message: commitMessage,
			content: base64Content,
			branch: branch,
		};

		// Make API request
		const response = await fetch(apiUrl, {
			method: "PUT",
			headers: {
				Authorization: `Bearer ${githubToken}`,
				Accept: "application/vnd.github+json",
				"Content-Type": "application/json",
			},
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`GitHub API error (${response.status}): ${errorText}`);
		}

		// Construct public URL
		const publicUrl = `${urlBase.replace(/\/$/, "")}/${path}`;

		return publicUrl;
	}

	private arrayBufferToBase64(buffer: Uint8Array): string {
		let binary = "";
		const chunkSize = 0x8000; // Process in chunks to avoid stack overflow

		for (let i = 0; i < buffer.length; i += chunkSize) {
			const chunk = buffer.subarray(i, i + chunkSize);
			binary += String.fromCharCode.apply(null, Array.from(chunk));
		}

		return btoa(binary);
	}
}

class UploadSettingTab extends PluginSettingTab {
	plugin: GhPagesImageUploader;

	constructor(app: App, plugin: GhPagesImageUploader) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("h2", { text: "GitHub Pages Image Uploader" });

		containerEl.createEl("p", {
			text: "Configure automatic image uploads to your GitHub Pages repository.",
		});

		// GitHub Token
		new Setting(containerEl)
			.setName("GitHub Personal Access Token")
			.setDesc(
				"Create a fine-grained token with 'Contents: Read and Write' permission"
			)
			.addText((text) =>
				text
					.setPlaceholder("ghp_xxxxxxxxxxxx")
					.setValue(this.plugin.settings.githubToken)
					.onChange(async (value) => {
						this.plugin.settings.githubToken = value.trim();
						await this.plugin.saveSettings();
					})
			);

		// Repository
		new Setting(containerEl)
			.setName("Repository")
			.setDesc("Format: username/repository (e.g., john/obsidian-assets)")
			.addText((text) =>
				text
					.setPlaceholder("username/repo-name")
					.setValue(this.plugin.settings.repo)
					.onChange(async (value) => {
						this.plugin.settings.repo = value.trim();
						await this.plugin.saveSettings();
					})
			);

		// Branch
		new Setting(containerEl)
			.setName("Branch")
			.setDesc("Target branch (usually 'main' or 'gh-pages')")
			.addText((text) =>
				text.setValue(this.plugin.settings.branch).onChange(async (value) => {
					this.plugin.settings.branch = value.trim() || "main";
					await this.plugin.saveSettings();
				})
			);

		// Base Path
		new Setting(containerEl)
			.setName("Base path in repository")
			.setDesc("Folder inside repo where images are stored (e.g., 'img')")
			.addText((text) =>
				text.setValue(this.plugin.settings.basePath).onChange(async (value) => {
					this.plugin.settings.basePath =
						value.replace(/^\/+|\/+$/g, "") || "img";
					await this.plugin.saveSettings();
				})
			);

		// URL Base
		new Setting(containerEl)
			.setName("GitHub Pages URL")
			.setDesc(
				"Your Pages base URL (e.g., https://username.github.io/repo-name)"
			)
			.addText((text) =>
				text
					.setPlaceholder("https://username.github.io/repo-name")
					.setValue(this.plugin.settings.urlBase)
					.onChange(async (value) => {
						this.plugin.settings.urlBase = value.trim();
						await this.plugin.saveSettings();
					})
			);

		// Date Path Toggle
		new Setting(containerEl)
			.setName("Use date-based folders")
			.setDesc("Organize images in YYYY/MM subfolders")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.prependDatePath)
					.onChange(async (value) => {
						this.plugin.settings.prependDatePath = value;
						await this.plugin.saveSettings();
					})
			);

		// Commit Message
		new Setting(containerEl)
			.setName("Commit message")
			.setDesc("Message used for GitHub commits")
			.addText((text) =>
				text
					.setValue(this.plugin.settings.commitMessage)
					.onChange(async (value) => {
						this.plugin.settings.commitMessage =
							value || DEFAULT_SETTINGS.commitMessage;
						await this.plugin.saveSettings();
					})
			);

		// Auto Insert Toggle
		new Setting(containerEl)
			.setName("Auto-insert markdown")
			.setDesc(
				"Automatically insert ![](url) at cursor; if off, copy URL to clipboard"
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.autoInsertMarkdown)
					.onChange(async (value) => {
						this.plugin.settings.autoInsertMarkdown = value;
						await this.plugin.saveSettings();
					})
			);

		// Instructions section
		containerEl.createEl("h3", { text: "Setup Instructions" });

		const instructions = containerEl.createEl("ol");
		instructions.createEl("li", {
			text: "Create a GitHub Personal Access Token at github.com/settings/tokens",
		});
		instructions.createEl("li", {
			text: "Grant 'Contents: Read and Write' permission for your target repository",
		});
		instructions.createEl("li", {
			text: "Enable GitHub Pages for your repository (Settings → Pages)",
		});
		instructions.createEl("li", {
			text: "Fill in the settings above and start pasting images!",
		});
	}
}
```

### Building and Installing the Plugin

```bash
# In your plugin directory
npm install
npm run build

# Create plugin folder in your vault
mkdir -p /path/to/vault/.obsidian/plugins/gh-pages-image-uploader

# Copy files
cp main.js manifest.json /path/to/vault/.obsidian/plugins/gh-pages-image-uploader/
touch /path/to/vault/.obsidian/plugins/gh-pages-image-uploader/styles.css
```

### Configuring the Plugin

1. Open Obsidian
2. Settings → Community Plugins → Turn off "Restricted Mode" (if enabled)
3. Reload plugins
4. Enable "GitHub Pages Image Uploader"
5. Click the gear icon to configure:
   - **GitHub Token**: Your fine-grained PAT
   - **Repository**: `username/obsidian-assets`
   - **Branch**: `main`
   - **Base path**: `img`
   - **GitHub Pages URL**: `https://username.github.io/obsidian-assets`
   - **Use date-based folders**: ON (recommended)

### Testing the Plugin

1. Open a note in Obsidian
2. Take a screenshot (or copy any image to clipboard)
3. Paste into the note (\`Cmd+V\` or \`Ctrl+V\`)
4. The plugin will:
   - Intercept the paste
   - Upload to GitHub
   - Replace with `![](https://username.github.io/...)`
5. The image appears immediately in your note

### Troubleshooting

**Error: "GitHub API error (404)"**

- Check that your repository name is correct
- Ensure the PAT has access to the repository
- Verify the repository is public or your PAT has private repo access

**Error: "Upload failed: Network error"**

- Check your internet connection
- Verify GitHub is accessible (check github.com/status)
- Try regenerating your PAT

**Images not displaying**

- Wait a few minutes for GitHub Pages to deploy
- Check that Pages is enabled and deploying from the correct branch
- Verify the URL format matches your Pages domain

---

## Part 4: Advanced Customizations

### Multi-Provider Support

You can extend the plugin to support both GitHub and Nextcloud:

```typescript
interface UploadProvider {
	name: string;
	upload(bytes: Uint8Array, path: string): Promise<string>;
}

class GitHubProvider implements UploadProvider {
	name = "GitHub Pages";

	async upload(bytes: Uint8Array, path: string): Promise<string> {
		// Implementation from above
	}
}

class NextcloudProvider implements UploadProvider {
	name = "Nextcloud";

	async upload(bytes: Uint8Array, path: string): Promise<string> {
		// WebDAV PUT implementation
	}
}
```

### Image Optimization

Add automatic image compression before upload:

```typescript
private async optimizeImage(bytes: Uint8Array): Promise<Uint8Array> {
  // Use canvas API to resize/compress
  const blob = new Blob([bytes]);
  const bitmap = await createImageBitmap(blob);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  // Resize if too large
  const maxWidth = 1920;
  const maxHeight = 1080;

  let width = bitmap.width;
  let height = bitmap.height;

  if (width > maxWidth) {
    height = (height * maxWidth) / width;
    width = maxWidth;
  }

  if (height > maxHeight) {
    width = (width * maxHeight) / height;
    height = maxHeight;
  }

  canvas.width = width;
  canvas.height = height;
  ctx?.drawImage(bitmap, 0, 0, width, height);

  // Convert to blob with compression
  const compressedBlob = await new Promise<Blob>((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob!),
      "image/jpeg",
      0.85 // Quality
    );
  });

  return new Uint8Array(await compressedBlob.arrayBuffer());
}
```

### Batch Upload

Add a command to upload all local images in the current note:

```typescript
this.addCommand({
	id: "upload-all-images",
	name: "Upload all local images in current note",
	editorCallback: async (editor: Editor, view: MarkdownView) => {
		const content = editor.getValue();
		const imageRegex = /!\[\[([^\]]+\.(png|jpg|jpeg|gif|webp))\]\]/gi;
		const matches = [...content.matchAll(imageRegex)];

		if (matches.length === 0) {
			new Notice("No local images found");
			return;
		}

		new Notice(`Found ${matches.length} images. Uploading...`);

		for (const match of matches) {
			const localPath = match[1];
			// Read file, upload, replace in content
		}
	},
});
```

---

## Part 5: Comparison and Recommendations

### Decision Matrix

| Criteria          | GitHub Pages                       | Nextcloud                                        |
| ----------------- | ---------------------------------- | ------------------------------------------------ |
| **Setup Time**    | 15 minutes                         | 1-2 hours                                        |
| **Cost**          | Free                               | Server costs ($5-20/mo VPS or existing hardware) |
| **Privacy**       | Public only                        | Private by default                               |
| **Speed**         | Fast (CDN)                         | Varies (local network = fast, internet = slower) |
| **Reliability**   | Very high (99.9%+)                 | Depends on your setup                            |
| **Storage Limit** | 1GB per repo (soft limit)          | Only limited by your storage                     |
| **Maintenance**   | Zero                               | Requires updates, backups                        |
| **Best For**      | Public wikis, documentation, blogs | Personal notes, sensitive content                |

### My Recommendations

**For Students (You!):**

- **Start with GitHub Pages** if your images aren't sensitive
- Your notes are probably shareable (study materials, project docs)
- Zero cost, zero maintenance
- Great learning experience with Git workflows
- Easy to share notes with classmates

**For Professional Use:**

- **Nextcloud** if handling client data or proprietary information
- Keep everything under your control
- Can run on a home server or cheap VPS
- Better for compliance requirements

**Hybrid Approach:**

- Public images (diagrams, charts) → GitHub Pages
- Private screenshots (credentials, personal) → Nextcloud
- Use the plugin with provider selection based on image type

### Performance Considerations

**GitHub Pages:**

- CDN-backed (Fastly network)
- First load might be slow (cold cache)
- Subsequent loads are very fast
- Great for globally distributed access

**Nextcloud:**

- Local network: instant
- Internet access: depends on your upload speed
- Can be slow if on residential connection
- Consider a VPS if remote access is important

---

## Part 6: Production Tips

### Security Best Practices

**GitHub:**

- Use fine-grained PATs, not classic tokens
- Limit scope to specific repositories
- Set expiration dates on tokens
- Never commit tokens to Git (use `.env` files)
- Consider using SSH keys instead for CLI scripts

**Nextcloud:**

- Use app passwords, not your main password
- Enable 2FA on your Nextcloud account
- Use HTTPS with valid certificates (Let's Encrypt)
- Regular backups of your Nextcloud data directory
- Keep Nextcloud updated (security patches)

### Backup Strategies

**GitHub:**

- Already backed up (it's Git!)
- Clone your repo periodically for local backup
- Consider a second remote (GitLab, Gitea) for redundancy

**Nextcloud:**

- Automate database and data directory backups
- Use external backup solutions (Restic, Borg, rsync)
- Test restore procedures regularly
- Keep backups offsite (different physical location)

### Monitoring and Maintenance

**GitHub:**

- Set up GitHub Actions for automated checks
- Monitor repository size (approach 1GB? Time to archive old images)
- Watch for failed pushes in your upload script logs

**Nextcloud:**

- Monitor disk space usage
- Set up Nextcloud monitoring app
- Configure email alerts for system issues
- Plan for scaling (more users = more resources)

---

## Conclusion

You now have a complete system for hosting Obsidian images online, with three implementation paths:

1. **Manual GitHub Pages**: Simple, no coding required
2. **Automated Scripts**: Python/bash for command-line uploads
3. **Custom Plugin**: Seamless, one-paste workflow

### Next Steps

1. **Choose your hosting** (GitHub or Nextcloud based on privacy needs)
2. **Set up the infrastructure** (repo + Pages or Nextcloud server)
3. **Implement automation** (scripts or plugin)
4. **Test thoroughly** with non-critical notes first
5. **Iterate and customize** to match your workflow

### Going Further

- **Explore Cloudflare Pages or Netlify** for alternative hosting with custom domains
- **Add image metadata** (alt text, dimensions) automatically
- **Build a gallery view** for all your hosted images
- **Integrate with your blog** if you publish notes online
- **Create a mobile workflow** using Shortcuts (iOS) or Tasker (Android)

The beauty of this system is that your notes remain portable (just markdown text), while your images live in a scalable, reliable home. You get the best of both worlds: lightweight vaults and rich media content.

### Questions?

This workflow addresses a real pain point in knowledge management systems. Feel free to adapt these examples to your specific needs—whether that's using different cloud providers, adding more automation, or integrating with other tools in your stack.

---

_Meta: This guide was written for engineering students and tech enthusiasts who value both convenience and control. The complete plugin source code is provided under MIT license—use it, modify it, and share your improvements!_
