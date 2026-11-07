'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import confetti from 'canvas-confetti';
import { Check, Copy, CheckCheck, Loader2 } from 'lucide-react';
import {
  checkSubscriptionStatusAction,
  getSubscriptionPixAction,
} from '@/actions/onboarding';
import { itemVariants } from '@/lib/motion';

const SPARKS = [
  // 4 estrelas estilo sparkle nos quadrantes
  { angle: 30, distance: 82, type: 'star', size: 14, color: '#F59E0B' },
  { angle: 120, distance: 82, type: 'star', size: 14, color: '#F59E0B' },
  { angle: 210, distance: 82, type: 'star', size: 14, color: '#F59E0B' },
  { angle: 300, distance: 82, type: 'star', size: 14, color: '#F59E0B' },

  // Raios geométricos âmbar
  { angle: 0, distance: 88, type: 'pill', size: 14, color: '#F59E0B' },
  { angle: 75, distance: 84, type: 'pill', size: 12, color: '#FBBF24' },
  { angle: 90, distance: 88, type: 'pill', size: 14, color: '#F59E0B' },
  { angle: 165, distance: 84, type: 'pill', size: 12, color: '#FBBF24' },
  { angle: 180, distance: 88, type: 'pill', size: 14, color: '#F59E0B' },
  { angle: 255, distance: 84, type: 'pill', size: 12, color: '#FBBF24' },
  { angle: 270, distance: 88, type: 'pill', size: 14, color: '#F59E0B' },
  { angle: 345, distance: 84, type: 'pill', size: 12, color: '#FBBF24' },

  // Pontos de luz amarela dourada brilhante
  { angle: 45, distance: 86, type: 'dot', size: 7, color: '#FDE047' },
  { angle: 135, distance: 86, type: 'dot', size: 7, color: '#FDE047' },
  { angle: 225, distance: 86, type: 'dot', size: 7, color: '#FDE047' },
  { angle: 315, distance: 86, type: 'dot', size: 7, color: '#FDE047' },
];

