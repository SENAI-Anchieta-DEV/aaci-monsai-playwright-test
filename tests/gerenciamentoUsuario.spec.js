import { test, expect } from '@playwright/test';

// ─── Helper: login padrão ─────────────────────────────────────────────────────
async function login(page) {
  await page.goto('/');
  await page.getByText('Sou Cliente').click();
  await page.locator('input[type="text"]').fill('gestorpw1@monsai.com');
  await page.locator('input[type="password"]').fill('123456');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByText('Autenticando...')).toBeHidden({ timeout: 10000 });
}

// ─── Helper: navegar para Gerenciar Usuários ──────────────────────────────────
async function irParaGerenciar(page) {
  await page.getByText('Gerenciar Usuários').click();
  await expect(page.getByRole('heading', { name: 'Gerenciar Colaboradores' })).toBeVisible();
  await expect(page.locator('.MuiCircularProgress-root')).toBeHidden({ timeout: 10000 });
}

// ─── Suite ────────────────────────────────────────────────────────────────────
test.describe('Fluxo: Gerenciamento de Usuários', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
    await irParaGerenciar(page);
  });

  // ── Listar ─────────────────────────────────────────────────────────────────
  test('Deve listar os cadastros na tabela', async ({ page }) => {
    const tabela = page.locator('table');
    await expect(tabela).toBeVisible();

    const linhas = page.locator('table tbody tr');
    expect(await linhas.count()).toBeGreaterThan(0);
  });

  // ── Alterar Senha ──────────────────────────────────────────────────────────
  test('Deve abrir o modal e alterar a senha de um usuário', async ({ page }) => {
    // Pega o botão pelo nome acessível (Tooltip title="Alterar Senha")
    await page.getByRole('button', { name: 'Alterar Senha' }).first().click();

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    await page.getByLabel('Nova Senha').fill('novaSenha123');
    await page.getByRole('button', { name: 'Salvar' }).click();

    await expect(modal).toBeHidden();
  });

  // ── Criar → Inativar ────────────────────────────────────────────────────────
  test('Deve criar, inativar e verificar a remoção de um usuário', async ({ page }) => {
    // Gera e-mail único por execução para não colidir com dados existentes
    const email = `teste.${Date.now()}@monsai.com`;

    // 1. Navega para o cadastro
    await page.getByText('Cadastrar Usuário').click();
    await expect(page.getByRole('heading', { name: 'Novo Colaborador' })).toBeVisible();

    // 2. Preenche o formulário
    await page.getByLabel('Nome Completo').fill('Usuário Temporário Playwright');
    await page.getByLabel('CPF').fill('529.982.247-25'); // CPF válido reservado para testes
    await page.getByLabel('E-mail').fill(email);
    await page.getByLabel('Senha Provisória').fill('senha123');

    // MUI Select com MenuItem — clicar no campo e depois na opção
    await page.getByLabel('Tipo de Acesso').click();
    await page.getByRole('option', { name: 'CUIDADOR' }).click();

    // 3. Submete
    const [response] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/usuarios') && res.ok()),
      page.getByRole('button', { name: 'Finalizar Cadastro' }).click(),
    ]);
    expect(response.ok()).toBeTruthy();

    // 4. Volta para Gerenciar Usuários (CadastrarUsuario não redireciona sozinho)
    await irParaGerenciar(page);

    // 5. Localiza a linha pelo e-mail único e remove o acesso
    const linhaTeste = page.locator('tr').filter({ hasText: email });
    await expect(linhaTeste).toBeVisible({ timeout: 10000 });

    page.on('dialog', (dialog) => dialog.accept());
    await linhaTeste.getByRole('button', { name: 'Remover Acesso' }).click();

    // 6. Linha deve sumir da tabela
    await expect(linhaTeste).toBeHidden({ timeout: 10000 });
  });

  // ── Vincular Idoso ─────────────────────────────────────────────────────────
  test('Deve vincular um idoso a um usuário do tipo Familiar', async ({ page }) => {
    // ⚠️ Precisa existir um FAMILIAR no banco para este teste funcionar
    const linhaFamiliar = page.locator('tr').filter({ hasText: 'FAMILIAR' }).first();
    await expect(linhaFamiliar).toBeVisible();

    await linhaFamiliar.getByRole('button', { name: 'Vincular idoso' }).click();

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    await page.getByLabel('Selecione o Idoso').selectOption({ index: 1 });
    await page.getByRole('button', { name: 'Confirmar' }).click();

    await expect(modal).toBeHidden();
  });

  // ── Desvincular Idoso ──────────────────────────────────────────────────────
  test('Deve desvincular um idoso de um usuário do tipo Familiar', async ({ page }) => {
    // ⚠️ Precisa existir um FAMILIAR com idoso vinculado no banco
    const linhaFamiliar = page.locator('tr').filter({ hasText: 'FAMILIAR' }).first();
    await expect(linhaFamiliar).toBeVisible();

    await linhaFamiliar.getByRole('button', { name: 'Desvincular idoso' }).click();

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    await page.getByLabel('Idoso Vinculado').selectOption({ index: 1 });
    await page.getByRole('button', { name: 'Desvincular' }).click();

    await expect(modal).toBeHidden();
  });

});