# LocalCoder

IDE ligero con IA 100% local usando Ollama. Sin nube, sin límites.

## Requisitos

- [Rust](https://rustup.rs/) (stable)
- [Node.js 18+](https://nodejs.org/)
- [Ollama](https://ollama.com/) corriendo en localhost:11434

## Instalar dependencias del sistema (Ubuntu 24/26)

```bash
sudo apt install -y libwebkit2gtk-4.1-dev libjavascriptcoregtk-4.1-dev \
  libayatana-appindicator3-dev librsvg2-dev build-essential libssl-dev libgtk-3-dev
```

## Instalar y correr

```bash
npm install
npm run tauri dev
```

## Build para producción

```bash
npm run tauri build
```

## Modelos recomendados para empezar

```bash
ollama pull qwen2.5-coder:7b
ollama pull llama3.1:8b
```

## Características

- Editor Monaco (mismo que VS Code)
- Chat con IA streaming en tiempo real
- Memoria por sesión (SQLite local en ~/.localcoder/)
- Explorador de archivos sin límite de profundidad
- Análisis de proyectos completos línea por línea
- Scanner de hardware + recomendador de modelos Ollama
- 100% offline, sin telemetría, sin nube
