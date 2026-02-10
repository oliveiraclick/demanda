
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

console.log("ServiceFlow: Iniciando inicialização...");

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("Erro fatal: Elemento root não encontrado.");
} else {
  try {
    const root = createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("ServiceFlow: Renderização solicitada.");
  } catch (error) {
    console.error("Erro no bootstrap do React:", error);
    rootElement.innerHTML = `<div style="padding: 20px; color: red;">Erro ao carregar App: ${String(error)}</div>`;
  }
}
