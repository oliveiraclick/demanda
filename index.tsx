
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

console.log("ServiceFlow: Iniciando inicialização...");

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("Erro fatal: Elemento root não encontrado no DOM.");
} else {
  try {
    const root = createRoot(rootElement);
    root.render(<App />);
    console.log("ServiceFlow: App renderizado com sucesso.");
  } catch (error) {
    console.error("Erro durante a renderização do React:", error);
    rootElement.innerHTML = `
      <div style="padding: 40px; font-family: sans-serif; text-align: center; color: #1e293b; background: white; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <h2 style="font-size: 24px; font-weight: 800; margin-bottom: 16px;">Ops! Ocorreu um erro técnico.</h2>
        <p style="color: #64748b; margin-bottom: 24px;">Não conseguimos carregar o ServiceFlow. Verifique sua conexão ou as configurações do navegador.</p>
        <div style="background: #f1f5f9; padding: 15px; border-radius: 12px; font-family: monospace; font-size: 12px; margin-bottom: 24px; text-align: left; max-width: 80%; overflow-x: auto; color: #e11d48;">
          ${String(error)}
        </div>
        <button onclick="location.reload()" style="background: #2563eb; color: white; padding: 12px 28px; border-radius: 12px; border: none; font-weight: 700; cursor: pointer; transition: background 0.2s;">
          Recarregar Sistema
        </button>
      </div>
    `;
  }
}
