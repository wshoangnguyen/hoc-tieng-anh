import json, os, shutil
from pathlib import Path
from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from typing import List

app = FastAPI()
DATA_FILE = Path("data/scoreboard.json")
IMG_DIR = Path("data/img")

DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
IMG_DIR.mkdir(parents=True, exist_ok=True)

PASSWORD_HASH = "Vuiqua123!"
DEFAULT_DATA = {
    "teacherName": "",
    "teacherAvatar": "",
    "students": [],
    "lastWeekScores": {}
}

def load():
    try:
        if DATA_FILE.exists():
            with open(DATA_FILE) as f:
                return json.load(f)
    except: pass
    return json.loads(json.dumps(DEFAULT_DATA))

def save(data):
    with open(DATA_FILE + ".tmp", "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    os.replace(DATA_FILE + ".tmp", DATA_FILE)

class AuthRequest(BaseModel):
    password: str

class Student(BaseModel):
    id: str
    name: str

class ScoreUpdate(BaseModel):
    studentId: str
    delta: int

class LevelUpdate(BaseModel):
    studentId: str
    skill: str  # "writing" or "speaking"
    level: int
    delta: int

class FullData(BaseModel):
    data: dict

@app.post("/api/auth")
def auth(req: AuthRequest):
    if req.password == PASSWORD_HASH:
        return {"ok": True}
    raise HTTPException(401, "Sai mật khẩu")

@app.get("/api/data")
def get_data():
    return load()

@app.post("/api/save")
def save_full(payload: FullData):
    save(payload.data)
    return {"ok": True}

@app.post("/api/students")
def add_student(s: Student):
    d = load()
    if any(x["id"] == s.id for x in d["students"]):
        raise HTTPException(400, "ID existed")
    d["students"].append({"id": s.id, "name": s.name, "avatar": "",
        "totalScore": 0, "writing": [0,0,0,0,0], "speaking": [0,0,0,0,0],
        "lastWeekScore": 0})
    save(d)
    return {"ok": True}

@app.delete("/api/students/{sid}")
def del_student(sid: str):
    d = load()
    d["students"] = [x for x in d["students"] if x["id"] != sid]
    save(d)
    return {"ok": True}

@app.post("/api/score")
def update_score(u: ScoreUpdate):
    d = load()
    s = next((x for x in d["students"] if x["id"] == u.studentId), None)
    if s:
        s["totalScore"] = max(0, s["totalScore"] + u.delta)
        save(d)
    return {"ok": True}

@app.post("/api/level")
def update_level(u: LevelUpdate):
    d = load()
    s = next((x for x in d["students"] if x["id"] == u.studentId), None)
    if s:
        s[u.skill][u.level] = max(0, s[u.skill][u.level] + u.delta)
        save(d)
    return {"ok": True}

@app.post("/api/upload/{kind}")
async def upload_img(kind: str, file: UploadFile):
    content = await file.read()
    fname = f"{kind}_{file.filename or 'img'}"
    path = IMG_DIR / fname
    with open(path, "wb") as f:
        f.write(content)
    return {"url": f"/data/img/{fname}"}

@app.post("/api/rename")
def rename_student(sid: str, name: str):
    d = load()
    s = next((x for x in d["students"] if x["id"] == sid), None)
    if s:
        s["name"] = name
        save(d)
    return {"ok": True}

# Static files
app.mount("/data/img", StaticFiles(directory=IMG_DIR), name="img")

BASE_DIR = Path(__file__).parent

@app.get("/")
def index():
    return FileResponse(BASE_DIR / "scoreboard.html")

@app.get("/app.js")
def app_js():
    return FileResponse(BASE_DIR / "scoreboard.js")
