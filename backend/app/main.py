from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Optional
from uuid import uuid4

from fastapi import Depends, FastAPI, Header, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(
    title="AeroDesk API",
    version="1.0.0",
    description="Flight operations assistant backend (MVP mock + schema-ready)",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Role(str, Enum):
    guest = "guest"
    employee = "employee"
    senior_shift = "senior_shift"
    admin = "admin"


class FlightStatus(str, Enum):
    on_time = "on_time"
    delayed = "delayed"
    cancelled = "cancelled"
    boarding = "boarding"
    departed = "departed"
    arrived = "arrived"
    scheduled = "scheduled"


class LoginRequest(BaseModel):
    employee_number: str = Field(..., min_length=1)
    code: str = Field(..., min_length=4)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict[str, Any]


class FlightOut(BaseModel):
    id: str
    flight_number: str
    airline_code: str
    airline_name: str
    from_code: str
    from_city: str
    to_code: str
    to_city: str
    scheduled_departure: datetime
    actual_departure: Optional[datetime] = None
    scheduled_arrival: datetime
    status: FlightStatus
    gate: str
    check_in_desks: str
    aircraft_type: str
    delay_minutes: int = 0
    special_passengers: list[dict[str, Any]] = []
    source: str = "mock"
    updated_at: datetime


# --- In-memory demo store ---

USERS = {
    "12345": {
        "id": "u1",
        "employee_number": "12345",
        "name": "Петрова Мария С.",
        "role": Role.employee,
        "airline": "DP",
    }
}

FLIGHTS: list[dict[str, Any]] = [
    {
        "id": "1",
        "flight_number": "DP307",
        "airline_code": "DP",
        "airline_name": "Победа",
        "from_code": "VKO",
        "from_city": "Москва",
        "to_code": "AER",
        "to_city": "Сочи",
        "scheduled_departure": datetime(2026, 10, 4, 14, 25, tzinfo=timezone.utc),
        "actual_departure": datetime(2026, 10, 4, 15, 10, tzinfo=timezone.utc),
        "scheduled_arrival": datetime(2026, 10, 4, 17, 45, tzinfo=timezone.utc),
        "status": FlightStatus.delayed,
        "gate": "12A",
        "check_in_desks": "24-28",
        "aircraft_type": "B737-800",
        "delay_minutes": 45,
        "special_passengers": [{"category": "umka", "count": 1}, {"category": "prm", "count": 1}],
        "source": "mock",
        "updated_at": datetime.now(timezone.utc),
    },
    {
        "id": "2",
        "flight_number": "SU3746",
        "airline_code": "SU",
        "airline_name": "Аэрофлот",
        "from_code": "SVO",
        "from_city": "Москва",
        "to_code": "LED",
        "to_city": "Санкт-Петербург",
        "scheduled_departure": datetime(2026, 10, 4, 17, 40, tzinfo=timezone.utc),
        "actual_departure": None,
        "scheduled_arrival": datetime(2026, 10, 4, 19, 15, tzinfo=timezone.utc),
        "status": FlightStatus.on_time,
        "gate": "B12",
        "check_in_desks": "101-105",
        "aircraft_type": "A320neo",
        "delay_minutes": 0,
        "special_passengers": [],
        "source": "mock",
        "updated_at": datetime.now(timezone.utc),
    },
    {
        "id": "3",
        "flight_number": "N4211",
        "airline_code": "N4",
        "airline_name": "Nordwind",
        "from_code": "DME",
        "from_city": "Москва",
        "to_code": "KZN",
        "to_city": "Казань",
        "scheduled_departure": datetime(2026, 10, 4, 10, 0, tzinfo=timezone.utc),
        "actual_departure": datetime(2026, 10, 4, 10, 5, tzinfo=timezone.utc),
        "scheduled_arrival": datetime(2026, 10, 4, 13, 30, tzinfo=timezone.utc),
        "status": FlightStatus.departed,
        "gate": "5",
        "check_in_desks": "15-18",
        "aircraft_type": "A321",
        "delay_minutes": 5,
        "special_passengers": [{"category": "vip", "count": 2}],
        "source": "mock",
        "updated_at": datetime.now(timezone.utc),
    },
]

TOKENS: dict[str, str] = {}
ws_clients: list[WebSocket] = []


def get_current_user(authorization: Optional[str] = Header(default=None)) -> dict[str, Any]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = authorization.removeprefix("Bearer ").strip()
    user_id = TOKENS.get(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = next((u for u in USERS.values() if u["id"] == user_id), None)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "aerodesk-api"}


@app.post("/api/v1/auth/login", response_model=TokenResponse)
def login(body: LoginRequest) -> TokenResponse:
    if body.code == "0000":
        raise HTTPException(status_code=401, detail="Invalid credentials")
    user = USERS.get(body.employee_number) or {
        "id": str(uuid4()),
        "employee_number": body.employee_number,
        "name": "Сотрудник",
        "role": Role.employee,
        "airline": None,
    }
    access = f"access_{uuid4().hex}"
    refresh = f"refresh_{uuid4().hex}"
    TOKENS[access] = user["id"]
    USERS[body.employee_number] = user
    return TokenResponse(access_token=access, refresh_token=refresh, user=user)


@app.get("/api/v1/flights", response_model=list[FlightOut])
def list_flights(q: Optional[str] = None, _user: dict = Depends(get_current_user)) -> list[FlightOut]:
    items = FLIGHTS
    if q:
        ql = q.lower().replace(" ", "")
        items = [
            f
            for f in FLIGHTS
            if ql in f["flight_number"].lower()
            or ql in f["airline_code"].lower()
            or ql in f["from_code"].lower()
            or ql in f["to_code"].lower()
            or q.lower() in f["from_city"].lower()
            or q.lower() in f["to_city"].lower()
        ]
    return [FlightOut(**f) for f in items]


@app.get("/api/v1/flights/{flight_id}", response_model=FlightOut)
def get_flight(flight_id: str, _user: dict = Depends(get_current_user)) -> FlightOut:
    flight = next((f for f in FLIGHTS if f["id"] == flight_id), None)
    if not flight:
        raise HTTPException(status_code=404, detail="Flight not found")
    return FlightOut(**flight)


@app.patch("/api/v1/flights/{flight_id}/gate")
async def update_gate(
    flight_id: str,
    gate: str,
    _user: dict = Depends(get_current_user),
) -> FlightOut:
    flight = next((f for f in FLIGHTS if f["id"] == flight_id), None)
    if not flight:
        raise HTTPException(status_code=404, detail="Flight not found")
    old = flight["gate"]
    flight["gate"] = gate
    flight["updated_at"] = datetime.now(timezone.utc)
    payload = {"type": "gate_changed", "flight_id": flight_id, "from": old, "to": gate}
    dead: list[WebSocket] = []
    for ws in ws_clients:
        try:
            await ws.send_json(payload)
        except Exception:
            dead.append(ws)
    for ws in dead:
        ws_clients.remove(ws)
    return FlightOut(**flight)


@app.get("/api/v1/contacts")
def list_contacts(_user: dict = Depends(get_current_user)) -> list[dict[str, Any]]:
    return [
        {
            "id": "1",
            "name": "Иванов Иван Иванович",
            "position": "Старший смены",
            "shift": "06:00-18:00",
            "phone": "+7 (999) 123-45-67",
            "status": "on_shift",
        },
        {
            "id": "2",
            "name": "Петрова Мария Сергеевна",
            "position": "Бортпроводник",
            "shift": "06:00-18:00",
            "phone": "+7 (999) 234-56-78",
            "status": "on_shift",
        },
    ]


@app.get("/api/v1/special-passengers")
def special_passengers(_user: dict = Depends(get_current_user)) -> list[dict[str, Any]]:
    return [
        {"id": "1", "category": "umka", "title_ru": "УМКА"},
        {"id": "2", "category": "prm", "title_ru": "PRM"},
        {"id": "3", "category": "petc", "title_ru": "Животное"},
        {"id": "4", "category": "depa", "title_ru": "DEPA"},
        {"id": "5", "category": "vip", "title_ru": "VIP / CIP"},
        {"id": "6", "category": "medical", "title_ru": "MEDICAL"},
    ]


@app.websocket("/ws/flights")
async def flights_ws(websocket: WebSocket) -> None:
    await websocket.accept()
    ws_clients.append(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        if websocket in ws_clients:
            ws_clients.remove(websocket)


class MockFlightDataProvider:
    """Abstraction layer — swap for AeroDataBox / airport boards / airline APIs."""

    name = "mock"

    def search(self, query: str) -> list[dict[str, Any]]:
        ql = query.lower().replace(" ", "")
        return [
            f
            for f in FLIGHTS
            if ql in f["flight_number"].lower() or ql in f["airline_code"].lower()
        ]


provider = MockFlightDataProvider()


@app.get("/api/v1/providers/search")
def provider_search(q: str, _user: dict = Depends(get_current_user)) -> dict[str, Any]:
    return {"provider": provider.name, "results": provider.search(q)}
