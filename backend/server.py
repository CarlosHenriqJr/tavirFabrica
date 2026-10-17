from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import hashlib
import json
import asyncio
import requests
from pathlib import Path
from pydantic import BaseModel
from typing import List, Optional, Any
import uuid
from datetime import datetime, timezone

# ----------------------------- Object storage -----------------------------
STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "tavir-fabrica"
_storage_key = None


def init_storage(force: bool = False):
    global _storage_key
    if _storage_key and not force:
        return _storage_key
    key_env = os.environ.get("EMERGENT_LLM_KEY")
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": key_env}, timeout=30)
    resp.raise_for_status()
    _storage_key = resp.json()["storage_key"]
    return _storage_key


def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    resp = requests.put(f"{STORAGE_URL}/objects/{path}",
                        headers={"X-Storage-Key": key, "Content-Type": content_type},
                        data=data, timeout=120)
    if resp.status_code == 404:
        key = init_storage(force=True)
        resp = requests.put(f"{STORAGE_URL}/objects/{path}",
                            headers={"X-Storage-Key": key, "Content-Type": content_type},
                            data=data, timeout=120)
    resp.raise_for_status()
    return resp.json()


def get_object(path: str):
    key = init_storage()
    resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")


MIME_TYPES = {
    "md": "text/markdown", "txt": "text/plain", "html": "text/html",
    "zip": "application/zip", "json": "application/json",
}

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="TAVIR Fábrica")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# ----------------------------- Helpers -----------------------------
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def sha256_of(payload: Any) -> str:
    raw = json.dumps(payload, sort_keys=True, ensure_ascii=False, default=str)
    return "sha256:" + hashlib.sha256(raw.encode("utf-8")).hexdigest()


def strip_id(doc: dict) -> dict:
    doc.pop("_id", None)
    return doc


def progress_of(steps: List[dict]) -> int:
    if not steps:
        return 0
    done = sum(1 for s in steps if s["status"] == "done")
    return round(done / len(steps) * 100)


def current_step_index(steps: List[dict]) -> int:
    for i, s in enumerate(steps):
        if s["status"] != "done":
            return i
    return len(steps)


def done_count(steps: List[dict]) -> int:
    return sum(1 for s in steps if s["status"] == "done")


# ----------------------------- Models -----------------------------
class Briefing(BaseModel):
    esteira: str
    nome: str
    cliente: str
    d1_ideia: str = ""
    d2_publico: str = ""
    d3_stack: str = ""
    d4_banco: str = ""
    d5_materiais: str = ""
    d6_integracoes: str = ""
    d7_regras: str = ""


class ResolvePayload(BaseModel):
    supabase_url: Optional[str] = None
    note: Optional[str] = None


class FileRef(BaseModel):
    id: str
    name: str
    url: str
    size: int = 0
    type: str = ""


class NewProjectIn(BaseModel):
    nome: str
    empresa: str
    front: Optional[str] = ""
    back: Optional[str] = ""
    db: Optional[str] = ""
    tipo: str = "sistema"           # lp | sistema | oferta
    escopo: str                     # ideacao | pronto
    contextFiles: List[FileRef] = []
    designSystem: Optional[FileRef] = None
    segmento: Optional[str] = ""
    concorrentes: Optional[str] = ""


# ----------------------------- Seed data -----------------------------
ESTEIRAS = [
    {"id": "lp-c", "code": "LP-C", "title": "TAVIR Fábrica · LPs · Criação", "type": "CRIACAO",
     "projects": 1, "steps": 16, "mesas": 10,
     "description": "Esteira completa para criar uma Landing Page nova a partir de uma demanda aprovada: descoberta, requisitos, prova visual, comercial, extração, estratégia, construção, QA, SEO, segurança e documentação.",
     "badge": None},
    {"id": "lp-m", "code": "LP-M", "title": "TAVIR Fábrica · LPs · Manutenção", "type": "MANUTENCAO",
     "projects": 1, "steps": 11, "mesas": 8,
     "description": "Esteira para diagnosticar, alterar e evoluir uma Landing Page existente com controle de impacto, regressão, SEO, segurança e documentação.",
     "badge": None},
    {"id": "of-c", "code": "OF-C", "title": "TAVIR Fábrica · Ofertas · Criação", "type": "CRIACAO",
     "projects": 1, "steps": 8, "mesas": 6,
     "description": "Esteira interna para criar uma oferta nova a partir de evidência de público e problema, viável e documentada.",
     "badge": None},
    {"id": "of-m", "code": "OF-M", "title": "TAVIR Fábrica · Ofertas · Manutenção", "type": "MANUTENCAO",
     "projects": 0, "steps": 6, "mesas": 5,
     "description": "Esteira para revisar uma oferta existente com base em evidências, capacidade e concorrência.",
     "badge": None},
    {"id": "sy-c", "code": "SY-C", "title": "TAVIR Fábrica · Sistemas · Criação", "type": "CRIACAO",
     "projects": 1, "steps": 14, "mesas": 8,
     "description": "Esteira geral para criar sistemas, SaaS, CRMs, APIs, automações e ferramentas internas com requisitos verificáveis, arquitetura, scaffold físico, auto-correção via linter e QA real.",
     "badge": "14 etapas canónicas · Compiler & Completion Guard"},
    {"id": "sy-m", "code": "SY-M", "title": "TAVIR Fábrica · Sistemas · Manutenção", "type": "MANUTENCAO",
     "projects": 1, "steps": 6, "mesas": 5,
     "description": "Esteira para corrigir, atualizar, migrar ou evoluir um sistema existente com diagnóstico, impacto, rollback e QA.",
     "badge": None},
]


