import { test, expect } from '@playwright/test';

// ─── Helper: login padrão ─────────────────────────────────────────────────────
async function login(page) {
  await page.goto('/');
  await page.getByText('Sou Cliente').click();
  await page.locator('input[type="text"]').fill('gestorpw@monsai.com');
  await page.locator('input[type="password"]').fill('123456');
  await page.getByRole('button', { name: 'Entrar' }).click();
}

// ─── Suite: Idoso ─────────────────────────────────────────────────────────────
test.describe('Fluxo: Idoso (Criar / Atualizar / Deletar)', () => {

  // ── CRIAR ──────────────────────────────────────────────────────────────────
  test.describe('Criar Idoso', () => {

    test.beforeEach(async ({ page }) => {
      await login(page);
      await page.getByText('Cadastrar Idoso').click();
      await expect(page.getByRole('heading', { name: 'Vincular Novo Idoso (IoT)' })).toBeVisible();
    });

    test('Deve cadastrar um idoso com dados válidos', async ({ page }) => {
      await page.getByLabel('Nome do Idoso').fill('Maria Souza Teste');
      await page.getByLabel('CPF').fill('123.456.789-09');
      await page.getByLabel('ID da Pulseira (Serial)').fill('TST-001');
      await page.getByLabel('Email do Familiar').fill('familiar@teste.com');

      await page.getByRole('button', { name: 'Cadastrar e Ativar Monitoramento' }).click();

      // Espera o toast de sucesso aparecer
      await expect(page.getByText('Idoso cadastrado!')).toBeVisible();
    });

    test('Não deve cadastrar com campos obrigatórios vazios', async ({ page }) => {
      await page.getByRole('button', { name: 'Cadastrar e Ativar Monitoramento' }).click();

      // Validação client-side deve mostrar erros nos campos
      await expect(page.getByText(/Nome deve ter/i)).toBeVisible();
    });

    test('Não deve cadastrar com CPF inválido', async ({ page }) => {
      await page.getByLabel('Nome do Idoso').fill('João Inválido');
      await page.getByLabel('CPF').fill('000.000.000-00');
      await page.getByLabel('ID da Pulseira (Serial)').fill('TST-999');
      await page.getByLabel('Email do Familiar').fill('teste@teste.com');

      await page.getByRole('button', { name: 'Cadastrar e Ativar Monitoramento' }).click();

      await expect(page.getByText(/CPF/i)).toBeVisible();
    });

  });

  // ── ATUALIZAR ──────────────────────────────────────────────────────────────
  test.describe('Atualizar Idoso', () => {

    test.beforeEach(async ({ page }) => {
      await login(page);
      // Edição de idoso fica na tela de Monitoramento
      await page.getByText('Monitoramento').click();
      await expect(page.getByRole('heading', { name: 'Central de Monitoramento' })).toBeVisible();
      // Aguarda os cards carregarem
      await expect(page.locator('.MuiCircularProgress-root')).toBeHidden({ timeout: 10000 });
    });

    test('Deve abrir o modal de edição ao clicar no ícone de editar', async ({ page }) => {
      const btnEditar = page.locator('button:has([data-testid="EditIcon"])').first();
      await expect(btnEditar).toBeVisible();
      await btnEditar.click();

      const modal = page.getByRole('dialog').or(
        page.locator('.MuiModal-root')
      ).first();
      await expect(modal).toBeVisible();
      await expect(page.getByLabel('Nome completo')).toBeVisible();
    });

    test('Deve atualizar o nome do idoso com sucesso', async ({ page }) => {
      const btnEditar = page.locator('button:has([data-testid="EditIcon"])').first();
      await btnEditar.click();

      const campoNome = page.getByLabel('Nome completo');
      await campoNome.clear();
      await campoNome.fill('Nome Atualizado Teste');

      await page.getByRole('button', { name: 'Salvar alterações' }).click();

      // Modal deve fechar após salvar
      await expect(page.getByLabel('Nome completo')).toBeHidden();
    });

    test('Deve cancelar a edição sem salvar', async ({ page }) => {
      const btnEditar = page.locator('button:has([data-testid="EditIcon"])').first();
      await btnEditar.click();

      const campoNome = page.getByLabel('Nome completo');
      const nomeOriginal = await campoNome.inputValue();

      await campoNome.clear();
      await campoNome.fill('Nome Que Não Deve Salvar');

      await page.getByRole('button', { name: 'Cancelar' }).click();

      // Modal fechado, nome original preservado na lista
      await expect(page.getByLabel('Nome completo')).toBeHidden();
      await expect(page.getByText(nomeOriginal)).toBeVisible();
    });

  });

  // ── DELETAR ────────────────────────────────────────────────────────────────
  test.describe('Deletar Idoso', () => {

    test.beforeEach(async ({ page }) => {
      await login(page);
      await page.getByText('Monitoramento').click();
      await expect(page.getByRole('heading', { name: 'Central de Monitoramento' })).toBeVisible();
      await expect(page.locator('.MuiCircularProgress-root')).toBeHidden({ timeout: 10000 });
    });

    test('Deve inativar um idoso ao confirmar o alerta nativo', async ({ page }) => {
      page.on('dialog', (dialog) => dialog.accept());

      const btnDeletar = page.locator('button:has([data-testid="DeleteIcon"])').first();
      await expect(btnDeletar).toBeVisible();
      await btnDeletar.click();

      // Após confirmar, o card do idoso deve sumir da lista
      // (fetchIdosos é chamado novamente pelo componente)
    });

    test('Deve cancelar a inativação ao recusar o alerta nativo', async ({ page }) => {
      // Conta quantos cards existem antes
      const totalAntes = await page.locator('button:has([data-testid="DeleteIcon"])').count();

      page.on('dialog', (dialog) => dialog.dismiss());

      const btnDeletar = page.locator('button:has([data-testid="DeleteIcon"])').first();
      await btnDeletar.click();

      // Quantidade de cards deve permanecer a mesma
      const totalDepois = await page.locator('button:has([data-testid="DeleteIcon"])').count();
      expect(totalDepois).toBe(totalAntes);
    });

  });

});