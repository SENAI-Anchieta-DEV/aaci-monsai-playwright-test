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
  const primeiraLinha = page.locator('table tbody tr').first();
  await primeiraLinha.locator('button').nth(0).click(); // 1º botão = Alterar Senha

  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible();
  
  await page.getByLabel('Nova Senha').fill('novaSenha123');
  await page.getByRole('button', { name: 'Salvar' }).click();
  
  await expect(modal).toBeHidden();
});

test('Deve criar, inativar e verificar a remoção de um usuário', async ({ page }) => {
  await page.getByText('Cadastrar Usuário').click();
  
  await page.locator('input[name="nome"]').fill('Usuário de Teste Temporário');
  await page.locator('input[name="email"]').fill('teste_inativar@monsai.com');
  await page.locator('input[name="cpf"]').fill('000.000.000-00'); // ajuste o CPF
  await page.locator('input[name="senha"]').fill('senha123');
  
  // Seleciona o tipo — ajuste o seletor conforme o componente real
// Abre o dropdown
await page.locator('[name="tipoUsuario"]').click();

// Clica na opção desejada no menu que aparece
await page.getByRole('option', { name: 'CUIDADOR' }).click();

  await page.getByRole('button', { name: 'Finalizar Cadastro' }).click();

  // Aguarda o redirecionamento de volta pra lista
  await expect(page.getByRole('heading', { name: 'Gerenciar Colaboradores' })).toBeVisible({ timeout: 10000 });

  const linhaTeste = page.locator('tr').filter({ hasText: 'teste_inativar@monsai.com' });
  await expect(linhaTeste).toBeVisible({ timeout: 10000 }); // garante que a linha apareceu antes de clicar
  
  page.on('dialog', dialog => dialog.accept());
  await linhaTeste.locator('button').last().click();

  await expect(linhaTeste).toBeHidden({ timeout: 10000 });
});

test('Deve vincular um idoso a um usuário do tipo Familiar', async ({ page }) => {
  const linhaFamiliar = page.locator('tr').filter({ hasText: 'FAMILIAR' }).first();
  await linhaFamiliar.locator('button').nth(1).click(); // 2º botão = Vincular idoso

  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible();

  await page.getByLabel('Selecione o Idoso').selectOption({ index: 1 });
  await page.getByRole('button', { name: 'Confirmar' }).click();
  
  await expect(modal).toBeHidden();
});

test('Deve desvincular um idoso de um usuário do tipo Familiar', async ({ page }) => {
  page.on('dialog', dialog => dialog.accept());

  const linhaFamiliar = page.locator('tr').filter({ hasText: 'FAMILIAR' }).first();
  await linhaFamiliar.locator('button').nth(2).click(); // 3º botão = Desvincular idoso

  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible();

  await page.getByLabel('Idoso Vinculado').selectOption({ index: 1 });
  await page.getByRole('button', { name: 'Desvincular' }).click();

  await expect(modal).toBeHidden();
});

});