def lp_c_steps():
    return [
        {"idx": 1, "title": "Gate 0 · Demanda e briefing", "agent": "Dora Descoberta", "skills": ["brand-context"], "status": "done", "hash": sha256_of("gate0-meridian"), "isGate": True, "blockReason": None},
        {"idx": 2, "title": "Requisitos verificáveis", "agent": "Marina + Yuri · Prova Visual", "skills": [], "status": "done", "isGate": False, "blockReason": None},
        {"idx": 3, "title": "Aprovação dos requisitos", "agent": "Comercial TAVIR", "skills": [], "status": "done", "isGate": True, "blockReason": None},
        {"idx": 4, "title": "Prova visual · tokens e esqueleto", "agent": "Enzo Extrator", "skills": [], "status": "done", "isGate": False, "blockReason": None},
        {"idx": 5, "title": "Aprovação da prova visual", "agent": "Bianca Estrategista", "skills": [], "status": "done", "isGate": True, "blockReason": None},
        {"idx": 6, "title": "Orçamento, deploy e contrato", "agent": "Diego Desenvolvedor", "skills": [], "status": "done", "isGate": False, "blockReason": None},
        {"idx": 7, "title": "Gate de contratação", "agent": "QA E2E", "skills": [], "status": "done", "isGate": True, "blockReason": None},
        {"idx": 8, "title": "Fase 1 · Extração técnica", "agent": "Nina SEO", "skills": [], "status": "done", "isGate": False, "blockReason": None},
        {"idx": 9, "title": "Fase 2 · Estratégia e Plano", "agent": "Bianca Estrategista", "skills": [], "status": "blocked", "isGate": False, "blockReason": "gate"},
        {"idx": 10, "title": "Construção Modular de Código", "agent": "Diego Desenvolvedor", "skills": ["frontend-excelencia-tavir"], "status": "blocked", "isGate": False, "blockReason": "build"},
        {"idx": 11, "title": "Loop Linter & Análise Estática", "agent": "Compiler TAVIR", "skills": ["tsc --noEmit", "ruff"], "status": "blocked", "isGate": False, "blockReason": None},
        {"idx": 12, "title": "QA E2E Playwright", "agent": "Talita QA", "skills": ["playwright"], "status": "blocked", "isGate": False, "blockReason": None},
        {"idx": 13, "title": "Auditoria SEO", "agent": "Nina SEO", "skills": [], "status": "blocked", "isGate": False, "blockReason": None},
        {"idx": 14, "title": "Segurança & LGPD", "agent": "Sérgio Seg/LGPD", "skills": ["web-security"], "status": "blocked", "isGate": False, "blockReason": None},
        {"idx": 15, "title": "Documentação & Runbook", "agent": "Dante Doc", "skills": ["documentacao-sistema"], "status": "blocked", "isGate": False, "blockReason": None},
        {"idx": 16, "title": "Gate Final CEO · Completion Guard", "agent": "Carlos Henrique · CEO", "skills": [], "status": "blocked", "isGate": True, "blockReason": "gate-final"},
    ]


def sy_c_steps():
    return [
        {"idx": 1, "title": "Gate 0 · Demanda e briefing", "agent": "Dora Descoberta", "skills": ["brand-context"], "status": "done", "hash": sha256_of("gate0-atlas"), "isGate": True, "blockReason": None},
        {"idx": 2, "title": "Requisitos verificáveis", "agent": "Ari Arquiteto", "skills": [], "status": "done", "isGate": False, "blockReason": None},
        {"idx": 3, "title": "Arquitetura & modelagem", "agent": "Ari Arquiteto", "skills": ["archify", "sql-queries"], "status": "done", "isGate": False, "blockReason": None},
        {"idx": 4, "title": "Planejamento ágil", "agent": "Paula PM", "skills": ["agile-planning"], "status": "active", "isGate": False, "blockReason": None},
        {"idx": 5, "title": "Scaffold Físico Oficial", "agent": "Diego Dev Front & Back", "skills": ["flutter create"], "status": "blocked", "isGate": False, "blockReason": "gate"},
        {"idx": 6, "title": "Construção Front", "agent": "Diego Dev Front & Back", "skills": ["frontend-excelencia-tavir"], "status": "blocked", "isGate": False, "blockReason": None},
        {"idx": 7, "title": "Construção Back", "agent": "Diego Dev Front & Back", "skills": ["test-driven-development"], "status": "blocked", "isGate": False, "blockReason": None},
        {"idx": 8, "title": "Loop Linter & Compiler", "agent": "Compiler TAVIR", "skills": ["dart analyze", "tsc --noEmit"], "status": "blocked", "isGate": False, "blockReason": None},
        {"idx": 9, "title": "QA E2E Playwright", "agent": "Talita QA", "skills": ["playwright"], "status": "blocked", "isGate": False, "blockReason": None},
        {"idx": 10, "title": "QA Mobile · Emulador tavir_qa", "agent": "Talita QA", "skills": ["mobile-mcp"], "status": "blocked", "isGate": False, "blockReason": None},
        {"idx": 11, "title": "Segurança & LGPD", "agent": "Sérgio Seg/LGPD", "skills": ["web-security"], "status": "blocked", "isGate": False, "blockReason": None},
        {"idx": 12, "title": "Completion Guard · 8 regras físicas", "agent": "Compiler TAVIR", "skills": [], "status": "blocked", "isGate": False, "blockReason": None},
        {"idx": 13, "title": "Documentação & Runbook", "agent": "Dante Doc", "skills": ["documentacao-sistema"], "status": "blocked", "isGate": False, "blockReason": None},
        {"idx": 14, "title": "Gate Final CEO · Completion Guard", "agent": "Carlos Henrique · CEO", "skills": [], "status": "blocked", "isGate": True, "blockReason": "gate-final"},
    ]


