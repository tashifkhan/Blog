"""Vercel Python entrypoint for the modular FastAPI backend."""

from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
SERVER_DIR = ROOT / "server"

if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
if str(SERVER_DIR) not in sys.path:
    sys.path.insert(0, str(SERVER_DIR))

from server.main import app
