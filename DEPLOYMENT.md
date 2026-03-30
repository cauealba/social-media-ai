# Social Media AI - Deploy Guide

## Pré-requisitos
- Conta no GitHub
- Conta no Vercel (gratuita)
- Ter as 3 chaves de API:
  - `ANTHROPIC_API_KEY` (Claude)
  - `APIFY_API_TOKEN` (Instagram scraper)
  - `GEMINI_API_KEY` (Video analysis)

---

## Passo 1: Criar repositório no GitHub

1. Acesse [github.com/new](https://github.com/new)
2. Preencha:
   - **Repository name**: `social-media-ai` (ou outro nome)
   - **Description**: "AI tool for analyzing viral Instagram Reels"
   - **Visibility**: Private (recomendado) ou Public
3. Clique **Create repository**

---

## Passo 2: Fazer push do código

Execute no seu terminal:

```bash
cd /Users/cauealbacieplak/Downloads/social-media-main

# Remova o remote antigo (se houver)
git remote remove origin

# Adicione o repositório criado (substitua SEU_USUARIO)
git remote add origin https://github.com/SEU_USUARIO/social-media-ai.git
git branch -M main
git push -u origin main
```

---

## Passo 3: Deploy no Vercel

1. Acesse [vercel.com](https://vercel.com)
2. Clique **Sign Up** e conecte com GitHub
3. Após autenticar, clique **Import Project**
4. Selecione o repositório `social-media-ai`
5. Clique **Import**
6. Na tela de **Environment Variables**, adicione:
   - `ANTHROPIC_API_KEY` = sua chave
   - `APIFY_API_TOKEN` = seu token
   - `GEMINI_API_KEY` = sua chave
7. Clique **Deploy**

---

## Pronto! 🚀

Depois do deploy:
- URL: `https://seu-projeto.vercel.app`
- Seus sócios acessam pelo navegador
- Cada push ao GitHub = novo deploy automático

---

## Compartilhe com seus sócios

```
Acesse: https://seu-projeto.vercel.app
```

Eles podem usar sem instalar nada!

---

## Troubleshooting

**Se der erro de build:**
- Verifique se as variáveis de ambiente estão corretas
- Veja os logs no dashboard do Vercel

**Se os vídeos não carregam:**
- Confirme que `APIFY_API_TOKEN` está correto
- `GEMINI_API_KEY` está ativo

**Para adicionar mais sócios:**
Basta compartilhar a URL! Não precisa fazer mais nada.
