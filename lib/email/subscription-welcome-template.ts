export interface SubscriptionWelcomeEmailInput {
  ownerName?: string | null;
  establishmentName?: string | null;
  dashboardUrl?: string;
  supportEmail?: string;
}

const DEFAULT_DASHBOARD_URL = 'https://bempedi.com/dashboard';
const DEFAULT_SUPPORT_EMAIL = 'contato@bempedi.com';
const LOGO_URL = 'https://bempedi.com/images/logo.png';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildSubscriptionWelcomeEmail(
  input: SubscriptionWelcomeEmailInput,
): { subject: string; html: string } {
  const rawEstablishmentName =
    input.establishmentName?.trim() || 'seu estabelecimento';
  const safeOwnerName = escapeHtml(input.ownerName?.trim() || 'Parceiro');
  const safeEstablishmentName = escapeHtml(rawEstablishmentName);
  const safeMailtoSubject = escapeHtml(
    encodeURIComponent(`Suporte Bempedi - ${rawEstablishmentName}`),
  );
  const safeDashboardUrl = escapeHtml(input.dashboardUrl?.trim() || DEFAULT_DASHBOARD_URL);
  const safeSupportEmail = escapeHtml(input.supportEmail?.trim() || DEFAULT_SUPPORT_EMAIL);

  const subject = 'Bempedi — Parabéns, sua assinatura está ativa';

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>Assinatura ativa — Bempedi</title>
  </head>
  <body style="margin:0;padding:0;background-color:#F4F4F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#121212;-webkit-font-smoothing:antialiased;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">
      Primeiro pagamento confirmado. ${safeEstablishmentName} já está ativo no Bempedi e nossa equipe segue ao seu lado.&#847;&zwnj;&nbsp;&#8199;&#65279;
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F4F4F5;padding:36px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;background-color:#FFFFFF;border:1px solid #E4E4E7;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="height:4px;background-color:#F59E0B;line-height:4px;font-size:4px;">&nbsp;</td>
            </tr>
            <tr>
              <td style="padding:24px 32px;border-bottom:1px solid #E4E4E7;background-color:#FFFFFF;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="left" valign="middle">
                      <img src="${LOGO_URL}" alt="Bempedi" width="80" style="display:block;width:80px;max-width:100%;height:auto;border:0;outline:none;text-decoration:none;" />
                    </td>
                    <td align="right" valign="middle">
                      <span style="display:inline-block;padding:6px 12px;background-color:#F4F4F5;border:1px solid #E4E4E7;border-radius:9999px;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#121212;">
                        Assinatura ativa
                      </span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px;background-color:#121212;">
                <p style="margin:0 0 12px 0;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#F59E0B;">
                  PRIMEIRO PAGAMENTO CONFIRMADO
                </p>
                <h1 style="margin:0 0 14px 0;font-size:26px;line-height:1.22;font-weight:800;letter-spacing:-0.03em;color:#FFFFFF;">
                  Parabéns, ${safeOwnerName}. ${safeEstablishmentName} está oficial no Bempedi.
                </h1>
                <p style="margin:0 0 26px 0;font-size:15px;line-height:1.65;color:#D4D4D8;">
                  Ficamos muito felizes com este passo. A partir de agora, sua operação conta com comandas digitais na mesa, fila direta na cozinha e pagamentos mais rápidos no dia a dia.
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="left" style="border-radius:9999px;background-color:#F59E0B;">
                      <a href="${safeDashboardUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:13px 26px;font-size:14px;font-weight:700;color:#121212;text-decoration:none;border-radius:9999px;">
                        Acessar meu painel
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 32px 12px 32px;background-color:#FFFFFF;">
                <p style="margin:0 0 18px 0;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#71717A;">
                  PARA EXTRAIR O MÁXIMO DESDE O PRIMEIRO DIA
                </p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="padding:14px 0;border-top:1px solid #E4E4E7;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td width="40" valign="top" style="font-size:13px;font-weight:800;color:#F59E0B;padding-top:2px;">
                            01
                          </td>
                          <td valign="top">
                            <p style="margin:0 0 4px 0;font-size:14px;font-weight:700;color:#121212;">
                              Cardápio e QR Codes nas mesas
                            </p>
                            <p style="margin:0;font-size:13px;line-height:1.55;color:#52525B;">
                              Revise fotos, adicionais e sugestões de combinação, e garanta que todas as mesas tenham acesso rápido ao código.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:14px 0;border-top:1px solid #E4E4E7;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td width="40" valign="top" style="font-size:13px;font-weight:800;color:#F59E0B;padding-top:2px;">
                            02
                          </td>
                          <td valign="top">
                            <p style="margin:0 0 4px 0;font-size:14px;font-weight:700;color:#121212;">
                              Pedidos na mesa e KDS alinhados
                            </p>
                            <p style="margin:0;font-size:13px;line-height:1.55;color:#52525B;">
                              Deixe o painel da cozinha e o monitor do salão abertos nos turnos para acompanhar cada pedido e chamado em tempo real.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:14px 0;border-top:1px solid #E4E4E7;border-bottom:1px solid #E4E4E7;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td width="40" valign="top" style="font-size:13px;font-weight:800;color:#F59E0B;padding-top:2px;">
                            03
                          </td>
                          <td valign="top">
                            <p style="margin:0 0 4px 0;font-size:14px;font-weight:700;color:#121212;">
                              Fechamento com divisão e PIX
                            </p>
                            <p style="margin:0;font-size:13px;line-height:1.55;color:#52525B;">
                              Seus clientes podem pagar apenas o que consumiram ou dividir a conta direto no celular, reduzindo filas no caixa.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 32px 32px;background-color:#FFFFFF;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F4F4F5;border:1px solid #E4E4E7;border-left:4px solid #F59E0B;border-radius:12px;">
                  <tr>
                    <td style="padding:20px 22px;">
                      <p style="margin:0 0 6px 0;font-size:14px;font-weight:700;color:#121212;">
                        Suporte completo para você e sua equipe
                      </p>
                      <p style="margin:0 0 16px 0;font-size:13px;line-height:1.6;color:#52525B;">
                        Precisou ajustar cardápio, configurar mesas ou tirar qualquer dúvida da operação? Nossa equipe está disponível para ajudar no que for preciso. Responda este e-mail ou fale diretamente com <a href="mailto:${safeSupportEmail}" style="color:#121212;font-weight:600;text-decoration:underline;">${safeSupportEmail}</a>.
                      </p>
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td align="left" style="border-radius:9999px;background-color:#121212;">
                            <a href="mailto:${safeSupportEmail}?subject=${safeMailtoSubject}" style="display:inline-block;padding:10px 18px;font-size:13px;font-weight:700;color:#FFFFFF;text-decoration:none;border-radius:9999px;">
                              Falar com o suporte
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 26px 32px;border-top:1px solid #E4E4E7;background-color:#FFFFFF;">
                <p style="margin:0 0 4px 0;font-size:12px;font-weight:600;color:#52525B;">
                  Bempedi — Comanda Digital Inteligente
                </p>
                <p style="margin:0;font-size:11px;line-height:1.5;color:#71717A;">
                  Enviado apenas na confirmação da primeira assinatura de ${safeEstablishmentName}.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, html };
}
