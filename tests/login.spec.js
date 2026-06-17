// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Dashboard de Monitoramento', () => {

  test('Deve logar, aguardar carregamento inteligente e mapear idosos', async ({ page }) => {
    
    // --- 1. FLUXO DE LOGIN ---
    await page.goto('/');
    await page.getByText('Sou Cliente').click();
    await page.getByPlaceholder('seu@email.com').fill('gestorpw@monsai.com');
    await page.locator('input[type="password"]').fill('123456');
    await page.getByRole('button', { name: 'Entrar no Sistema' }).click();

    // Aguarda o título principal para garantir que o login concluiu
    await expect(page.getByRole('heading', { name: 'Central de Monitoramento' })).toBeVisible();

    // --- 2. ESPERA INTELIGENTE (Contador de Total) ---
    // Isola EXATAMENTE o card "Total Monitorados" usando o .filter()
    const cardTotal = page.locator('.MuiPaper-root').filter({ hasText: 'Total Monitorados' });
    const contador = cardTotal.locator('h3'); // Pega o número que está SÓ dentro desse card

    // Espera até que o número seja 1 ou maior (regex para números > 0)
    await expect(contador).toHaveText(/^[1-9][0-9]*$/, { timeout: 15000 });

    // --- 3. MAPEAMENTO DOS CARTÕES ---
    // No seu React, os cartões usam a tag <Card> que gera a classe .MuiCard-root
    const cartoes = page.locator('.MuiCard-root');
    
    // Aguarda o primeiro cartão e conta
    await expect(cartoes.first()).toBeVisible();
    const quantidadeDeCartoes = await cartoes.count();
    console.log(`Sucesso! Total de idosos detectados na tela: ${quantidadeDeCartoes}`);

    const dadosDosIdosos = [];

    // --- 4. LOOP DE EXTRAÇÃO DE DADOS ---
    for (let i = 0; i < quantidadeDeCartoes; i++) {
      const cartao = cartoes.nth(i);

      // Extração baseada nas tags exatas do seu código React:
      // Nome está no variant="h6"
      const nome = await cartao.locator('h6').innerText();
      
      // ID e Status estão em variant="caption" (que gera classes .MuiTypography-caption)
      const idStr = await cartao.locator('.MuiTypography-caption').filter({ hasText: 'ID:' }).innerText();
      const status = await cartao.locator('.MuiTypography-caption').filter({ hasText: /ONLINE|OFFLINE/ }).innerText();
      
      // BPM e Temperatura estão em variant="h5"
      const bpmStr = await cartao.locator('h5').filter({ hasText: 'BPM' }).innerText();
      const tempStr = await cartao.locator('h5').filter({ hasText: '°C' }).innerText();

      // Limpeza dos dados (ex: tira a palavra "ID:" e "BPM" do resultado final)
      dadosDosIdosos.push({
        nome: nome.trim(),
        id: idStr.replace('ID:', '').trim(),
        status: status.trim(),
        bpm: bpmStr.replace('BPM', '').trim(),
        temperatura: tempStr.replace('°C', '').trim()
      });
    }

    // --- 5. EXIBIÇÃO E VALIDAÇÃO FINAL ---
    console.table(dadosDosIdosos);

    // Valida se o sistema listou a mesma quantidade que diz no contador do topo
    const totalNaTela = await contador.innerText();
    expect(dadosDosIdosos.length).toBe(parseInt(totalNaTela, 10));
  });

});