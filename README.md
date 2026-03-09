# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## AI PDF Creator Configuration

Set any of these env vars before running `npm run dev`:

```bash
# Recommended free-tier chat provider
OPENROUTER_API_KEY=your_key
OPENROUTER_MODEL=openrouter/auto

# Optional fallback chat provider
OPENAI_API_KEY=your_key
OPENAI_MODEL=gpt-4o-mini

# Optional image generation provider
HUGGINGFACE_API_KEY=your_key
HUGGINGFACE_IMAGE_MODEL=stabilityai/stable-diffusion-xl-base-1.0
```

Notes:
- If no chat key is set, the app uses a local fallback parser.
- If `HUGGINGFACE_API_KEY` is set and your prompt asks for images, the generated PDF can include one AI image.