const contentContainerVariants: Variants = {
  hidden: {
    opacity: 0,
    pointerEvents: 'none',
  },
  visible: {
    opacity: 1,
    pointerEvents: 'auto',
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

interface StepConclusaoBoxProps {
  establishmentName: string;
  tablesCount: number;
  orderMode: string;
  subaccountStatus: string;
  initialSubscriptionStatus: string;
  pixQrCodeImage?: string | null;
  pixCopiaECola?: string | null;
}

export function StepConclusaoBox({
  establishmentName,
  tablesCount,
  orderMode,
  subaccountStatus,
  initialSubscriptionStatus,
  pixQrCodeImage,
  pixCopiaECola,
}: StepConclusaoBoxProps) {
  const router = useRouter();
  const [status, setStatus] = useState<string>(initialSubscriptionStatus);
  const [pixImage, setPixImage] = useState<string | null>(pixQrCodeImage || null);
  const [pixPayload, setPixPayload] = useState<string | null>(pixCopiaECola || null);
  const [copied, setCopied] = useState(false);
  const isSubscriber = status === 'active';

  // Animação sequencial por etapas
  const targetRef = useRef<HTMLDivElement>(null);
  const [centerOffset, setCenterOffset] = useState<number>(0);
  const [isReady, setIsReady] = useState(false);
  const [stage, setStage] = useState<'grow' | 'sparks' | 'rise' | 'done'>('grow');

  // Calcula o offset exato do centro da tela para o slot do ícone
  useEffect(() => {
    if (targetRef.current) {
      const rect = targetRef.current.getBoundingClientRect();
      const targetY = rect.top + rect.height / 2;
      const centerY = window.innerHeight / 2;
      setCenterOffset(centerY - targetY);
    }
    setIsReady(true);
  }, []);

  // Sequenciamento temporizado das etapas
  useEffect(() => {
    if (!isReady) return;

    // Etapa 1: Círculo cresce no centro da tela (0.0s a 0.65s)
    const t1 = setTimeout(() => {
      setStage('sparks');
    }, 650);

    // Etapa 2: Sparks explodem ao redor do círculo no centro (0.65s a 1.6s)
    const t2 = setTimeout(() => {
      setStage('rise');
    }, 1600);

    // Etapa 3: Círculo sobe para a posição final normal (1.6s a 2.4s)
    // Etapa 4: Só depois revela os demais containers em cascata
    const t3 = setTimeout(() => {
      setStage('done');
    }, 2400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isReady]);

  // Polling em background para carregar o QR Code caso o Asaas ainda estivesse gerando
  useEffect(() => {
    if (isSubscriber || pixImage) return;

    let mounted = true;
    const interval = setInterval(async () => {
      try {
        const pixData = await getSubscriptionPixAction();
        if (pixData && mounted) {
          setPixImage(pixData.encodedImage);
          setPixPayload(pixData.payload);
          clearInterval(interval);
        }
      } catch {
        // silent retry
      }
    }, 2000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [isSubscriber, pixImage]);

  const triggerConfetti = () => {
    // 1. Salva central exuberante
    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.55 },
      colors: ['#F59E0B', '#FBBF24', '#FDE047', '#121212', '#FFFFFF'],
      disableForReducedMotion: true,
    });

    // 2. Salvas laterais esquerda e direita
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0.1, y: 0.65 },
        colors: ['#F59E0B', '#FBBF24', '#FDE047'],
        disableForReducedMotion: true,
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 0.9, y: 0.65 },
        colors: ['#F59E0B', '#FBBF24', '#FDE047'],
        disableForReducedMotion: true,
      });
    }, 220);
  };

  // Polling em background para verificar confirmação imediata do PIX via webhook Asaas
  useEffect(() => {
    if (isSubscriber) return;

    const interval = setInterval(async () => {
      try {
        const currentStatus = await checkSubscriptionStatusAction();
        if (currentStatus === 'active') {
          setStatus('active');
          triggerConfetti();
          clearInterval(interval);
        }
      } catch {
        // silent retry
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [isSubscriber]);

  const handleCopyPix = () => {
    if (!pixPayload) return;
    navigator.clipboard.writeText(pixPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="w-full max-w-[580px] text-center flex flex-col items-center">
      {/* Slot de destino do ícone de Check */}
      <div ref={targetRef} className="relative flex items-center justify-center mb-6 h-16 sm:h-[72px]">
        {isReady && (
          <motion.div
            initial={{ scale: 0, y: centerOffset }}
            animate={{
              scale: stage === 'grow' ? [0, 1.15, 1] : 1,
              y: stage === 'rise' || stage === 'done' ? 0 : centerOffset,
            }}
            transition={{
              scale: { duration: 0.6, ease: [0.175, 0.885, 0.32, 1.2] },
              y: { duration: 0.75, ease: [0.16, 1, 0.3, 1] },
            }}
            className="relative flex items-center justify-center z-20"
          >
            {/* Sparks explosivas que aparecem enquanto o círculo está no centro */}
            {stage === 'sparks' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                {SPARKS.map((spark, idx) => {
                  const rad = (spark.angle * Math.PI) / 180;
                  const targetX = Math.round(Math.cos(rad) * spark.distance);
                  const targetY = Math.round(Math.sin(rad) * spark.distance);

                  return (
                    <motion.div
                      key={idx}
                      initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                      animate={{
                        x: [0, targetX * 0.65, targetX],
                        y: [0, targetY * 0.65, targetY],
                        scale: [0, 1.3, 0],
                        opacity: [0, 1, 0],
                      }}
                      transition={{
                        duration: 0.85,
                        times: [0, 0.45, 1],
                        ease: 'easeOut',
                      }}
                      style={{
                        position: 'absolute',
                        transform:
                          spark.type === 'pill'
                            ? `rotate(${spark.angle + 90}deg)`
                            : undefined,
                      }}
                    >
                      {spark.type === 'star' ? (
                        <svg
                          width={spark.size}
                          height={spark.size}
                          viewBox="0 0 24 24"
                          fill={spark.color}
                          className="drop-shadow-[0_0_8px_rgba(245,158,11,0.7)]"
                        >
                          <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
                        </svg>
                      ) : spark.type === 'pill' ? (
                        <span
                          style={{
                            width: 4,
                            height: spark.size,
                            backgroundColor: spark.color,
                            borderRadius: 9999,
                          }}
                          className="block shadow-[0_0_8px_rgba(245,158,11,0.6)]"
                        />
                      ) : (
                        <span
                          style={{
                            width: spark.size,
                            height: spark.size,
                            backgroundColor: spark.color,
                            borderRadius: 9999,
                          }}
                          className="block shadow-[0_0_10px_rgba(253,224,71,0.8)]"
                        />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Círculo Âmbar com Check Branco */}
            <div className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full bg-amber-500 flex items-center justify-center shadow-xl shadow-amber-500/30 relative z-10">
              <Check className="w-8 h-8 sm:w-9 sm:h-9 text-white stroke-[3]" />
            </div>
          </motion.div>
        )}
      </div>

      {/* Conteúdo da página: só se revela em cascata após o check subir ao topo */}
      <motion.div
        variants={contentContainerVariants}
        initial="hidden"
        animate={stage === 'done' ? 'visible' : 'hidden'}
        className={`w-full flex flex-col items-center transition-opacity duration-300 ${
          stage !== 'done' ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        {/* Heading */}
        <motion.div variants={itemVariants} className="flex flex-col items-center">
          <h1 className="text-2xl sm:text-[30px] font-extrabold tracking-[-0.035em] text-zinc-900 leading-tight mb-2">
            Loja configurada com sucesso
          </h1>
          <p className="text-sm sm:text-[15px] text-zinc-500 leading-relaxed max-w-[490px] mb-7">
            Os dados da sua loja foram registrados e sua conta de recebimentos foi enviada para análise.
            {isSubscriber
              ? ' Sua conta está ativa e seu acesso ao painel está liberado.'
              : ' Para liberar o acesso ao painel, efetue o pagamento da mensalidade via PIX abaixo.'}
          </p>
        </motion.div>

        {/* Summary Box */}
        <motion.div
          variants={itemVariants}
          className="w-full bg-zinc-50/80 border border-zinc-200 rounded-2xl p-4 sm:p-6 text-left mb-6 space-y-3"
        >
          <div className="flex items-center justify-between py-1 border-b border-zinc-200/60">
            <span className="text-xs sm:text-[13.5px] text-zinc-500 font-medium">
              Estabelecimento
            </span>
            <span className="text-xs sm:text-[13.5px] font-bold text-zinc-900">
              {establishmentName}
            </span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-zinc-200/60">
            <span className="text-xs sm:text-[13.5px] text-zinc-500 font-medium">
              Mesas iniciais
            </span>
            <span className="text-xs sm:text-[13.5px] font-bold text-zinc-900">
              {tablesCount} mesas (QR Codes prontos)
            </span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-zinc-200/60">
            <span className="text-xs sm:text-[13.5px] text-zinc-500 font-medium">
              Modo operacional
            </span>
            <span className="text-xs sm:text-[13.5px] font-bold text-zinc-900">
              {orderMode === 'direct' ? 'Envio Direto (Modo Ágil)' : 'Aprovação do Garçom'}
            </span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-zinc-200/60">
            <span className="text-xs sm:text-[13.5px] text-zinc-500 font-medium">
              Conta de recebimentos
            </span>
            <span className="text-xs sm:text-[13.5px] font-bold text-zinc-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              {subaccountStatus === 'approved' ? 'Aprovada' : 'Em análise (liberação em até 2h)'}
            </span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs sm:text-[13.5px] text-zinc-500 font-medium">
              Status da Mensalidade
            </span>
            <span className="text-xs sm:text-[13.5px] font-bold text-zinc-900 flex items-center gap-2">
              {isSubscriber ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-emerald-700">Ativa</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-amber-700">Aguardando Pagamento PIX</span>
                </>
              )}
            </span>
          </div>
        </motion.div>

        {/* PIX Billing Box when pending */}
        <AnimatePresence mode="wait">
          {!isSubscriber && (
            <motion.div
              key="pix-billing-card"
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              exit={{
                opacity: 0,
                scale: 0.96,
                height: 0,
                marginTop: 0,
                marginBottom: 0,
                paddingTop: 0,
                paddingBottom: 0,
                borderWidth: 0,
                transition: {
                  duration: 0.55,
                  ease: [0.16, 1, 0.3, 1],
                },
              }}
              className="w-full bg-white border-2 border-amber-500/80 rounded-2xl p-5 mb-6 text-center space-y-4 shadow-sm overflow-hidden"
            >
              <div className="space-y-1">
                <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                  Mensalidade Bempedi
                </span>
                <h2 className="text-lg font-extrabold text-zinc-900">
                  R$ 149,00 / mês
                </h2>
                <p className="text-xs text-zinc-500">
                  Escaneie o QR Code abaixo no app do seu banco para ativar instantaneamente:
                </p>
              </div>

              {pixImage ? (
                <div className="flex justify-center my-3">
                  <img
                    src={`data:image/png;base64,${pixImage}`}
                    alt="QR Code PIX Mensalidade Bempedi"
                    className="w-44 h-44 rounded-xl border border-zinc-200 p-2 bg-white"
                  />
                </div>
              ) : (
                <div className="w-44 h-44 mx-auto rounded-xl bg-zinc-100 flex items-center justify-center text-xs text-zinc-400">
                  Carregando QR Code...
                </div>
              )}

              {pixPayload && (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleCopyPix}
                    className="w-full h-11 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-950 border border-amber-500/30 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <CheckCheck className="w-4 h-4 text-emerald-600" />
                        Chave PIX copiada com sucesso!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-amber-700" />
                        Copiar código PIX (Copia e Cola)
                      </>
                    )}
                  </button>
                </div>
              )}

              <div className="flex items-center justify-center gap-2 text-xs text-zinc-500 pt-2 border-t border-zinc-100">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                <span>Identificando pagamento em tempo real...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <motion.div layout variants={itemVariants} className="w-full space-y-3">
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            disabled={!isSubscriber}
            className={`w-full h-13 rounded-full font-bold text-sm sm:text-[15px] flex items-center justify-center transition-all ${
              isSubscriber
                ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-sm shadow-amber-500/25 cursor-pointer'
                : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
            }`}
          >
            {isSubscriber ? 'Acessar Painel de Controle' : 'Aguardando Pagamento da Mensalidade...'}
          </button>

          {isSubscriber && (
            <button
              type="button"
              onClick={() => router.push('/cardapio')}
              className="text-xs sm:text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              Ir para Gestão do Cardápio
            </button>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