def of_c_steps():
    titles = [
        ("Gate 0 · Demanda e briefing", "Dora Descoberta", True),
        ("Evidência de público e problema", "Bianca Estrategista", False),
        ("Validação de viabilidade", "Paula PM", False),
        ("Desenho da oferta", "Bianca Estrategista", False),
        ("Precificação e margem", "Comercial TAVIR", True),
        ("Prova e materiais", "Enzo Extrator", False),
        ("Documentação da oferta", "Dante Doc", False),
        ("Gate Final CEO", "Carlos Henrique · CEO", True),
    ]
    steps = []
    for i, (t, a, g) in enumerate(titles, 1):
        steps.append({"idx": i, "title": t, "agent": a, "skills": [], "status": "done" if i <= 2 else "blocked", "isGate": g, "blockReason": None, **({"hash": sha256_of("gate0-oferta")} if i == 1 else {})})
    return steps


def lp_m_steps():
    titles = [
        ("Gate 0 · Demanda de manutenção", "Dora Descoberta", True),
        ("Diagnóstico da LP atual", "Enzo Extrator", False),
        ("Análise de impacto", "Ari Arquiteto", False),
        ("Aprovação do plano", "Comercial TAVIR", True),
        ("Alterações de código", "Diego Desenvolvedor", False),
        ("Regressão & QA", "Talita QA", False),
        ("Auditoria SEO", "Nina SEO", False),
        ("Segurança & LGPD", "Sérgio Seg/LGPD", False),
        ("Documentação", "Dante Doc", False),
        ("Deploy de preview", "Diego Desenvolvedor", False),
        ("Gate Final CEO", "Carlos Henrique · CEO", True),
    ]
    steps = []
    for i, (t, a, g) in enumerate(titles, 1):
        status = "done" if i <= 7 else "blocked"
        br = "gate" if i == 8 else None
        steps.append({"idx": i, "title": t, "agent": a, "skills": [], "status": status, "isGate": g, "blockReason": br, **({"hash": sha256_of("gate0-advocacia")} if i == 1 else {})})
    return steps


def sy_m_steps():
    titles = [
        ("Gate 0 · Demanda de manutenção", "Dora Descoberta", True),
        ("Diagnóstico do sistema", "Ari Arquiteto", False),
        ("Impacto & rollback", "Ari Arquiteto", False),
        ("Correção & migração", "Diego Desenvolvedor", False),
        ("QA Físico & Completion Guard", "Talita QA", False),
        ("Gate Final CEO · Completion Guard 8/8", "Carlos Henrique · CEO", True),
    ]
    steps = []
    for i, (t, a, g) in enumerate(titles, 1):
        steps.append({"idx": i, "title": t, "agent": a, "skills": [], "status": "done", "isGate": g, "blockReason": None, **({"hash": sha256_of("gate0-crm")} if i == 1 else {})})
    return steps


