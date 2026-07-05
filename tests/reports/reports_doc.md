### Explicação dos Testes Focados em Relatórios

0. **Adicionar Tokens**: Adiciona tokens ao saldo do usuário.
1. **Increment Record**: Incrementa um registro de visualização para um único usuário.
2. **Batch Increment Records**: Incrementa registros de visualização em lote para vários usuários.
3. **Get Consolidated By Movie**: Obtém registros consolidados por filme.
4. **Get Consolidated By Month**: Obtém registros consolidados por mês.
5. **Get Consolidated By Year**: Obtém registros consolidados por ano.
6. **Get Transactions By Month**: Obtém transações por mês.
7. **Get Transactions By Year**: Obtém transações por ano.
8. **Get Daily Transactions**: Obtém transações diárias.
9. **Get User Summary**: Obtém um resumo das atividades do usuário.
10. **Get Total Transactions By User**: Obtém o total de transações por usuário.
11. **Get User Details**: Obtém detalhes completos do usuário.
12. **Get Monthly Yearly Report**: Obtém um relatório mensal e anual consolidado.

### Executando os Testes

1. **Execute o script para rodar os testes e gerar o relatório:**

   ```sh
   node reports.js
   ```

2. **Verifique o relatório**:
   - O relatório será salvo no arquivo `report.json` e conterá tanto os dados enviados quanto os dados recebidos para cada requisição, facilitando a verificação detalhada das operações de geração de relatórios.
