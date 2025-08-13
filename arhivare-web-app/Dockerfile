# 1. Imagine de bază
FROM python:3.11-slim

# 2. Setare variabile de mediu (pentru Python)
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# 3. Creare director aplicație
WORKDIR /app

# 4. Instalare dependințe sistem (psycopg2 are nevoie de libpq)
RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# 5. Copiere fișiere requirements și instalare pachete Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 6. Copiere cod sursă
COPY ./app ./app
COPY alembic.ini .
COPY ./alembic ./alembic

# 7. Expunere port
EXPOSE 8000

# 8. Comanda de pornire (va fi suprascrisă de docker-compose)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