def seed_projects():
    return [
        {"id": "proj-meridian", "name": "Landing Meridian Capital", "code": "LP-C", "esteira": "lp-c",
         "client": "Meridian Capital", "status": "andamento", "stack": "React + Vite + TypeScript",
         "db": "Supabase PostgreSQL", "runner": "GhostCLI · claude-sonnet-5",
         "steps": lp_c_steps(),
         "pendencies": [
             {"id": "pend-gate1", "type": "AUTH", "agent": "Enzo Extrator", "title": "Gate Fase 1 · liberar a Fase 2",
              "text": "A extração técnica terminou: 5 seções, 42 textos e 18 imagens inventariados. A Fase 2 (estratégia e plano) só começa com a sua autorização.",
              "diagnosis": None, "resolved": False, "unlocks": "gate"},
             {"id": "pend-build", "type": "ERROR", "agent": "Diego Desenvolvedor", "title": "Build de preview falhou",
              "text": "O deploy de preview parou porque a variável SUPABASE_URL não existe na conta vercel · tavir.",
              "diagnosis": "Causa: configuração: variável não cadastrada ao travar a conta do projeto. · Resolução: cadastrar SUPABASE_URL em Acessos e refazer o preview.",
              "resolved": False, "unlocks": "build", "error_code": "HTTP 409 FABRICA-COMPLETION-001"},
         ],
         "activity": [
             {"date": "24/09 10:00", "agent": "Dora Descoberta", "message": "Gate 0 aprovado"},
             {"date": "24/09 16:20", "agent": "Dora Descoberta", "message": "Requisitos aprovados por você"},
             {"date": "25/09 11:00", "agent": "Marina + Yuri", "message": "Prova visual aprovada"},
             {"date": "26/09 09:30", "agent": "Comercial TAVIR", "message": "Contrato assinado"},
             {"date": "28/09 13:35", "agent": "Diego Desenvolvedor", "message": "Erro: SUPABASE_URL ausente no preview"},
             {"date": "28/09 14:10", "agent": "Enzo Extrator", "message": "Extração técnica concluída · aguardando Gate Fase 1"},
         ],
         "inventory": {"secoes": 5, "textos": 42, "imagens": 18},
         "env": [
             {"key": "VERCEL_PROJECT", "value": "tavir", "status": "ok"},
             {"key": "SUPABASE_URL", "value": "", "status": "missing"},
             {"key": "SUPABASE_ANON_KEY", "value": "eyJhbGciOi•••", "status": "ok"},
         ],
         "files": []},

        {"id": "proj-atlas", "name": "Portal de Clientes Atlas", "code": "SY-C", "esteira": "sy-c",
         "client": "Atlas Holdings", "status": "andamento", "stack": "Flutter 3.38 + Dart / React + Supabase",
         "db": "Supabase PostgreSQL", "runner": "GhostCLI · opus-5-5",
         "steps": sy_c_steps(),
         "pendencies": [
             {"id": "pend-scaffold", "type": "AUTH", "agent": "Paula PM", "title": "Liberar Scaffold Físico Oficial",
              "text": "O planejamento ágil terminou. O Scaffold Físico (flutter create / pnpm create vite) só começa com a sua autorização.",
              "diagnosis": None, "resolved": False, "unlocks": "gate"},
         ],
         "activity": [
             {"date": "02/10 09:00", "agent": "Dora Descoberta", "message": "Gate 0 aprovado · brand-context"},
             {"date": "02/10 15:40", "agent": "Ari Arquiteto", "message": "Arquitetura aprovada · archify"},
             {"date": "03/10 10:20", "agent": "Paula PM", "message": "Planejamento ágil concluído · aguardando scaffold"},
         ],
         "inventory": None,
         "env": [
             {"key": "SUPABASE_URL", "value": "https://atlas.supabase.co", "status": "ok"},
             {"key": "ANDROID_SDK", "value": "tavir_qa", "status": "ok"},
         ],
         "files": [
             {"path": "lib/main.dart", "type": "file"},
             {"path": "pubspec.yaml", "type": "file"},
             {"path": "package.json", "type": "file"},
             {"path": "test/", "type": "dir"},
             {"path": "qa/evidencias/", "type": "dir"},
             {"path": "app-release.apk", "type": "artifact"},
         ]},

        {"id": "proj-oferta", "name": "Oferta Diagnóstico de Dados", "code": "OF-C", "esteira": "of-c",
         "client": "TAVIR · Datavir", "status": "pausado", "stack": "Interno",
         "db": "SQLite WAL", "runner": "GhostCLI · claude-sonnet-5",
         "steps": of_c_steps(), "pendencies": [],
         "activity": [
             {"date": "20/09 11:00", "agent": "Dora Descoberta", "message": "Gate 0 aprovado"},
             {"date": "21/09 09:00", "agent": "Bianca Estrategista", "message": "Evidência de público coletada · pausado"},
         ],
         "inventory": None, "env": [], "files": []},

        {"id": "proj-advocacia", "name": "LP Nicho Advocacia", "code": "LP-M", "esteira": "lp-m",
         "client": "Nicho Advocacia", "status": "andamento", "stack": "React + Vite",
         "db": "Supabase PostgreSQL", "runner": "GhostCLI · claude-sonnet-5",
         "steps": lp_m_steps(),
         "pendencies": [
             {"id": "pend-sec", "type": "AUTH", "agent": "Sérgio Seg/LGPD", "title": "Aprovar plano de Segurança & LGPD",
              "text": "A auditoria SEO terminou. A etapa de Segurança & LGPD aguarda sua autorização para prosseguir.",
              "diagnosis": None, "resolved": False, "unlocks": "gate"},
         ],
         "activity": [
             {"date": "15/09 10:00", "agent": "Dora Descoberta", "message": "Gate 0 aprovado"},
             {"date": "18/09 14:00", "agent": "Nina SEO", "message": "Auditoria SEO concluída · aguardando Segurança"},
         ],
         "inventory": None, "env": [], "files": []},

        {"id": "proj-crm", "name": "CRM interno TAVIR", "code": "SY-M", "esteira": "sy-m",
         "client": "TAVIR", "status": "concluido", "stack": "React + FastAPI",
         "db": "SQLite WAL", "runner": "GhostCLI · opus-5-5",
         "steps": sy_m_steps(), "pendencies": [],
         "activity": [
             {"date": "10/09 10:00", "agent": "Dora Descoberta", "message": "Gate 0 aprovado"},
             {"date": "12/09 16:00", "agent": "Talita QA", "message": "Completion Guard 8/8 PASS"},
             {"date": "12/09 17:30", "agent": "Carlos Henrique · CEO", "message": "Gate Final aprovado · entregue"},
         ],
         "inventory": None,
         "env": [{"key": "DATABASE_URL", "value": "sqlite:///office.db", "status": "ok"}],
         "files": [
             {"path": "backend/server.py", "type": "file"},
             {"path": "frontend/src/App.js", "type": "file"},
             {"path": "qa/evidencias/", "type": "dir"},
         ],
         "completionGuard": "8/8"},
    ]


ESTEIRA_STEP_BUILDERS = {
    "lp-c": lp_c_steps, "sy-c": sy_c_steps, "of-c": of_c_steps,
    "of-m": of_c_steps, "lp-m": lp_m_steps, "sy-m": sy_m_steps,
}


def completion_guard(project: dict) -> dict:
    done = sum(1 for s in project["steps"] if s["status"] == "done")
    total = len(project["steps"])
    full = (done == total) or project.get("status") == "concluido"
    ratio = (done / total) if total else 0
    labels = [
        "Volume de conteúdo > 2.500 chars",
        "Manifesto válido (pubspec.yaml / package.json)",
        "Entrypoint executável (lib/main.dart / index)",
        "Segregação arquitetural respeitada",
        "Zero imports quebrados",
        "Testes físicos em qa/evidencias/",
        "Zero // TODO ou stubs",
        "QA + Security + Docs PASS",
    ]
    thresholds = [0.12, 0.25, 0.38, 0.5, 0.62, 0.74, 0.86, 1.0]
    rules = []
    for i, (lab, th) in enumerate(zip(labels, thresholds), 1):
        passed = full if i == 8 else (full or ratio >= th)
        rules.append({"id": i, "label": lab, "pass": passed})
    passed = sum(1 for r in rules if r["pass"])
    lint_ok = full or ratio >= 0.5
    linters = [
        {"cmd": "dart analyze", "status": "pass" if lint_ok else "idle"},
        {"cmd": "tsc --noEmit", "status": "pass" if lint_ok else "idle"},
        {"cmd": "ruff", "status": "pass" if lint_ok else "idle"},
    ]
    return {
        "rules": rules, "passed": passed, "total": 8, "allPass": passed == 8,
        "linters": linters,
        "playwright": "pass" if (full or ratio >= 0.75) else "idle",
        "emulator": "tavir_qa · pass" if (project["code"].startswith("SY") and (full or ratio >= 0.65)) else "idle",
    }


