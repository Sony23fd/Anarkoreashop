import Link from "next/link";
import { AnimatedHeroBackground } from "./AnimatedHeroBackground";

export function HeroSection() {
  return (
    <div className="relative overflow-hidden min-h-[550px] flex items-center justify-center">
      <AnimatedHeroBackground />
      
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-20 text-center flex flex-col items-center">
        {/* Glassmorphism Card Wrapper */}
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 md:p-14 lg:p-16 shadow-[0_0_50px_rgba(78,61,199,0.15)] flex flex-col items-center relative overflow-hidden w-full max-w-4xl">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 shadow-sm backdrop-blur-md mb-8">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            <span className="text-sm font-medium text-slate-200">Шууд захиалах боломжтой</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight max-w-4xl relative z-10">
            Солонгосоос шууд таны <br className="hidden sm:block" /> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-white">
              гарт хүргэнэ
            </span>
          </h1>
          
          <p className="mt-6 text-lg md:text-xl text-indigo-100/80 max-w-2xl leading-relaxed relative z-10">
            Чанарын баталгаат, трэнд болж буй гоо сайхан, хувцас, ахуйн хэрэглээний барааг Солонгосоос хамгийн хурднаар, найдвартай захиалж аваарай.
          </p>
          

        </div>
      </div>
    </div>
  )
}
