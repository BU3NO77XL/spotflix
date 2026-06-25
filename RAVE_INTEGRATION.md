# Integração RAVE - RAVEFLIX

## Como Funciona

Este projeto implementa **múltiplas estratégias** para tentar fazer o aplicativo RAVE detectar e injetar vídeos:

### 1. **Schema.org VideoObject**
- Estrutura JSON-LD com `contentUrl` e `embedUrl`
- O RAVE lê isso para identificar vídeos na página

### 2. **Meta Tags Open Graph**
- `og:type="video.other"`
- `og:video` com URL do embed
- Ajuda apps externos a detectar conteúdo de vídeo

### 3. **Iframe Oculto**
- Iframe invisível com a URL do Megaembed
- Posicionado fora da tela (`top: -9999px`)
- O RAVE pode escanear iframes na página

### 4. **Elemento `<video>` Fake**
- Tag `<video>` com `src` apontando para o embed
- Atributo `data-rave-video="true"` para sinalização
- Também invisível

### 5. **Script de Detecção Ativa**
- Detecta se está rodando dentro do RAVE
- Tenta comunicar via `window.postMessage`
- Procura por APIs do RAVE (RaveApp)

## Como Testar

### No Aplicativo RAVE:

1. **Abra o RAVE** no seu dispositivo
2. **Abra o navegador interno** do RAVE
3. Navegue até: `http://localhost:3000` (ou seu domínio de produção)
4. Vá para qualquer **página de assistir** (ex: `/watch?ref=550&type=movie`)
5. **Aguarde na página** por alguns segundos
6. O RAVE deve detectar automaticamente e mostrar opção de injetar

### Verificação Manual:

Abra o **DevTools** (F12) e verifique:

```javascript
// Verificar se os elementos foram criados
document.querySelector('iframe[title="RAVE Video Source"]')
document.querySelector('video[data-rave-video="true"]')
document.querySelector('script[type="application/ld+json"]')
```

## Limitações

⚠️ **IMPORTANTE:** O RAVE foi projetado para detectar URLs **diretas de vídeo** (`.mp4`, `.m3u8`, etc.).

Como estamos usando **iframes do Megaembed**, o sucesso não é garantido porque:
- O RAVE pode ter restrições de CORS
- Iframes de terceiros podem estar em sandbox
- O Megaembed pode bloquear acesso externo

## Possíveis Resultados

### ✅ **Cenário Ideal:**
RAVE detecta o iframe/schema e injeta o player

### ⚠️ **Cenário Parcial:**
RAVE detecta mas não consegue acessar o conteúdo (erro de CORS)

### ❌ **Cenário Negativo:**
RAVE não detecta porque o Megaembed não é compatível

## Alternativas para Melhor Compatibilidade

Se a integração atual não funcionar perfeitamente:

1. **Usar um player que exponha URLs diretas**
   - Vimeo Pro
   - JW Player
   - Cloudflare Stream
   - Bunny CDN

2. **Hospedar vídeos próprios**
   - Servidor de streaming próprio
   - CDN com HLS/DASH

3. **API de Scraping (não recomendado)**
   - Extrair URL real do Megaembed
   - ⚠️ Violação dos termos de serviço

## Debug

Para ver os logs de detecção do RAVE, abra o console:

```javascript
// Verificar se está no RAVE
console.log('User Agent:', navigator.userAgent);
console.log('RAVE App:', window.RaveApp);

// Tentar forçar detecção manualmente
if (window.RaveApp) {
  window.RaveApp.setVideo({
    url: 'URL_DO_SEU_VIDEO',
    title: 'TITULO',
    thumbnail: 'URL_DA_THUMB'
  });
}
```

## Suporte

Se nada funcionar, o problema é a **incompatibilidade fundamental** entre:
- Sites que usam **iframes de terceiros** (Megaembed)
- Apps que precisam de **URLs diretas de vídeo** (RAVE)

Nesse caso, a única solução real é **mudar a fonte dos vídeos**.
