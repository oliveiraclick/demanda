
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("Erro fatal: Elemento root não encontrado no DOM.");
} else {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(<App />);
  } catch (error) {
    console.error("Erro durante a renderização do React:", error);
    rootElement.innerHTML = `
      <div style="padding: 20px; font-family: sans-serif; text-align: center;">
        <h2>Ops! Algo deu errado ao carregar o sistema.</h2>
        <p>Verifique o console do navegador para mais detalhes.</p>
        <button onclick="location.reload()" style="padding: 10px 20px; cursor: pointer;">Recarregar Página</button>
      </div>
    `;
  }
}
