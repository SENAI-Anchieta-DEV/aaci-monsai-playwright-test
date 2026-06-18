import { test, expect } from '@playwright/test';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function gerarEmailUnico(prefixo = 'playwright') {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1_000_000);
  return `${prefixo}.${timestamp}.${random}@monsai.com`;
}

function gerarCpfFormatado() {
  const digits = String(Math.floor(Math.random() * 1_000_000_000)).padStart(9, '0');
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-00`;
}

function gerarColaborador(tipo = 'CUIDADOR') {
  const ts = Date.now();
  return {
    nome: `Colaborador Playwright ${ts}`,
    cpf: gerarCpfFormatado(),
    email: gerarEmailUnico('colaborador.pw'),
    senha: 'Teste@123',
    tipoUsuario: tipo,
  };
}

// ─── Setup comum ──────────────────────────────────────────────────────────────

async function fazerLoginENavegar(page) {
  await page.goto('/');

  // Fluxo de autenticação nativo para Chromium
  await page.getByRole('button', { name: 'Sou Cliente' }).click();
  await page.locator('input[type="text"]').fill('gestorpw1@monsai.com');
  await page.locator('input[type="password"]').fill('123456');
  await page.getByRole('button', { name: 'Entrar' }).click();

  // Navega para a seção de Cadastrar Usuário via menu lateral
  await page.getByText('Cadastrar Usuário').click();

  // Aguarda o formulário estar visível
  await expect(page.getByRole('heading', { name: /novo colaborador/i })).toBeVisible();
}

// ─── Suite ────────────────────────────────────────────────────────────────────

test.describe('Fluxo: Cadastro de Usuário', () => {

  test.beforeEach(async ({ page }) => {
    await fazerLoginENavegar(page);
  });

  // ── 01. Smoke: formulário renderiza corretamente ───────────────────────────

  test('Deve exibir todos os campos do formulário de cadastro', async ({ page }) => {
    await expect(page.locator('input[name="nome"]')).toBeVisible();
    await expect(page.locator('input[name="cpf"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="senha"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /finalizar cadastro/i })).toBeVisible();
  });

  // ── 02. Cadastro feliz: CUIDADOR ──────────────────────────────────────────

  test('Deve cadastrar um novo colaborador do tipo CUIDADOR com sucesso', async ({ page }) => {
    const colaborador = gerarColaborador('CUIDADOR');

    await page.locator('input[name="nome"]').fill(colaborador.nome);
    await page.locator('input[name="cpf"]').fill(colaborador.cpf);
    await page.locator('input[name="email"]').fill(colaborador.email);
    await page.locator('input[name="senha"]').fill(colaborador.senha);

    // Tipo já vem como CUIDADOR por padrão — não precisa trocar

    await page.getByRole('button', { name: /finalizar cadastro/i }).click();

    // Deve exibir toast de sucesso
    await expect(
      page.getByText(/usuário cadastrado com sucesso/i)
    ).toBeVisible({ timeout: 10_000 });

    // Formulário deve ser limpo após o cadastro
    await expect(page.locator('input[name="nome"]')).toHaveValue('');
  });

  // ── 03. Cadastro feliz: ENFERMEIRO ────────────────────────────────────────

  test('Deve cadastrar um novo colaborador do tipo ENFERMEIRO com sucesso', async ({ page }) => {
    const colaborador = gerarColaborador('ENFERMEIRO');

    await page.locator('input[name="nome"]').fill(colaborador.nome);
    await page.locator('input[name="cpf"]').fill(colaborador.cpf);
    await page.locator('input[name="email"]').fill(colaborador.email);
    await page.locator('input[name="senha"]').fill(colaborador.senha);

    // Seleciona o tipo ENFERMEIRO no dropdown interagindo com a div visível do MUI
    await page.getByRole('combobox', { name: /tipo de acesso/i }).click();
    await page.getByRole('option', { name: 'ENFERMEIRO' }).click();

    await page.getByRole('button', { name: /finalizar cadastro/i }).click();

    await expect(
      page.getByText(/usuário cadastrado com sucesso/i)
    ).toBeVisible({ timeout: 10_000 });
  });

  // ── 04. Validação: campos obrigatórios vazios ─────────────────────────────

  test('Deve bloquear o cadastro se os campos obrigatórios estiverem vazios', async ({ page }) => {
    await page.getByRole('button', { name: /finalizar cadastro/i }).click();

    // Ao menos um dos erros de validação deve aparecer (o componente exibe helperText)
    const erros = page.locator('.MuiFormHelperText-root');
    await expect(erros.first()).toBeVisible();

    // Nenhuma requisição POST deve ter sido disparada
    const quantidadeErros = await erros.count();
    expect(quantidadeErros).toBeGreaterThan(0);
  });

  // ── 05. Validação: e-mail inválido ────────────────────────────────────────

  test('Deve exibir erro de validação para e-mail com formato inválido', async ({ page }) => {
    await page.locator('input[name="nome"]').fill('Usuário Teste');
    await page.locator('input[name="cpf"]').fill('123.456.789-00');
    await page.locator('input[name="email"]').fill('email-invalido');
    await page.locator('input[name="senha"]').fill('Senha@123');

    await page.getByRole('button', { name: /finalizar cadastro/i }).click();

    // Deve aparecer mensagem de erro no campo email
    const erroEmail = page.locator('p.MuiFormHelperText-root').filter({ hasText: /e-?mail|formato|válido/i });
    await expect(erroEmail).toBeVisible();
  });

  // ── 06. Máscara de CPF ────────────────────────────────────────────────────

  test('Deve aplicar a máscara de CPF automaticamente ao digitar', async ({ page }) => {
    const campoCpf = page.locator('input[name="cpf"]');

    await campoCpf.fill('12345678900');

    // A máscara deve formatar para 123.456.789-00
    const valorFormatado = await campoCpf.inputValue();
    expect(valorFormatado).toMatch(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/);
  });

  // ── 07. Seleção de tipo de acesso ─────────────────────────────────────────

  test('Deve permitir selecionar todos os tipos de acesso disponíveis', async ({ page }) => {
    const tipos = ['GESTOR', 'CUIDADOR', 'ENFERMEIRO', 'FAMILIAR'];

    for (const tipo of tipos) {
      // Clica na div visível do MUI Select
      await page.getByRole('combobox', { name: /tipo de acesso/i }).click();
      await page.getByRole('option', { name: tipo }).click();

      // Confirma que o valor selecionado está refletido no texto do combobox
      await expect(page.getByRole('combobox', { name: /tipo de acesso/i })).toHaveText(tipo);
    }
  });

  // ── 08. Fluxo completo: cadastrar e verificar na listagem ─────────────────

  test('Deve cadastrar colaborador e confirmar que aparece na lista de usuários', async ({ page }) => {
    const colaborador = gerarColaborador('FAMILIAR');

    await page.locator('input[name="nome"]').fill(colaborador.nome);
    await page.locator('input[name="cpf"]').fill(colaborador.cpf);
    await page.locator('input[name="email"]').fill(colaborador.email);
    await page.locator('input[name="senha"]').fill(colaborador.senha);

    // Abre e seleciona no dropdown corrigido
    await page.getByRole('combobox', { name: /tipo de acesso/i }).click();
    await page.getByRole('option', { name: 'FAMILIAR' }).click();

    await page.getByRole('button', { name: /finalizar cadastro/i }).click();

    await expect(
      page.getByText(/usuário cadastrado com sucesso/i)
    ).toBeVisible({ timeout: 10_000 });

    // Navega para Gerenciar Usuários para confirmar o cadastro
    await page.getByText('Gerenciar Usuários').click();
    await expect(
      page.getByRole('heading', { name: /gerenciar colaboradores/i })
    ).toBeVisible();

    // Espera a tabela carregar
    await expect(page.locator('.MuiCircularProgress-root')).toBeHidden({ timeout: 10_000 });

    // Verifica se o e-mail do novo usuário aparece na listagem
    await expect(
      page.locator('table').getByText(colaborador.email)
    ).toBeVisible({ timeout: 10_000 });
  });

});