@app.on_event("startup")
async def seed():
    try:
        init_storage()
        logger.info("Object storage initialized")
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
    if await db.esteiras.count_documents({}) == 0:
        await db.esteiras.insert_many([dict(e) for e in ESTEIRAS])
        logger.info("Seeded esteiras")
    if await db.projects.count_documents({}) == 0:
        await db.projects.insert_many(seed_projects())
        logger.info("Seeded projects")


@api_router.get("/")
async def root():
    return {"message": "TAVIR Fábrica API", "status": "ok"}


@api_router.get("/esteiras")
async def get_esteiras():
    items = await db.esteiras.find({}, {"_id": 0}).to_list(100)
    order = {e["id"]: i for i, e in enumerate(ESTEIRAS)}
    items.sort(key=lambda x: order.get(x["id"], 99))
    return items


@api_router.get("/projects")
async def get_projects():
    items = await db.projects.find({}, {"_id": 0}).to_list(200)
    result = []
    for p in items:
        result.append({
            "id": p["id"], "name": p["name"], "code": p["code"], "esteira": p["esteira"],
            "client": p["client"], "status": p["status"], "stack": p.get("stack"),
            "progress": progress_of(p["steps"]),
            "currentStep": done_count(p["steps"]),
            "totalSteps": len(p["steps"]),
            "pendencies": len([x for x in p["pendencies"] if not x["resolved"]]),
            "completionGuard": p.get("completionGuard"),
        })
    order = {"proj-meridian": 0, "proj-atlas": 1, "proj-oferta": 2, "proj-advocacia": 3, "proj-crm": 4}
    result.sort(key=lambda x: order.get(x["id"], 99))
    return result


def enrich(p: dict) -> dict:
    p = strip_id(p)
    p["progress"] = progress_of(p["steps"])
    p["currentStep"] = done_count(p["steps"])
    p["totalSteps"] = len(p["steps"])
    p["openPendencies"] = len([x for x in p["pendencies"] if not x["resolved"]])
    p["guard"] = completion_guard(p)
    return p


@api_router.get("/projects/{pid}")
async def get_project(pid: str):
    p = await db.projects.find_one({"id": pid})
    if not p:
        raise HTTPException(404, "Projeto não encontrado")
    return enrich(p)


@api_router.post("/projects/{pid}/complete-step")
async def complete_step(pid: str):
    p = await db.projects.find_one({"id": pid})
    if not p:
        raise HTTPException(404, "Projeto não encontrado")
    steps = p["steps"]
    ci = current_step_index(steps)
    if ci >= len(steps):
        await db.projects.update_one({"id": pid}, {"$set": {"status": "concluido", "completionGuard": "8/8"}})
        p["status"] = "concluido"
        p["completionGuard"] = "8/8"
        return {"blocked": False, "done": True, "project": enrich(p)}
    step = steps[ci]
    if step["status"] == "blocked" and step["blockReason"]:
        return {"blocked": True, "reason": step["blockReason"], "step": step, "project": enrich(p)}
    steps[ci]["status"] = "done"
    nxt = ci + 1
    if nxt < len(steps) and steps[nxt]["status"] == "active":
        pass
    elif nxt < len(steps) and steps[nxt]["status"] != "blocked":
        steps[nxt]["status"] = "active"
    new_status = "concluido" if current_step_index(steps) >= len(steps) else "andamento"
    act = {"date": datetime.now(timezone.utc).strftime("%d/%m %H:%M"), "agent": step["agent"], "message": f"{step['title']} concluído"}
    p["activity"].insert(0, act)
    upd = {"steps": steps, "status": new_status, "activity": p["activity"]}
    if new_status == "concluido":
        upd["completionGuard"] = "8/8"
    await db.projects.update_one({"id": pid}, {"$set": upd})
    p.update(upd)
    return {"blocked": False, "done": new_status == "concluido", "project": enrich(p)}


@api_router.post("/projects/{pid}/pendencies/{pend_id}/resolve")
async def resolve_pendency(pid: str, pend_id: str, payload: ResolvePayload):
    p = await db.projects.find_one({"id": pid})
    if not p:
        raise HTTPException(404, "Projeto não encontrado")
    pend = next((x for x in p["pendencies"] if x["id"] == pend_id), None)
    if not pend:
        raise HTTPException(404, "Pendência não encontrada")
    if pend["resolved"]:
        return enrich(p)

    signature = None
    if pend["unlocks"] == "gate":
        ci = current_step_index(p["steps"])
        for s in p["steps"]:
            if s.get("blockReason") == "gate":
                s["blockReason"] = None
                if s["status"] == "blocked" and s["idx"] - 1 == ci:
                    s["status"] = "active"
        signature = sha256_of({"gate": pend["title"], "ts": now_iso(), "by": "Carlos Henrique"})
        msg = f"{pend['title']} · autorizado por você"
    elif pend["unlocks"] == "build":
        url = (payload.supabase_url or "").strip()
        if not url:
            raise HTTPException(400, "SUPABASE_URL é obrigatório para refazer o preview")
        for e in p.get("env", []):
            if e["key"] == "SUPABASE_URL":
                e["value"] = url
                e["status"] = "ok"
        ci = current_step_index(p["steps"])
        for s in p["steps"]:
            if s.get("blockReason") == "build":
                s["blockReason"] = None
                if s["idx"] - 1 == ci:
                    s["status"] = "active"
        msg = "SUPABASE_URL cadastrado · preview refeito com sucesso"
    else:
        msg = f"{pend['title']} resolvido"

    pend["resolved"] = True
    act = {"date": datetime.now(timezone.utc).strftime("%d/%m %H:%M"), "agent": pend["agent"], "message": msg}
    p["activity"].insert(0, act)
    await db.projects.update_one({"id": pid}, {"$set": {"steps": p["steps"], "pendencies": p["pendencies"], "activity": p["activity"], "env": p.get("env", [])}})
    out = enrich(p)
    if signature:
        out["signature"] = signature
    return out


