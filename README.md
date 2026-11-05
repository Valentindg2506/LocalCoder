# LocalCoder

IDE ligero de escritorio con un asistente de **inteligencia artificial que se ejecuta al 100 % en tu equipo**. Sin nube, sin telemetría y sin límites de uso.

## La idea

Los asistentes de código más conocidos envían tu código a servidores externos y tienen límites o suscripciones. LocalCoder junta en una sola aplicación un editor de código y un chat con modelos de lenguaje que corren en local a través de **Ollama**, de modo que el código nunca sale del ordenador y la IA funciona incluso sin conexión.

## Qué ofrece

- **Editor Monaco**, el mismo motor de edición que Visual Studio Code.
- **Chat con IA en streaming**: las respuestas aparecen en tiempo real mientras el modelo las genera.
- **Memoria por sesión**: las conversaciones se guardan en una base de datos SQLite local, en el propio equipo.
- **Explorador de archivos** sin límite de profundidad para moverse por proyectos grandes.
- **Análisis de proyectos completos**, recorriendo el código línea por línea.
- **Escáner de hardware y recomendador de modelos**: revisa la máquina y sugiere qué modelos de Ollama puede mover con soltura.
- **Totalmente offline**: ni telemetría ni dependencias de servicios externos.

## Cómo está hecho

Es una aplicación de escritorio construida con **Tauri**: la interfaz está hecha con **TypeScript**, **Vite** y **Tailwind CSS**, y la parte nativa con **Rust**, lo que da una aplicación ligera que consume mucho menos que un IDE tradicional basado en Electron. La IA la aporta **Ollama**, con modelos como Qwen 2.5 Coder o Llama 3.1.

| Carpeta | Contenido |
|---|---|
| `src/` | Interfaz de la aplicación. |
| `src-tauri/` | Parte nativa en Rust. |

## Autor

**Valentín Antonio De Gennaro** · Estudiante de 2.º de DAM en Valencia
[valentindg.com](https://valentindg.com) · [Portafolio](https://portafolio.valentindg.com) · [LinkedIn](https://www.linkedin.com/in/valentindg)
