# Load Tester Worker

Este projeto é um serviço de "worker" (trabalhador) em Node.js, construído com TypeScript, responsável por processar e executar testes de carga de forma assíncrona. Ele utiliza a biblioteca [BullMQ](https://bullmq.io/) para gerenciar uma fila de trabalhos (jobs) baseada em Redis.

## Visão Geral

O worker foi projetado para ser robusto e escalável. Ele escuta uma fila de jobs, onde cada job contém os parâmetros para um teste de carga específico (URL alvo, número de requisições, concorrência, etc.). Ao receber um job, o worker executa o teste e, ao final, envia os resultados para uma outra fila, para que possam ser processados e armazenados por outro serviço.

## Arquitetura

A arquitetura é baseada em um sistema de filas para garantir o desacoplamento e a resiliência do sistema:

1.  **Fila de Jobs (`load-tester-jobs`):** Um serviço externo (uma API, por exemplo) adiciona jobs a esta fila. Cada job é uma solicitação para executar um teste de carga.
2.  **Worker (Este Projeto):** O worker consome os jobs da fila `load-tester-jobs`. A lógica de execução do teste é encapsulada no `RunLoadTestUseCase`.
3.  **Fila de Resultados (`load-tester-results`):** Após a execução de um teste, o worker adiciona um novo job contendo os resultados completos (estatísticas, erros, etc.) a esta fila.
4.  **Processador de Resultados (Outro Serviço):** Um segundo worker (fora do escopo deste projeto) consome a fila de resultados para, por exemplo, salvar os dados em um banco de dados, notificar usuários, etc.

Este design permite que a execução dos testes (que pode ser demorada) não bloqueie o serviço principal e que o armazenamento dos resultados seja tratado de forma independente.

## Funcionalidades

- **Processamento Assíncrono:** Utiliza BullMQ para processar jobs em segundo plano, sem bloquear a aplicação principal.
- **Configuração Flexível de Testes:** Permite configurar URL, método HTTP, número de requisições, concorrência, payload, headers e timeout para cada teste.
- **Tratamento de Erros Robusto:** Um erro em um único job é capturado e registrado, mas não derruba o serviço. O BullMQ pode ser configurado para tentar reexecutar jobs que falharam.
- **Código Modular:** A lógica de negócio (`UseCase`) é separada da infraestrutura de filas (`Processor`), seguindo princípios de Clean Architecture.

## Pré-requisitos

- Node.js (versão 16 ou superior)
- NPM ou Yarn
- Um servidor Redis em execução.

## Instalação e Configuração

1.  Clone o repositório:
    ```bash
    git clone <url-do-seu-repositorio>
    cd load-tester-worker
    ```

2.  Instale as dependências:
    ```bash
    npm install
    ```

3.  Crie um arquivo de configuração de ambiente `.env` na raiz do projeto, baseado no arquivo `.env.example`:
    ```bash
    cp .env.example .env
    ```

4.  Edite o arquivo `.env` com as informações de conexão do seu servidor Redis:
    ```ini
    # .env
    REDIS_HOST=127.0.0.1
    REDIS_PORT=6379
    ```

## Como Executar o Worker

Para iniciar o worker e começar a processar jobs da fila, execute o seguinte comando:

```bash
npm start
```

*Nota: Adicione o script `start` ao seu `package.json` para facilitar a execução:*
```json
// package.json
"scripts": {
  "start": "ts-node src/index.ts",
  "benchmark": "ts-node benchmarks/runLoadTest.benchmark.ts"
}
```

O console exibirá uma mensagem indicando que o worker está rodando e aguardando por novos jobs.

## Executando com Docker (Recomendado)

Para facilitar a implantação e garantir um ambiente consistente, o projeto está configurado para ser executado em um container Docker.

### Pré-requisitos

*   **Docker** instalado e em execução.

### Build da Imagem

Na raiz do diretório `load-tester-worker`, execute o comando abaixo para construir a imagem:

```sh
docker build -t load-tester-worker .
```

### Executando o Container

Para executar o worker, você precisa garantir que ele consiga se conectar a uma instância do Redis.

**Exemplo (conectando a um Redis na rede do host):**

Se você tem um Redis rodando localmente (`127.0.0.1:6379`), pode usar a rede do host para permitir que o container o acesse.

```sh
docker run --rm --name my-worker --network="host" load-tester-worker
```

**Exemplo (usando variáveis de ambiente para um Redis customizado):**

```sh
docker run --rm --name my-worker \
  -e REDIS_HOST=seu-host-redis \
  -e REDIS_PORT=sua-porta-redis \
  health-check-worker
```
> **Nota:** Para um ambiente de desenvolvimento ou produção mais robusto, é altamente recomendado o uso do `docker-compose` para orquestrar o serviço do worker e do Redis juntos.

## Como Funciona (Estrutura do Código)

- **`src/index.ts`**: Ponto de entrada da aplicação. Ele inicializa a conexão com o Redis, instancia o `LoadTestProcessor` e o `RunLoadTestUseCase`, e inicia o `Worker` do BullMQ para escutar a fila `load-tester-jobs`.

- **`src/infrastructure/jobs/loadTest.processor.ts`**: Contém a classe `LoadTestProcessor`. Seu método `loadTestProcessor` é a função que o BullMQ executa para cada job. Ele:
    1.  Extrai e valida os dados do job.
    2.  Define valores padrão para parâmetros opcionais (como método, headers, etc.).
    3.  Chama `this.useCase.execute(...)` para realizar o teste.
    4.  Adiciona o resultado na fila `load-tester-results`.
    5.  Captura erros, loga os detalhes e relança o erro para que o BullMQ possa marcar o job como falho.

- **`src/services/runLoadTest.usecase.ts`**: (Inferido) Contém a lógica de negócio principal. É responsável por orquestrar as requisições HTTP concorrentes e calcular as estatísticas de performance (tempo total, requisições por segundo, latência média, etc.).

- **`src/infrastructure/config/index.ts`**: Centraliza as configurações da aplicação, como os nomes das filas e os dados de conexão do Redis, lendo-os do arquivo `.env`.

