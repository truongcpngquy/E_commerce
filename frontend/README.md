# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

## Project create
1. Run `npm create vite@latest` to create a production build.
2. choice `React` and `TypeScript` or `TypeScript - Compiler` template.
3. Run `npm install` to install dependencies.

---
# React Router Dom
- React router dom is a library that allows you to handle routing in your React applications. It provides a set of components and hooks that enable you to define routes, navigate between pages, and manage the state of your application based on the current URL.

## Installation
1. Run the following command to install React Router Dom:

```bash
npm install react-router-dom
```
2. Import the necessary components from `react-router-dom` in your React application. For example:

```tsx
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
```

# React Redux toolkit
1. Run the following command to install React Redux Toolkit:

```bash
npm install @reduxjs/toolkit react-redux
npm install @types/react-redux
```

2. Import the necessary functions and components from `@reduxjs/toolkit` and `react-redux` in your React application. For example: (create store -> see below)

```tsx
import { configureStore } from '@reduxjs/toolkit';
export const store = configureStore({
    reducer: {

    }
})

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

3. Create slice and add to store:

```tsx
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
```

4. Create a slice for your state management. For example, let's create a simple counter slice:

```tsx
interface CounterState {
  value: number;
}
```

# React framework build UI (tailwind + Ant Design or Material UI or DaisyUI or Flowbite or Headless UI)
## Tailwind terminal command (u can use tailwind-cli - download and use without internet)

```bash
npm install -D tailwindcss postcss autoprefixer
```

## Tailwind cli
1. 
```bash
npm install tailwindcss @tailwindcss/cli
```
2. Import Tailwind in your CSS
```css
@import "tailwindcss"; 
/* (import to index.css or another to use tailwind css) */
```
3. Start the Tailwind CLI build process: 
```bash
npx @tailwindcss/cli -i ./src/input.css -o ./src/output.css --watch
```

4. Start using Tailwind in your HTML
```html
  <h1 class="text-3xl font-bold underline">
    Hello world!
  </h1>
```



## Install framework UI library of your choice. For example, to install Ant Design:

- Ant Design terminal command:
```bash
npm install antd
# icon
npm install @ant-design/icons
```

