FROM python:3.11-slim

# Work inside /app in the container
WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend source code
COPY . .

# Make /app importable so that "import app.Service..." works
ENV PYTHONPATH=/app

# ✅ IMPORTANT: run uvicorn against main.py, not app.main
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
