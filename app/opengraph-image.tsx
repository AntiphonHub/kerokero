import { ImageResponse } from 'next/og';
import fs from 'node:fs';
import path from 'node:path';

export const alt = 'Bempedi - Comanda Digital Inteligente na Mesa';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function OpenGraphImage() {
  // Carrega as imagens oficiais do repositório em base64 para renderização estática perfeita
  const heroBgPath = path.join(process.cwd(), 'public/images/background_hero.png');
  const logoWhitePath = path.join(process.cwd(), 'public/images/logo_white.png');
  const mockupHeroPath = path.join(process.cwd(), 'public/images/mockup-hero.png');

  const heroBgBase64 = fs.readFileSync(heroBgPath).toString('base64');
  const logoWhiteBase64 = fs.readFileSync(logoWhitePath).toString('base64');
  const mockupHeroBase64 = fs.readFileSync(mockupHeroPath).toString('base64');

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          position: 'relative',
          backgroundColor: '#0a0a0a',
          fontFamily: 'sans-serif',
          overflow: 'hidden',
        }}
      >
        {/* Background da Hero Oficial */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`data:image/png;base64,${heroBgBase64}`}
          alt=""
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '1200px',
            height: '630px',
            objectFit: 'cover',
          }}
        />

        {/* Degradê sutil para legibilidade na coluna esquerda */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '620px',
            height: '630px',
            background: 'linear-gradient(to right, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.45) 70%, rgba(0,0,0,0) 100%)',
          }}
        />

        {/* Container Dividido Metade a Metade */}
        <div
          style={{
            width: '1200px',
            height: '630px',
            display: 'flex',
            flexDirection: 'row',
            position: 'relative',
          }}
        >
          {/* Metade da Esquerda: Apenas Logo, Texto Chamativo e Descrição (Sem badges) */}
          <div
            style={{
              width: '490px',
              height: '630px',
              padding: '60px 20px 60px 60px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: '24px',
            }}
          >
            {/* Logo Oficial Branca */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`data:image/png;base64,${logoWhiteBase64}`}
                alt="Bempedi"
                style={{
                  height: '46px',
                  width: '145px',
                  objectFit: 'contain',
                }}
              />
            </div>

            {/* Texto Chamativo 1:1 com a Headline da Hero */}
            <h1
              style={{
                fontSize: '37px',
                fontWeight: 900,
                color: '#ffffff',
                lineHeight: 1.15,
                letterSpacing: '-1px',
                margin: 0,
              }}
            >
              A comanda digital que acelera seu salão e multiplica o faturamento
            </h1>

            {/* Descrição 100% Fiel à Hero */}
            <p
              style={{
                fontSize: '17px',
                fontWeight: 400,
                color: 'rgba(255, 255, 255, 0.92)',
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              Seus clientes pedem e pagam via QR Code na mesa em segundos. Pedidos direto na cozinha, sem filas para pagar e com controle total em tempo real no seu painel.
            </p>
          </div>

          {/* Metade da Direita: Mockup Real 100% Fiel com Fundo Transparente e Drop Shadow */}
          <div
            style={{
              width: '710px',
              height: '630px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Mockup 1:1 Oficial da Hero Transparente com Sombra Natural */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`data:image/png;base64,${mockupHeroBase64}`}
              alt="Mockup Bempedi"
              style={{
                width: '700px',
                height: '476px',
                objectFit: 'contain',
                filter: 'drop-shadow(0 25px 45px rgba(0, 0, 0, 0.85))',
              }}
            />
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
