# 🚀 Guia de Deploy — ServiçosPro
## Neon (banco) + Vercel (hospedagem)

---

## 1️⃣ Configurar o banco de dados no Neon

1. Acesse https://console.neon.tech
2. Clique no seu projeto → **"SQL Editor"** no menu lateral
3. Cole TODO o conteúdo do arquivo `schema.sql`
4. Clique em **"Run"**
5. Você verá as tabelas criadas + categorias padrão inseridas ✅

**Para pegar a connection string:**
1. No menu lateral, clique em **"Connection Details"**
2. Em "Connection string", selecione **"Pooled connection"**
3. Copie a string — ela tem este formato:
   ```
   postgresql://user:senha@ep-xxxx.us-east-2.aws.neon.tech/dbname?sslmode=require
   ```

---

## 2️⃣ Preparar o projeto

```bash
# Clone ou extraia os arquivos do projeto
cd servicospro

# Instale as dependências
npm install

# Crie o arquivo de variáveis de ambiente
cp .env.example .env.local
```

Edite `.env.local` com seus dados:
```env
DATABASE_URL=sua_connection_string_do_neon_aqui
JWT_SECRET=qualquer_string_longa_e_aleatoria_aqui_ex_minha_chave_secreta_2024
```

**Teste localmente:**
```bash
npm run dev
# Acesse: http://localhost:3000
```

---

## 3️⃣ Deploy na Vercel

### Opção A — Via GitHub (recomendado)

1. Crie um repositório no GitHub e faça push do projeto:
   ```bash
   git init
   git add .
   git commit -m "ServiçosPro inicial"
   git remote add origin https://github.com/seu-usuario/servicospro.git
   git push -u origin main
   ```

2. Acesse https://vercel.com → **"Add New Project"**
3. Importe o repositório do GitHub
4. Na etapa de configuração, adicione as **Environment Variables**:
   - `DATABASE_URL` = sua connection string do Neon
   - `JWT_SECRET` = sua chave secreta
5. Clique em **"Deploy"** ✅

### Opção B — Via CLI da Vercel

```bash
npm i -g vercel
vercel login
vercel

# Quando perguntar sobre environment variables, adicione:
# DATABASE_URL e JWT_SECRET
```

---

## 4️⃣ Configurar variáveis na Vercel (pós-deploy)

Se precisar adicionar ou alterar variáveis:
1. Acesse https://vercel.com → seu projeto → **Settings → Environment Variables**
2. Adicione `DATABASE_URL` e `JWT_SECRET`
3. Clique em **"Redeploy"** para aplicar

---

## 5️⃣ Credenciais padrão

| Campo    | Valor       |
|----------|-------------|
| Usuário  | `admin`     |
| Senha    | `admin123`  |
| Perfil   | Administrador |

> ⚠️ **Importante:** Altere a senha do admin após o primeiro acesso!
> Para isso, delete o admin pelo painel e recadastre com nova senha.

---

## 📁 Estrutura do projeto

```
servicospro/
├── lib/
│   ├── db.js          # Conexão com Neon
│   ├── auth.js        # JWT helpers
│   └── api.js         # Cliente HTTP do frontend
├── pages/
│   ├── index.jsx      # App React completo
│   ├── _app.js
│   └── api/
│       ├── auth/
│       │   ├── login.js
│       │   └── register.js
│       ├── providers/
│       │   ├── index.js     # GET lista, POST criar
│       │   └── [id].js      # GET, PUT, DELETE
│       ├── categories/
│       │   ├── index.js
│       │   └── [id].js
│       ├── ratings/
│       │   └── index.js
│       ├── comments/
│       │   ├── index.js
│       │   └── [id].js      # PATCH moderar
│       └── users/
│           ├── index.js
│           └── [id].js
├── schema.sql         # Execute no Neon SQL Editor
├── .env.example       # Copie para .env.local
├── next.config.js
└── package.json
```

---

## 🔒 Segurança implementada

- ✅ Senhas com hash bcrypt (rounds=10)
- ✅ Autenticação via JWT (válido por 7 dias)
- ✅ Rotas de admin protegidas no backend
- ✅ SSL obrigatório no Neon
- ✅ Comentários com moderação obrigatória
- ✅ UNIQUE constraint — um voto por usuário por prestador

---

## 🐛 Problemas comuns

**"Invalid connection string"**
→ Verifique se a `DATABASE_URL` está correta e tem `?sslmode=require` no final

**"JWT_SECRET is not defined"**
→ Adicione a variável nas Environment Variables da Vercel e faça Redeploy

**Erro 500 nas API routes**
→ Verifique os logs em Vercel → seu projeto → **"Functions"** → clique na função com erro
