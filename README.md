# DOJO — Caminho da Coerência (MVP 0.1)

Aplicativo web instalável (PWA) com visual inspirado em um dojo, armazenamento local e sincronização opcional com Supabase.

## Recursos incluídos
- Painel diário com cinco compromissos iniciais e barra de progresso.
- Criar e remover hábitos.
- Diário de coerência: vitória, dificuldade e aprendizado.
- Metas com próxima ação e marcação de conclusão.
- Código pessoal com oito princípios.
- Revisão semanal com seis perguntas.
- Indicadores básicos da semana.
- Exportação de backup JSON.
- Login por e-mail/senha e sincronização Supabase.
- Layout responsivo e suporte básico offline via service worker.

## Testar localmente
O PWA e módulos ES precisam ser servidos por HTTP(S), não abrindo `index.html` diretamente.
1. Instale Python 3.
2. Na pasta do projeto, execute: `python -m http.server 8000`
3. Abra `http://localhost:8000`.

## Publicar para instalar no Android
Hospede a pasta em um serviço HTTPS (por exemplo, GitHub Pages, Netlify ou Vercel).
No Android, abra a URL no Chrome e escolha **Instalar app** ou **Adicionar à tela inicial**.
O projeto ainda não é um APK nativo nem foi publicado na Play Store.

## Configurar sincronização na nuvem (Supabase)
1. Crie um projeto em https://supabase.com/.
2. No painel do projeto, copie a Project URL e a chave pública `anon`/`publishable`.
   **Nunca coloque a chave `service_role` no aplicativo.**
3. Abra `supabase/schema.sql` no SQL Editor do Supabase e execute o script.
4. Publique o site em HTTPS, abra o DOJO e entre em **Minha conta**.
5. Cole Project URL e chave pública e salve.
6. Crie uma conta com e-mail e senha. Se a confirmação de e-mail estiver ativa, confirme pelo e-mail recebido.
7. Entre. Os dados serão carregados/salvos na tabela `dojo_profiles`; as políticas RLS limitam cada usuário à própria linha.

## Observações importantes
- Sem Supabase configurado, os dados ficam no `localStorage` do navegador/aparelho.
- O MVP sincroniza o estado completo do perfil em uma linha por usuário. Para uso multi-dispositivo simultâneo intenso, a próxima versão deve migrar para tabelas normalizadas e resolução de conflitos.
- A primeira versão não possui notificações push, biometria, recuperação de senha customizada ou publicação na Play Store.
- Faça exportações periódicas em JSON enquanto testa.
- Este é um protótipo inicial; revise segurança, acessibilidade e políticas de privacidade antes de distribuição pública.
