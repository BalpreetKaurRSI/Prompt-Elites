# AI-Powered SDLC Platform

An AI-powered platform that assists engineering teams in transforming raw requirements into structured development artifacts, enabling faster and more efficient SDLC execution.

## Features

- **Requirement Ingestion** — Accept input as raw text, `.txt`, `.docx`, or `.pdf` documents
- **Structured Output Generation** — Converts requirements into summaries, development tasks with effort/priority, and acceptance criteria
- **Test Case Generation** — Automatically generates test scenarios in Given/When/Then format
- **Ambiguity Detection** — Identifies unclear or incomplete requirements with suggestions for improvement
- **Interactive Dashboard** — Angular Material UI for submitting, viewing, and refining outputs

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Angular 17+, Angular Material |
| Backend | Python 3.11+, FastAPI, Uvicorn |
| AI | OpenAI API (GPT-4o-mini) |
| Database | SQLite (zero-config, file-based) |
| File Storage | Local filesystem |

## Prerequisites

- **Node.js** 18+ and npm
- **Angular CLI**: `npm install -g @angular/cli`
- **Python** 3.11+
- **OpenAI API Key** from https://platform.openai.com

## Quick Start

### 1. Configure

```bash
cd ai-sdlc-platform
cp .env.example .env
```

Edit `.env` and set your `OPENAI_API_KEY`.

### 2. Start the Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8080
```

The API will be available at `http://localhost:8080`. Interactive docs at `http://localhost:8080/docs`.

### 3. Start the Frontend

```bash
cd frontend
npm install
ng serve
```

The app will be available at `http://localhost:4200`.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key | (required) |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/requirements` | Submit raw text requirement |
| POST | `/api/requirements/upload` | Upload a document file |
| GET | `/api/requirements` | List all requirements |
| GET | `/api/requirements/{id}` | Get a single requirement |
| POST | `/api/requirements/{id}/generate` | Generate structured output |
| POST | `/api/requirements/{id}/test-cases` | Generate test cases |
| POST | `/api/requirements/{id}/ambiguity` | Detect ambiguities |
| GET | `/api/requirements/{id}/artifacts` | Get all generated artifacts |

## Project Structure

```
ai-sdlc-platform/
├── backend/
│   ├── main.py                 # FastAPI entry point
│   ├── requirements.txt        # Python dependencies
│   ├── data/                   # SQLite DB + uploaded files (auto-created)
│   ├── routers/                # API route handlers
│   │   ├── ingest.py           # Requirement ingestion
│   │   ├── generate.py         # Structured output generation
│   │   ├── test_cases.py       # Test case generation
│   │   └── ambiguity.py        # Ambiguity detection
│   ├── services/               # Business logic
│   │   ├── ai_service.py       # OpenAI integration
│   │   ├── parser.py           # Document parsing
│   │   ├── s3_service.py       # Local file storage
│   │   └── preprocessor.py     # Text preprocessing
│   ├── models/
│   │   └── schemas.py          # Pydantic request/response models
│   └── database/
│       ├── dynamodb.py         # SQLite client setup
│       └── models.py           # Data access layer
├── frontend/
│   ├── src/app/
│   │   ├── components/         # Angular standalone components
│   │   │   ├── dashboard/      # Main layout
│   │   │   ├── requirement-input/  # Input form + file upload
│   │   │   ├── structured-output/  # Tasks, summary, criteria tabs
│   │   │   ├── test-cases/     # Test case accordion
│   │   │   └── ambiguity-panel/    # Ambiguity alerts
│   │   └── services/
│   │       └── api.service.ts  # HTTP client service
│   └── proxy.conf.json         # Dev server API proxy
├── .env.example                # Environment template
└── README.md
```

## Architecture

```
[Angular Frontend] --> [FastAPI Backend] --> [OpenAI GPT-4o-mini]
                                        --> [SQLite Database]
                                        --> [Local File Storage]
```

The frontend submits requirements via the API. The backend preprocesses the text, stores it in SQLite, saves uploaded documents locally, and calls OpenAI to generate structured outputs, test cases, and ambiguity analysis. Results are stored back in SQLite and served to the frontend dashboard.