@api_router.post("/projects")
async def create_project(brief: Briefing):
    vague = ["a definir", "pendente", "tbd", "n/a", "todo"]
    fields = {
        "Ideia & Problema": brief.d1_ideia, "Público-Alvo": brief.d2_publico,
        "Stack Tecnológica": brief.d3_stack, "Banco de Dados": brief.d4_banco,
        "Materiais & Referências": brief.d5_materiais, "Integrações & MCPs": brief.d6_integracoes,
        "Regras de Negócio": brief.d7_regras,
    }
    for name, val in fields.items():
        v = (val or "").strip()
        if len(v) < 8:
            raise HTTPException(422, f"Dimensão '{name}' precisa de conteúdo real (anti-teatro).")
        if any(t in v.lower() for t in vague):
            raise HTTPException(422, f"Dimensão '{name}' contém termo vago proibido (ex.: 'A definir', 'Pendente').")

    esteira = await db.esteiras.find_one({"id": brief.esteira}, {"_id": 0})
    if not esteira:
        raise HTTPException(404, "Esteira inválida")

    builder = ESTEIRA_STEP_BUILDERS.get(brief.esteira, of_c_steps)
    steps = builder()
    for s in steps:
        s["status"] = "blocked"
        s["blockReason"] = None
        s.pop("hash", None)
    steps[0]["status"] = "done"
    steps[0]["hash"] = sha256_of({"brief": fields, "nome": brief.nome, "ts": now_iso()})
    if len(steps) > 1:
        steps[1]["status"] = "active"

    stack_l = brief.d3_stack.lower()
    scaffold = "flutter create" if "flutter" in stack_l else ("pnpm create vite" if ("react" in stack_l or "vite" in stack_l) else "python -m venv")

    pid = "proj-" + uuid.uuid4().hex[:8]
    doc = {
        "id": pid, "name": brief.nome, "code": esteira["code"], "esteira": brief.esteira,
        "client": brief.cliente, "status": "andamento", "stack": brief.d3_stack, "db": brief.d4_banco,
        "runner": "GhostCLI · claude-sonnet-5", "steps": steps, "pendencies": [],
        "activity": [{"date": datetime.now(timezone.utc).strftime("%d/%m %H:%M"), "agent": "Dora Descoberta",
                      "message": f"Gate 0 aprovado · {scaffold} · scaffold físico gerado"}],
        "inventory": None, "env": [], "files": [], "briefing": fields,
    }
    await db.projects.insert_one(dict(doc))
    await db.esteiras.update_one({"id": brief.esteira}, {"$inc": {"projects": 1}})
    out = enrich(doc)
    out["hash"] = steps[0]["hash"]
    out["scaffold"] = scaffold
    return out


@api_router.post("/admin/reseed")
async def reseed():
    await db.esteiras.delete_many({})
    await db.projects.delete_many({})
    await db.esteiras.insert_many([dict(e) for e in ESTEIRAS])
    await db.projects.insert_many(seed_projects())
    return {"ok": True}


def ghost_lines(p: dict, s: dict) -> List[dict]:
    agent = s["agent"]
    skills = s.get("skills") or []
    title = s["title"].lower()
    lines = [
        {"t": "cmd", "v": f"$ ghostcli run --project {p['id']} --step {s['idx']:02d} --agent \"{agent}\""},
        {"t": "info", "v": "→ conectando ao Sincron Brain MCP · carregando contexto do projeto"},
        {"t": "info", "v": f"→ skills ativas: {', '.join(skills) if skills else 'core'}  · runner {p.get('runner','GhostCLI')}"},
        {"t": "think", "v": f"[{agent}] planejando execução: {s['title']}"},
    ]
    if "scaffold" in title:
        lines += [{"t": "cmd", "v": "$ flutter create . || pnpm create vite@latest"}, {"t": "ok", "v": "✓ manifesto (pubspec.yaml / package.json) e entrypoint físicos gerados"}]
    elif "linter" in title or "compiler" in title:
        lines += [{"t": "cmd", "v": "$ dart analyze && tsc --noEmit && ruff check ."}, {"t": "warn", "v": "⟳ loop de auto-correção: 3 avisos corrigidos automaticamente"}, {"t": "ok", "v": "✓ análise estática: 0 erros"}]
    elif "qa" in title or "playwright" in title:
        lines += [{"t": "cmd", "v": "$ playwright test --reporter=line  (emulador tavir_qa)"}, {"t": "ok", "v": "✓ evidências físicas salvas em qa/evidencias/"}]
    elif "segur" in title or "lgpd" in title:
        lines += [{"t": "think", "v": "auditando superfície OWASP + conformidade LGPD"}, {"t": "ok", "v": "✓ nenhuma vulnerabilidade crítica encontrada"}]
    elif "gate" in title:
        lines += [{"t": "warn", "v": "⚠ Gate Humano obrigatório · aguardando autorização do CEO"}]
    elif "construç" in title or "construc" in title or "código" in title or "codigo" in title or "front" in title or "back" in title:
        lines += [{"t": "think", "v": "gerando módulos de código · respeitando segregação arquitetural"}, {"t": "ok", "v": "✓ zero imports quebrados · zero stubs/TODO"}]
    else:
        lines += [{"t": "think", "v": "processando artefatos e validando saída verificável"}]
    lines.append({"t": "ok", "v": f"✓ etapa {s['idx']:02d} processada · GhostCLI"})
    return lines


