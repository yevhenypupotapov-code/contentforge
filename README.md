# ContentForge 🛠️ — контент-фабрика для Windows

<p align="center">
  <img src="assets/banner.svg" alt="ContentForge" width="100%">
</p>

<p align="center">
  <a href="https://github.com/yevhenypupotapov-code/contentforge/releases"><img src="https://img.shields.io/github/v/release/yevhenypupotapov-code/contentforge?style=flat-square&label=%D1%80%D0%B5%D0%BB%D0%B8%D0%B7" alt="Release"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License: MIT"></a>
  <img src="https://img.shields.io/badge/platform-Windows-0078D4?style=flat-square" alt="Platform: Windows">
  <img src="https://img.shields.io/badge/%D0%BC%D0%BE%D0%B4%D0%B5%D0%BB%D0%B8-%D0%BB%D0%BE%D0%BA%D0%B0%D0%BB%D1%8C%D0%BD%D1%8B%D0%B5-b3402a?style=flat-square" alt="Local models only">
</p>

Приложение контент-фабрики: ставится на ПК, проверяет систему и запускает выпуск —
от темы до публикации на YouTube. Плюс веб-панель для наблюдения за заводом.

**Никакого облака в создании контента.** Сценарий считает локальная модель, кадры — ComfyUI,
голос — системный синтез Windows, монтаж — FFmpeg.

---

## Скачать

<p align="center">
  <a href="https://github.com/yevhenypupotapov-code/contentforge/releases/latest">
    <img src="https://img.shields.io/badge/%D1%81%D0%BA%D0%B0%D1%87%D0%B0%D1%82%D1%8C-ContentForge--Windows.zip-e08a3c?style=for-the-badge" alt="Download">
  </a>
</p>

Распаковать → `ContentForge.bat` → «Проверить этот ПК».

## Что в приложении

```
ContentForge.bat            меню: проверка ПК, установка пакетов, запуск заводов
tools/preflight.ps1         проверка Python, Ollama, ComfyUI, FFmpeg, GPU, RAM, дисков
tools/install.ps1           установка и обновление Python-пакетов
tools/run-factory.ps1       запуск одной проходки завода (Shorts или длинный)
config.example.json         образец настроек
SECURITY.md                 что никогда не публикуется (ключи, токены, личные пути)
```

## Веб-панель

В репозитории есть панель управления (React + Vite + Node): обзор, конвейер, выпуски,
расписание, каналы, аналитика, настройки.

```bash
npm install
npm run dev
```

## Требования

| Компонент | Зачем |
|---|---|
| Windows 10/11 | — |
| Python 3.10+ | запуск завода |
| FFmpeg | монтаж и кодирование |
| [Ollama](https://ollama.com) | локальная языковая модель для сценария |
| ComfyUI + LTXV | генерация кадров и видео |
| NVIDIA GPU 8 ГБ+ | ускорение генерации |

## Режим работы

Выпуски публикуются **в открытом доступе**, только **по пятницам и субботам**:
длинный завод — 11:00 и 18:00, короткий — 07:00, 15:00, 23:00.

## Ссылки

- Приложение: [`app/`](app/)
- Ядро длинного завода: [ltx-youtube-gold-standard](https://github.com/yevhenypupotapov-code/ltx-youtube-gold-standard)
- Канал: [YEVHEN POTAPOV](https://www.youtube.com/@yevhenpotapov5956)
- GitHub: [yevhenypupotapov-code](https://github.com/yevhenypupotapov-code)

<p align="center"><sub>Локальные модели · Windows · 2026</sub></p>
