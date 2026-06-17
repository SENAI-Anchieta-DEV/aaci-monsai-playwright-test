import { test, expect } from '@playwright/test';

test.describe('Fluxo: Gerenciamento de Usuários', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // 1. Realiza o Login
    await page.getByText('Sou Cliente').click();
    await page.locator('input[type="text"]').fill('gestorpw@monsai.com');
    await page.locator('input[type="password"]').fill('123456');
    await page.getByRole('button', { name: 'Entrar' }).click();

    // 2. Navega para a tela de Gerenciar Usuários
    await page.getByText('Gerenciar Usuários').click();

    // 3. Aguarda a tela carregar completamente antes de liberar para os testes
    await expect(page.getByRole('heading', { name: 'Gerenciar Colaboradores' })).toBeVisible();
    
    // Aguarda o sumiço do spinner de carregamento (se existir)
    await expect(page.locator('.MuiCircularProgress-root')).toBeHidden();
  });

  // -------------------------------------------------------------------------

  test('Deve listar os cadastros na tabela', async ({ page }) => {
    // Busca a tabela
    const tabela = page.locator('table');
    await expect(tabela).toBeVisible();

    // No Playwright, verificamos a quantidade de elementos (linhas) assim:
    const linhas = page.locator('table tbody tr');
    const quantidadeDeLinhas = await linhas.count();
    
    // Garante que existe pelo menos 1 linha na tabela
    expect(quantidadeDeLinhas).toBeGreaterThan(0);
  });

  // -------------------------------------------------------------------------

  test('Deve abrir o modal e alterar a senha de um usuário', async ({ page }) => {
    // Como os botões do Material UI usam Tooltip, o Playwright consegue achá-los pelo nome do Tooltip!
    // Pega o primeiro botão de alterar senha da lista
    const btnAlterarSenha = page.getByRole('button', { name: 'Alterar Senha' }).first();
    await btnAlterarSenha.click();

    // Valida se o modal abriu
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();
    await expect(page.getByText('Redefinir Senha')).toBeVisible();

    // Preenche a nova senha (usando o Label do TextField do MUI)
    await page.getByLabel('Nova Senha').fill('novaSenha123');

    // Clica em Salvar
    await page.getByRole('button', { name: 'Salvar' }).click();

    // Valida se o modal fechou corretamente após salvar
    await expect(modal).toBeHidden();
  });

  // -------------------------------------------------------------------------

  test('Deve inativar um usuário confirmando o alerta nativo', async ({ page }) => {
    page.on('dialog', dialog => {
      expect(dialog.message()).toContain('Tem certeza que deseja remover o acesso');
      dialog.accept(); // Simula o clique em "OK"
    });

    // Clica no primeiro botão de remover que NÃO esteja desabilitado (para não tentar remover a si mesmo)
    const btnRemover = page.locator('button[aria-label="Remover Acesso"]:not([disabled])').first();
    await btnRemover.click();

    // Aqui você pode validar o toast de sucesso se ele existir na sua tela
    await expect(page.getByText('acesso removido')).toBeVisible();
  });

  test('Deve vincular um idoso a um usuário do tipo Familiar', async ({ page }) => {
   // 1. Filtra a tabela para achar a linha do Familiar
  const linhaFamiliar = page.locator('tr').filter({ hasText: 'FAMILIAR' }).first();

  // 2. Clica no ÍCONE usando o texto do Tooltip invisível (aria-label)
  await linhaFamiliar.getByLabel('Vincular idoso').click();

    // 3. Valida se o modal abriu
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();
    await expect(page.getByText('vincular', { exact: true })).toBeVisible();

    // 4. Seleciona o primeiro idoso da lista (index 1, pois o index 0 é a opção vazia)
    // O getByLabel encontra o TextField do MUI pela label descrita na tela
    await page.getByLabel('Selecione o Idoso').selectOption({ index: 1 });

    // 5. Clica no botão de Confirmar (que agora deve estar habilitado)
    await page.getByRole('button', { name: 'Confirmar' }).click();

    // 6. Valida que o modal fechou (sinal de que a API foi chamada)
    await expect(modal).toBeHidden();
  });

  // -------------------------------------------------------------------------

  test('Deve desvincular um idoso de um usuário do tipo Familiar', async ({ page }) => {
    // Tratamento do window.confirm que aparece antes de chamar a API no desvínculo
    page.on('dialog', dialog => {
      expect(dialog.message()).toContain('Deseja remover o vínculo');
      dialog.accept(); // Confirma a exclusão
    });

    const linhaFamiliar = page.locator('tr').filter({ hasText: 'FAMILIAR' }).first();

  // Clica no ÍCONE de quebrar o vínculo
  await linhaFamiliar.getByLabel('Desvincular idoso').click();

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();
    await expect(page.getByText('Remover Vínculo')).toBeVisible();

    // Seleciona o idoso que já estava vinculado
    await page.getByLabel('Idoso Vinculado').selectOption({ index: 1 });

    // Clica no botão vermelho "Desvincular"
    await page.getByRole('button', { name: 'Desvincular' }).click();

    // Valida o fechamento do modal
    await expect(modal).toBeHidden();
  });

});