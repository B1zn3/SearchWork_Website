FROM python:3.11

RUN apt-get update && apt-get install -y gcc libpq-dev

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . /app
COPY ../frontend /app/frontend

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
