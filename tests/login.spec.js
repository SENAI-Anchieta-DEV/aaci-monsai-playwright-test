// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Fluxo de Navegação e Login', () => {

  test('Deve realizar o login com sucesso', async ({ page }) => {
    
    // 1. Acessa a Home
    await page.goto('/');

    // 2. Clica em "Sou Cliente"
    await page.getByText('Sou Cliente').click();

    // 3. Valida se a tela de login carregou
    await expect(page.getByRole('heading', { name: 'Bem-vindo' })).toBeVisible();

    // 4. Preenche os campos com os dados fornecidos pelo seu amigo
    await page.getByPlaceholder('seu@email.com').fill('gestorpw@gmail.com');
    await page.locator('input[type="password"]').fill('123456');

    // ADICIONEI UM WAIT AQUI SÓ PARA VOCÊ VER A TELA ANTES DE CLICAR
    // Isso pausa o teste por 2 segundos para você enxergar o preenchimento
    await page.waitForTimeout(2000);

    // 5. Clica em "Entrar no Sistema"
    await page.getByRole('button', { name: 'Entrar no Sistema' }).click();

    // 6. Validação: Verifique se ele entrou no sistema
    // Exemplo: se aparecer um botão "Sair" ou algo parecido na tela pós-login
    // await expect(page.getByRole('button', { name: 'Sair' })).toBeVisible();
  });

});