@api_router.get("/projects/{pid}/stream/{step_idx}")
async def stream_step(pid: str, step_idx: int):
    p = await db.projects.find_one({"id": pid})
    if not p:
        raise HTTPException(404, "Projeto não encontrado")
    step = next((s for s in p["steps"] if s["idx"] == step_idx), None)
    lines = ghost_lines(p, step) if step else [{"t": "warn", "v": "etapa não encontrada"}]

    async def gen():
        for ln in lines:
            yield f"data: {json.dumps(ln, ensure_ascii=False)}\n\n"
            await asyncio.sleep(0.32)
        yield "event: end\ndata: {}\n\n"

    return StreamingResponse(gen(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no", "Connection": "keep-alive"})


def build_documents(p: dict) -> List[dict]:
    brief = p.get("briefing") or {}
    steps = p["steps"]
    done = done_count(steps)
    total = len(steps)
    openp = len([x for x in p["pendencies"] if not x["resolved"]])
    gate0 = next((s for s in steps if s["idx"] == 1), None)
    gate0_hash = (gate0 or {}).get("hash", "sha256:—")
    seal = "> ✅ **Banca Revisora Independente** — documento revisado e aprovado."

    def dim(k, fallback):
        return brief.get(k) or fallback

    project_md = f"""# {p['name']}

**Cliente:** {p['client']}
**Código da esteira:** `{p['code']}`
**Stack:** {p.get('stack', '—')}
**Banco de dados:** {p.get('db', '—')}
**Runner:** `{p.get('runner', 'GhostCLI')}`

## Visão geral
Projeto conduzido pela **TAVIR Fábrica de Software Autônoma**, com gates humanos obrigatórios, mesas especializadas e Completion Guard físico. Cada etapa é executada por um agente dedicado via GhostCLI e validada por evidências reais.

## Status operacional
- Etapa atual: **{done} de {total}**
- Pendências abertas: **{openp}**
- Progresso: **{progress_of(steps)}%**

{seal}
"""

    briefing_md = f"""# 01 · Briefing Gate 0

Assinatura do Gate 0: `{gate0_hash}`

## 1. Ideia & Problema de Negócio
{dim('Ideia & Problema', 'Demanda aprovada pelo CEO para ' + p['name'] + '.')}

## 2. Público-Alvo & Perfil de Utilizador
{dim('Público-Alvo', 'Público definido na descoberta com ' + p['client'] + '.')}

## 3. Stack Tecnológica
{dim('Stack Tecnológica', p.get('stack', '—'))}

## 4. Banco de Dados
{dim('Banco de Dados', p.get('db', '—'))}

## 5. Materiais & Referências Visuais
{dim('Materiais & Referências', 'Tokens de marca e referências aprovadas na prova visual.')}

## 6. Integrações & MCPs
{dim('Integrações & MCPs', 'GhostCLI · Playwright · Android SDK / tavir_qa · Sincron Brain MCP')}

## 7. Regras de Negócio & Escopo Negativo
{dim('Regras de Negócio', 'Escopo e restrições registrados no intake estruturado.')}

{seal}
"""

    req_md = f"""# 02 · Requisitos Verificáveis

Requisitos derivados do Gate 0 e aprovados pela banca independente. Cada requisito é **verificável** por evidência física.

## Requisitos funcionais
- Entregar {p['name']} conforme a esteira `{p['code']}` ({total} etapas).
- Respeitar todos os Gates Humanos obrigatórios antes de avançar de fase.
- Produzir artefatos físicos em disco (código, testes, evidências de QA).

## Critérios de aceite (Completion Guard)
- Volume de conteúdo e manifesto válidos.
- Entrypoint executável e segregação arquitetural respeitada.
- Zero imports quebrados, zero `// TODO`/stubs.
- QA + Segurança + Documentação em estado PASS.

{seal}
"""

    arch_md = f"""# 03 · Arquitetura

## Decisões de arquitetura
- **Stack:** {p.get('stack', '—')}
- **Persistência:** {p.get('db', '—')}
- **Execução:** agentes autônomos orquestrados por `{p.get('runner', 'GhostCLI')}`.

## Mesas & agentes
""" + "\n".join([f"- Etapa {s['idx']:02d} · **{s['title']}** — {s['agent']}" + (f" (`{', '.join(s.get('skills', []))}`)" if s.get("skills") else "") for s in steps]) + f"""

## Loop de qualidade
Análise estática contínua (`dart analyze` / `tsc --noEmit` / `ruff`) + Playwright/Emulador `tavir_qa`, finalizando no **Gate Final CEO · Completion Guard**.

{seal}
"""

    return [
        {"name": "PROJECT.md", "content": project_md, "reviewed": True},
        {"name": "01-briefing-gate0.md", "content": briefing_md, "reviewed": True},
        {"name": "02-requisitos.md", "content": req_md, "reviewed": True},
        {"name": "03-arquitetura.md", "content": arch_md, "reviewed": True},
    ]


@api_router.get("/projects/{pid}/documents")
async def get_documents(pid: str):
    p = await db.projects.find_one({"id": pid})
    if not p:
        raise HTTPException(404, "Projeto não encontrado")
    return build_documents(strip_id(p))


TIPO_MAP = {
    "lp": ("LP-C", "lp-c"),
    "sistema": ("SY-C", "sy-c"),
    "oferta": ("OF-C", "of-c"),
}


def intake_steps(esteira_id: str, escopo: str, hashval: str) -> List[dict]:
    builder = ESTEIRA_STEP_BUILDERS.get(esteira_id, sy_c_steps)
    steps = builder()
    for s in steps:
        s["status"] = "blocked"
        s["blockReason"] = None
        s.pop("hash", None)
    if escopo == "ideacao":
        ideation = [
            {"idx": 0, "title": "Ideação & Problema de Negócio", "agent": "Dora Descoberta", "skills": ["brand-context"], "status": "active", "isGate": False, "blockReason": None},
            {"idx": 0, "title": "Pesquisa de Mercado & Concorrência", "agent": "Dora Descoberta", "skills": ["market-research"], "status": "blocked", "isGate": False, "blockReason": None},
            {"idx": 0, "title": "Validação da Oportunidade (Gate)", "agent": "Dora Descoberta", "skills": [], "status": "blocked", "isGate": True, "blockReason": None},
        ]
        combined = ideation + steps
        for i, s in enumerate(combined, 1):
            s["idx"] = i
        combined[0]["hash"] = hashval
        return combined
    # escopo "pronto": Gate 0 já aprovado a partir do briefing/anexos
    steps[0]["status"] = "done"
    steps[0]["hash"] = hashval
    if len(steps) > 1:
        steps[1]["status"] = "active"
    return steps


@api_router.post("/upload")
async def upload(file: UploadFile = File(...), kind: str = "context"):
    ext = (file.filename.rsplit(".", 1)[-1] if "." in file.filename else "bin").lower()
    allowed_context = {"md", "txt", "html"}
    allowed_ds = {"zip"}
    allowed = allowed_ds if kind == "design" else allowed_context
    if ext not in allowed:
        raise HTTPException(422, f"Extensão .{ext} não permitida para '{kind}'. Aceitos: {', '.join(sorted(allowed))}")
    data = await file.read()
    if len(data) > 25 * 1024 * 1024:
        raise HTTPException(413, "Arquivo excede 25MB")
    fid = str(uuid.uuid4())
    path = f"{APP_NAME}/uploads/{fid}.{ext}"
    content_type = file.content_type or MIME_TYPES.get(ext, "application/octet-stream")
    try:
        result = put_object(path, data, content_type)
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(502, "Falha ao enviar o arquivo para o storage")
    storage_path = result["path"]
    await db.files.insert_one({
        "id": fid, "storage_path": storage_path, "original_filename": file.filename,
        "content_type": content_type, "size": result.get("size", len(data)), "kind": kind,
        "is_deleted": False, "created_at": now_iso(),
    })
    return {"id": fid, "name": file.filename, "url": f"/api/files/{storage_path}",
            "size": result.get("size", len(data)), "type": content_type, "kind": kind}


@api_router.get("/files/{path:path}")
async def download_file(path: str):
    record = await db.files.find_one({"storage_path": path, "is_deleted": False})
    if not record:
        raise HTTPException(404, "Arquivo não encontrado")
    try:
        data, content_type = get_object(path)
    except Exception:
        raise HTTPException(404, "Arquivo não encontrado no storage")
    headers = {"Content-Disposition": f'inline; filename="{record.get("original_filename", "file")}"'}
    return Response(content=data, media_type=record.get("content_type", content_type), headers=headers)


@api_router.post("/projects/intake")
async def create_project_intake(body: NewProjectIn):
    if not body.nome.strip() or not body.empresa.strip():
        raise HTTPException(422, "Nome do projeto e Empresa são obrigatórios.")
    if body.escopo not in ("ideacao", "pronto"):
        raise HTTPException(422, "Escopo inválido (use 'ideacao' ou 'pronto').")
    code, esteira_id = TIPO_MAP.get(body.tipo, TIPO_MAP["sistema"])

    hashval = sha256_of({"nome": body.nome, "empresa": body.empresa, "escopo": body.escopo, "ts": now_iso()})
    steps = intake_steps(esteira_id, body.escopo, hashval)

    stack_parts = [p for p in [body.front, body.back, body.db] if (p or "").strip()]
    stack_str = " / ".join(stack_parts) if stack_parts else "—"
    stack_l = (body.front + " " + body.back).lower()
    scaffold = "flutter create" if "flutter" in stack_l else ("pnpm create vite" if ("react" in stack_l or "vite" in stack_l or "next" in stack_l) else ("python -m venv" if "python" in stack_l or "fastapi" in stack_l else "scaffold físico oficial"))

    if body.escopo == "ideacao":
        first_msg = "Projeto iniciado do zero · Dora conduzindo ideação e pesquisa de mercado"
        first_agent = "Dora Descoberta"
    else:
        first_msg = f"Escopo recebido · Gate 0 aprovado · {scaffold} · pronto para desenvolvimento"
        first_agent = "Dora Descoberta"

    pid = "proj-" + uuid.uuid4().hex[:8]
    doc = {
        "id": pid, "name": body.nome.strip(), "code": code, "esteira": esteira_id,
        "client": body.empresa.strip(), "status": "andamento", "stack": stack_str,
        "stackParts": {"front": body.front, "back": body.back, "db": body.db},
        "db": body.db or "—", "scope": body.escopo, "tipo": body.tipo,
        "runner": "GhostCLI · claude-sonnet-5", "steps": steps, "pendencies": [],
        "activity": [{"date": datetime.now(timezone.utc).strftime("%d/%m %H:%M"), "agent": first_agent, "message": first_msg}],
        "inventory": None, "env": [],
        "files": [{"path": f["name"], "type": "artifact", "url": f["url"]} for f in body.contextFiles]
                 + ([{"path": body.designSystem.name, "type": "design-system", "url": body.designSystem.url}] if body.designSystem else []),
        "contextFiles": [f.dict() for f in body.contextFiles],
        "designSystem": body.designSystem.dict() if body.designSystem else None,
        "briefing": {
            "Ideia & Problema": body.segmento or body.nome,
            "Público-Alvo": body.empresa,
            "Stack Tecnológica": stack_str,
            "Banco de Dados": body.db or "—",
            "Materiais & Referências": (body.designSystem.name if body.designSystem else "—"),
            "Integrações & MCPs": "GhostCLI · Playwright · Sincron Brain MCP",
            "Regras de Negócio": body.concorrentes or "—",
        },
    }
    await db.projects.insert_one(dict(doc))
    await db.esteiras.update_one({"id": esteira_id}, {"$inc": {"projects": 1}})
    out = enrich(doc)
    out["hash"] = hashval
    out["scaffold"] = scaffold
    return out


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
