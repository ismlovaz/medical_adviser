# Берем легкую версию Python 3.10
FROM python:3.10-slim

# Устанавливаем рабочую директорию внутри контейнера
WORKDIR /app

# Сначала копируем ТОЛЬКО requirements.txt
# Это хитрый трюк для кэширования: если зависимости не менялись, 
# Docker не будет скачивать их заново при каждом изменении кода.
COPY requirements.txt .

# Устанавливаем библиотеки
RUN pip install --no-cache-dir -r requirements.txt

# Копируем все остальные файлы (main.py, модель и т.д.)
COPY . .

# Открываем порт 8000
EXPOSE 8000

# Команда для запуска FastAPI сервера
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]