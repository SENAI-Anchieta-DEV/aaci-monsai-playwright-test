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

// ─── CPFs válidos reservados para testes ──────────────────────────────────────
// Troque se algum já existir no banco. Serial e email são únicos por execução.
const CPF_VALIDOS_TESTE = [
  '529.982.247-25',
  '087.508.490-77',
  '153.509.460-56',
  '374.111.670-45',
];
let cpfIndex = 0;

function dadosFrescos() {
  const ts    = Date.now();
  const cpf   = CPF_VALIDOS_TESTE[cpfIndex++ % CPF_VALIDOS_TESTE.length];
  return {
    nome:   `Playwright Idoso ${ts}`,
    cpf,
    serial: `PW-${ts}`,           // serial único por execução — nunca colide
    email:  `pw.${ts}@teste.com`, // idem
  };
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
      const d = dadosFrescos();

      await page.getByLabel('Nome do Idoso').fill(d.nome);
      await page.getByLabel('CPF').fill(d.cpf);
      await page.getByLabel('ID da Pulseira (Serial)').fill(d.serial);
      await page.getByLabel('Email do Familiar').fill(d.email);

      // Intercepta qualquer resposta para /idosos e verifica que foi bem-sucedida
      const [response] = await Promise.all([
        page.waitForResponse((res) => res.url().includes('/idosos') && res.ok()),
        page.getByRole('button', { name: 'Cadastrar e Ativar Monitoramento' }).click(),
      ]);

      expect(response.ok()).toBeTruthy();
    });

    test('Não deve cadastrar com campos obrigatórios vazios', async ({ page }) => {
      await page.getByRole('button', { name: 'Cadastrar e Ativar Monitoramento' }).click();

      await expect(
        page.locator('p.MuiFormHelperText-root', { hasText: 'O nome deve ter pelo menos 3 letras.' })
      ).toBeVisible();
    });

    test('Não deve cadastrar com CPF inválido', async ({ page }) => {
      await page.getByLabel('Nome do Idoso').fill('João Inválido');
      await page.getByLabel('CPF').fill('000.000.000-0');
      await page.getByLabel('ID da Pulseira (Serial)').fill('TST-999');
      await page.getByLabel('Email do Familiar').fill('teste@teste.com');

      await page.getByRole('button', { name: 'Cadastrar e Ativar Monitoramento' }).click();

      await expect(
        page.locator('p.MuiFormHelperText-root', { hasText: 'CPF deve ter 11 dígitos.' })
      ).toBeVisible();
    });

  });

  // ── ATUALIZAR ──────────────────────────────────────────────────────────────
  test.describe('Atualizar Idoso', () => {

    test.beforeEach(async ({ page }) => {
      await login(page);
      await page.getByRole('button', { name: 'Monitoramento', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Central de Monitoramento' })).toBeVisible();
      await expect(page.locator('.MuiCard-root').first()).toBeVisible({ timeout: 15000 });
    });

    test('Deve abrir o modal de edição ao clicar no ícone de editar', async ({ page }) => {
      const btnEditar = page.getByRole('button', { name: 'Editar idoso' }).first();
      await expect(btnEditar).toBeVisible({ timeout: 15000 });
      await btnEditar.click();

      await expect(page.getByLabel('Nome completo')).toBeVisible({ timeout: 8000 });
    });

    test('Deve atualizar o nome do idoso com sucesso', async ({ page }) => {
      const btnEditar = page.getByRole('button', { name: 'Editar idoso' }).first();
      await btnEditar.click();

      const campoNome = page.getByLabel('Nome completo');
      await campoNome.clear();
      await campoNome.fill('Nome Atualizado Teste');

      await page.getByRole('button', { name: 'Salvar alterações' }).click();

      await expect(page.getByLabel('Nome completo')).toBeHidden();
    });

    test('Deve cancelar a edição sem salvar', async ({ page }) => {
      const btnEditar = page.getByRole('button', { name: 'Editar idoso' }).first();
      await btnEditar.click();

      const campoNome = page.getByLabel('Nome completo');
      const nomeOriginal = await campoNome.inputValue();

      await campoNome.clear();
      await campoNome.fill('Nome Que Não Deve Salvar');

      await page.getByRole('button', { name: 'Cancelar' }).click();

      await expect(page.getByLabel('Nome completo')).toBeHidden();
      await expect(page.getByText(nomeOriginal)).toBeVisible();
    });

  });

  // ── DELETAR ────────────────────────────────────────────────────────────────
  test.describe('Deletar Idoso', () => {

    test.beforeEach(async ({ page }) => {
      await login(page);
      await page.getByRole('button', { name: 'Monitoramento', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Central de Monitoramento' })).toBeVisible();
      await expect(page.locator('.MuiCard-root').first()).toBeVisible({ timeout: 15000 });
    });

    test('Deve inativar um idoso ao confirmar o alerta nativo', async ({ page }) => {
      const botoesDeletar = page.getByRole('button', { name: 'Inativar idoso' });
      const totalAntes = await botoesDeletar.count();
      expect(totalAntes).toBeGreaterThan(0);

      page.on('dialog', (dialog) => dialog.accept());
      await botoesDeletar.first().click();

      await expect(botoesDeletar).toHaveCount(totalAntes - 1, { timeout: 8000 });
    });

    test('Deve cancelar a inativação ao recusar o alerta nativo', async ({ page }) => {
      const botoesDeletar = page.getByRole('button', { name: 'Inativar idoso' });
      const totalAntes = await botoesDeletar.count();
      expect(totalAntes).toBeGreaterThan(0);

      page.on('dialog', (dialog) => dialog.dismiss());
      await botoesDeletar.first().click();

      await expect(botoesDeletar).toHaveCount(totalAntes);
    });

  });

});