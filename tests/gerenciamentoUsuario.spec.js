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
    // Procura diretamente pelo atributo gerado pelo Tooltip do MUI
    const btnAlterarSenha = page.locator('button[aria-label="Alterar Senha"]').first();
    await btnAlterarSenha.click();

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();
    
    await page.getByLabel('Nova Senha').fill('novaSenha123');
    await page.getByRole('button', { name: 'Salvar' }).click();
    
    await expect(modal).toBeHidden();
  });

  // -------------------------------------------------------------------------

  test('Deve inativar um usuário confirmando o alerta nativo', async ({ page }) => {
    page.on('dialog', dialog => dialog.accept()); 

    // Clica no botão de remover acesso que NÃO seja do utilizador logado
    const btnRemover = page.locator('button[aria-label="Remover Acesso"]:not([disabled])').first();
    await btnRemover.click();
  });

  // -------------------------------------------------------------------------

  test('Deve vincular um idoso a um usuário do tipo Familiar', async ({ page }) => {
    // ⚠️ ATENÇÃO: Tem de existir um 'FAMILIAR' na base de dados para isto funcionar!
    const linhaFamiliar = page.locator('tr').filter({ hasText: 'FAMILIAR' }).first();

    // Caça o ícone exatamente pelo aria-label do Tooltip dentro daquela linha
    await linhaFamiliar.locator('button[aria-label="Vincular idoso"]').click();

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    await page.getByLabel('Selecione o Idoso').selectOption({ index: 1 });
    await page.getByRole('button', { name: 'Confirmar' }).click();
    
    await expect(modal).toBeHidden();
  });

  // -------------------------------------------------------------------------

  test('Deve desvincular um idoso de um usuário do tipo Familiar', async ({ page }) => {
    page.on('dialog', dialog => dialog.accept());

    const linhaFamiliar = page.locator('tr').filter({ hasText: 'FAMILIAR' }).first();

    // Caça o ícone de quebrar o vínculo
    await linhaFamiliar.locator('button[aria-label="Desvincular idoso"]').click();

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    await page.getByLabel('Idoso Vinculado').selectOption({ index: 1 });
    await page.getByRole('button', { name: 'Desvincular' }).click();

    await expect(modal).toBeHidden();
  });

});