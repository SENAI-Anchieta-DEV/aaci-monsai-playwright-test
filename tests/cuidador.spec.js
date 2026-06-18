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

async function irParaCadastro(page) {
  await page.getByText('Cadastrar Usuário').click();
  await expect(page.getByRole('heading', { name: 'Novo Colaborador' })).toBeVisible();
}

async function irParaGerenciar(page) {
  await page.getByText('Gerenciar Usuários').click();
  await expect(page.getByRole('heading', { name: 'Gerenciar Colaboradores' })).toBeVisible();
  await expect(page.locator('.MuiCircularProgress-root')).toBeHidden({ timeout: 10000 });
}

// ─── Suite: Cuidador ──────────────────────────────────────────────────────────
test.describe('Fluxo: Cuidador (Criar / Atualizar / Deletar)', () => {

  // ── CRIAR ──────────────────────────────────────────────────────────────────
  test.describe('Criar Cuidador', () => {

    test.beforeEach(async ({ page }) => {
      await login(page);
      await irParaCadastro(page);
    });

    test('Deve cadastrar um cuidador com dados válidos', async ({ page }) => {
      await page.getByLabel('Nome Completo').fill('Carlos Cuidador Teste');
      await page.getByLabel('CPF').fill('321.654.987-01');

      await page.getByLabel('Tipo de Acesso').click();
      await page.getByRole('option', { name: 'CUIDADOR' }).click();

      await page.getByLabel('E-mail').fill('cuidador.teste@monsai.com');
      await page.getByLabel('Senha Provisória').fill('senha123');

      await page.getByRole('button', { name: 'Finalizar Cadastro' }).click();

      await expect(page.getByText('Sucesso!', { exact: true })).toBeVisible({ timeout: 8000 });
    });

    test('Não deve cadastrar com campos obrigatórios vazios', async ({ page }) => {
      await page.getByLabel('Tipo de Acesso').click();
      await page.getByRole('option', { name: 'CUIDADOR' }).click();

      await page.getByRole('button', { name: 'Finalizar Cadastro' }).click();

      await expect(
        page.locator('p.MuiFormHelperText-root', { hasText: 'O nome deve ter pelo menos 3 letras.' })
      ).toBeVisible();
    });

    test('Não deve cadastrar com e-mail inválido', async ({ page }) => {
      await page.getByLabel('Nome Completo').fill('Cuidador Email Errado');
      await page.getByLabel('CPF').fill('321.654.987-01');

      await page.getByLabel('Tipo de Acesso').click();
      await page.getByRole('option', { name: 'CUIDADOR' }).click();

      await page.getByLabel('E-mail').fill('email-invalido');
      await page.getByLabel('Senha Provisória').fill('senha123');

      await page.getByRole('button', { name: 'Finalizar Cadastro' }).click();

      await expect(
        page.locator('p.MuiFormHelperText-root', { hasText: /e-mail/i })
      ).toBeVisible();
    });

    test('Não deve cadastrar com senha menor que 6 caracteres', async ({ page }) => {
      await page.getByLabel('Nome Completo').fill('Cuidador Senha Fraca');
      await page.getByLabel('CPF').fill('321.654.987-01');

      await page.getByLabel('Tipo de Acesso').click();
      await page.getByRole('option', { name: 'CUIDADOR' }).click();

      await page.getByLabel('E-mail').fill('cuidador@monsai.com');
      await page.getByLabel('Senha Provisória').fill('123');

      await page.getByRole('button', { name: 'Finalizar Cadastro' }).click();

      await expect(
        page.locator('p.MuiFormHelperText-root', { hasText: /senha/i })
      ).toBeVisible();
    });

  });

  // ── ATUALIZAR (Alterar Senha) ───────────────────────────────────────────────
  test.describe('Atualizar Cuidador', () => {

    test.beforeEach(async ({ page }) => {
      await login(page);
      await irParaGerenciar(page);
    });

    test('Deve abrir o modal de redefinição de senha para um cuidador', async ({ page }) => {
      const linhaCuidador = page.locator('tr').filter({ hasText: 'CUIDADOR' }).first();
      await expect(linhaCuidador).toBeVisible();

      // Tooltip title="Alterar Senha" → acessível via getByRole
      await linhaCuidador.getByRole('button', { name: 'Alterar Senha' }).click();

      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByText('Redefinir Senha')).toBeVisible();
    });

    test('Deve alterar a senha de um cuidador com sucesso', async ({ page }) => {
      const linhaCuidador = page.locator('tr').filter({ hasText: 'CUIDADOR' }).first();
      await linhaCuidador.getByRole('button', { name: 'Alterar Senha' }).click();

      await page.getByLabel('Nova Senha').fill('novaSenha456');
      await page.getByRole('button', { name: 'Salvar' }).click();

      await expect(page.getByRole('dialog')).toBeHidden();
      await expect(page.getByText('Senha atualizada!', { exact: true })).toBeVisible({ timeout: 8000 });
    });

    test('Não deve salvar senha com menos de 6 caracteres', async ({ page }) => {
      const linhaCuidador = page.locator('tr').filter({ hasText: 'CUIDADOR' }).first();
      await linhaCuidador.getByRole('button', { name: 'Alterar Senha' }).click();

      await page.getByLabel('Nova Senha').fill('123');
      await page.getByRole('button', { name: 'Salvar' }).click();

      // Modal permanece aberto + toast de erro
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByText('Senha fraca', { exact: true })).toBeVisible({ timeout: 8000 });
    });

    test('Deve cancelar a alteração de senha sem salvar', async ({ page }) => {
      const linhaCuidador = page.locator('tr').filter({ hasText: 'CUIDADOR' }).first();
      await linhaCuidador.getByRole('button', { name: 'Alterar Senha' }).click();

      await page.getByLabel('Nova Senha').fill('senhaQueNaoSalva');
      await page.getByRole('button', { name: 'Cancelar' }).click();

      await expect(page.getByRole('dialog')).toBeHidden();
    });

  });

  // ── DELETAR ────────────────────────────────────────────────────────────────
  test.describe('Deletar Cuidador', () => {

    test.beforeEach(async ({ page }) => {
      await login(page);
      await irParaGerenciar(page);
    });

    test('Deve remover o acesso de um cuidador ao confirmar', async ({ page }) => {
      const linhaCuidador = page.locator('tr').filter({ hasText: 'CUIDADOR' }).first();
      await expect(linhaCuidador).toBeVisible();

      page.on('dialog', (dialog) => dialog.accept());

      // Tooltip title="Remover Acesso" nos botões não desabilitados
      await linhaCuidador.getByRole('button', { name: 'Remover Acesso' }).click();

      await expect(page.getByText('Acesso removido', { exact: true })).toBeVisible({ timeout: 8000 });
    });

    test('Deve cancelar a remoção ao recusar o alerta nativo', async ({ page }) => {
      const totalAntes = await page.locator('tr').filter({ hasText: 'CUIDADOR' }).count();

      page.on('dialog', (dialog) => dialog.dismiss());

      const linhaCuidador = page.locator('tr').filter({ hasText: 'CUIDADOR' }).first();
      await linhaCuidador.getByRole('button', { name: 'Remover Acesso' }).click();

      const totalDepois = await page.locator('tr').filter({ hasText: 'CUIDADOR' }).count();
      expect(totalDepois).toBe(totalAntes);
    });

  });

});