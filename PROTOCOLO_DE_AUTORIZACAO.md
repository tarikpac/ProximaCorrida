# PROTOCOLO DE AUTORIZAÇÃO E RESPEITO (CRÍTICO)

## 1. Regra de Ouro: Autorização Prévia Obrigatória
**NUNCA**, sob nenhuma circunstância, o agente deve executar comandos que alterem o ambiente de produção ou o repositório remoto (`main` branch) sem apresentar o plano detalhado e receber um "SIM" explícito do usuário.

### Comandos Restritos (Requerem 'De Acordo' Prévio):
*   `git push`
*   `git commit` (na branch main)
*   `git merge` (para a branch main)
*   Deploys manuais ou automáticos
*   Alterações diretas em banco de dados de produção

## 2. Fluxo de Trabalho e Continuidade (Obrigatório)
1.  **Diagnóstico & Planejamento:** Entender o problema e definir o plano de ação.
2.  **Execução Autônoma (Chain of Thought):** Uma vez autorizado o plano ou tarefa, o agente deve executar **todos** os passos intermediários (criação de arquivos, comandos, testes, correções de erros, iterações) **sem interromper** o usuário.
    *   **NÃO** pare para perguntar "posso continuar?" ou "vou fazer isso agora" a cada passo.
    *   **NÃO** encerre o turno se você ainda tem passos lógicos a seguir para concluir o objetivo imediato.
    *   Use o pensamento contínuo para iterar sobre problemas até resolvê-los.
3.  **Ponto de Verificação (Stop Conditions):** O agente só deve parar e devolver o controle ao usuário quando:
    *   A tarefa macro ou o conjunto de tarefas acordado estiver **100% concluído**.
    *   Ocorrer um **erro bloqueante** que você não consegue resolver sozinho após tentativas.
    *   For necessária uma **ação crítica irreversível em PRODUÇÃO** (cf. Item 1).
    *   Houver uma dúvida de negócio/produto que exige decisão do usuário.

## 3. Justificativa
Este protocolo existe para garantir que a inteligência do agente seja usada para potenciar o desenvolvimento, mas que o controle estratégico e a segurança do projeto permaneçam 100% nas mãos do usuário. Evita "alucinações" destrutivas e alterações indesejadas em um projeto que já está em estágio avançado/produção.

## 4. Exceção: Operações de Leitura (Permitidas)
Ações de leitura e análise **NÃO** exigem autorização prévia, pois não oferecem risco ao ambiente de produção. Isso inclui:
*   `read_file`, `list_dir`, `grep_search`
*   Status de comandos
*   Testes locais inofensivos (leitura de logs)
Isso permite que o agente diagnostique problemas rapidamente antes de propor uma solução interventiva.

## 5. Uso de Ferramentas MCP (GitHub, Render, Upstash)
O projeto conta com MCPs ativos para as três ferramentas principais de infraestrutura.
*   **Disponibilidade:** Podem ser utilizados a qualquer momento para buscar contexto, investigar estados atuais ou validar configurações.
*   **Ações Críticas:** Qualquer execução via MCP que envolva ações destrutivas ou modificações críticas (ex: `delete_database`, `delete_repo`, alterações de vars de ambiente em prod) segue a **Regra de Ouro** (Item 1) e **EXIGE autorização explícita** do usuário antes de ser executada.

## 6. Fluxo de Desenvolvimento vs. Produção
*   **Dev First:** Todas as alterações, novas features ou correções devem ser aplicadas e testadas primeiro no **ambiente de desenvolvimento local**.
*   **Promoção para Prod:** A promoção de código para produção (merge para `main`, deploy) ocorre **exclusivamente** após validação e com autorização explícita do usuário.

## 7. Inicialização do Ambiente (Pré-Implementação)
Sempre que for iniciado um fluxo de implementação de tarefas (como ao usar `implement-tasks.md` ou iniciar uma sprint de código):
1.  **Verificação de Ambiente:** O agente deve verificar se o ambiente local está ativo e saudável.
2.  **Inicialização Automática (se necessário):** Propor/Executar os comandos para subir o ambiente local (ex: `docker-compose up -d`, `npm run dev`, verificar conexão com banco local) **ANTES** de tentar escrever ou testar qualquer código.
3.  **Garantia de Estabilidade:** Não iniciar modificações de código se o ambiente base não estiver rodando corretamente.

## 8. Continuidade e Comunicação
*   **Pensamento Contínuo:** Ao trabalhar em tarefas complexas ou correções, o agente **NÃO** deve encerrar o turno ou solicitar input do usuário ("continue") se ainda estiver no meio de um processo de raciocínio ou execução, a menos que haja um erro bloqueante real ou precise de uma decisão crítica.
*   **Proatividade:** Continue processando, corregindo e iterando sobre os problemas até que a tarefa imediata esteja concluída ou um ponto de verificação lógico seja alcançado. Não pare para perguntar "posso continuar?" a cada micro-passo.


## 9. Padrão de Commits (Estilo Pessoal)
*   **Idioma:** Sempre em **Português do Brasil (PT-BR)**.
*   **Tom de Voz:** Humano, pessoal, direto, como um desenvolvedor conversando com outro. Evite formality excessiva.
*   **Exemplos:**
    *   *Ruim:* "Fix: Resolved filtering logic bug in events service."
    *   *Bom:* "Arrumei a lógica de filtro que tava quebrada no service de eventos"
    *   *Ruim:* "Feat: Added new scraper scheduler."
    *   *Bom:* "Adicionei o agendador do scraper pra rodar todo dia"
