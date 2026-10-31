import Image from 'next/image';

export function AuthShowcase() {
  return (
    <section className="relative w-full h-[260px] lg:h-[660px] overflow-hidden rounded-[24px] lg:rounded-[36px] bg-amber-500 shadow-sm select-none">
      {/* Top-Left: Pizza */}
      <div className="absolute top-[16px] left-[16px] lg:top-[32px] lg:left-[32px]">
        <Image
          src="/images/food-pizza.png"
          alt="Pizza"
          width={310}
          height={310}
          priority
          className="pointer-events-none w-[130px] lg:w-[305px] h-auto -rotate-[14deg] drop-shadow-[0_20px_24px_rgba(0,0,0,0.18)] lg:drop-shadow-[0_28px_32px_rgba(0,0,0,0.22)] animate-float-pizza"
        />
      </div>

      {/* Middle-Right: Burger (Ponta do '>') */}
      <div className="absolute top-1/2 -translate-y-1/2 right-[12px] lg:right-[24px]">
        <Image
          src="/images/food-burger.png"
          alt="Hambúrguer Gourmet"
          width={330}
          height={330}
          priority
          className="pointer-events-none w-[145px] lg:w-[330px] h-auto rotate-[8deg] drop-shadow-[0_20px_24px_rgba(0,0,0,0.18)] lg:drop-shadow-[0_28px_32px_rgba(0,0,0,0.22)] animate-float-burger"
        />
      </div>

      {/* Bottom-Left: Marmita */}
      <div className="absolute bottom-[16px] left-[16px] lg:bottom-[32px] lg:left-[32px]">
        <Image
          src="/images/food-marmita.png"
          alt="Marmita e Prato Feito"
          width={310}
          height={310}
          priority
          className="pointer-events-none w-[135px] lg:w-[310px] h-auto -rotate-[6deg] drop-shadow-[0_20px_24px_rgba(0,0,0,0.18)] lg:drop-shadow-[0_28px_32px_rgba(0,0,0,0.22)] animate-float-marmita"
        />
      </div>
    </section>
  );
}
