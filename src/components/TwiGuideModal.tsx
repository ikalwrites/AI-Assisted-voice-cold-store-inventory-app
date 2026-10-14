import React from 'react';
import { BookOpen, Volume2, Sparkles, CheckCircle2, MessageSquare } from 'lucide-react';
import { LanguageMode, TRANSLATIONS } from '../locales/translations';
import { speakWithBrowser } from '../utils/audioPlayer';

interface TwiGuideModalProps {
  lang: LanguageMode;
  onSelectCommand: (phrase: string) => void;
}

const TWI_NUMBERS = [
  { num: 1, twi: 'baako', example: 'carton baako' },
  { num: 2, twi: 'mmienu / baanu', example: 'carton baanu' },
  { num: 3, twi: 'mmiɛnsa', example: 'carton mmiɛnsa' },
  { num: 4, twi: 'ɛnan / baanan', example: 'carton baanan' },
  { num: 5, twi: 'enum / baanum', example: 'carton baanum' },
  { num: 6, twi: 'nsia', example: 'carton nsia' },
  { num: 7, twi: 'nson', example: 'carton nson' },
  { num: 8, twi: 'nwɔtwe', example: 'carton nwɔtwe' },
  { num: 9, twi: 'nkron', example: 'carton nkron' },
  { num: 10, twi: 'edu / du', example: 'carton du' },
  { num: 20, twi: 'aduonu', example: 'carton aduonu' },
  { num: 50, twi: 'aduonum', example: 'carton aduonum' },
  { num: 100, twi: 'ɔha', example: 'carton ɔha' },
];

const COLD_STORE_TERMS = [
  { term: 'Yɛatɔn / M\'atɔn', meaning: 'We have sold / I sold', sample: 'Yɛatɔn Tilapia carton du' },
  { term: 'Yɛagye / Fa bɛka ho', meaning: 'Received / Restock / Add to stock', sample: 'Yɛagye Titus carton aduonu enum' },
  { term: 'Sɛn na aka?', meaning: 'How many cartons are remaining?', sample: 'Hwɛ chicken thighs carton a aka' },
  { term: 'Boɔ yɛ sɛn?', meaning: 'What is the price of the item?', sample: 'Beef sausage carton yɛ sɛn seesei?' },
  { term: 'Asɛe wɔ freezer mu', meaning: 'Damaged / Spoiled in freezer', sample: 'Turkey wings carton 2 asɛe' },
  { term: 'Nsuomnam', meaning: 'Fish & Sea catch', sample: 'Tilapia, Mackerel, Red fish, Kɔtɔ' },
  { term: 'Akokɔ nan / Bɔto', meaning: 'Chicken thighs / Gizzards', sample: 'Akokɔ nan carton aduasa' },
  { term: 'Chofi / Tsofi', meaning: 'Turkey tails (Ghanaian delicacy)', sample: 'Chofi carton du na yɛatɔn' },
  { term: 'Prako nam', meaning: 'Pork chops, ribs & belly', sample: 'Prako nam carton aduonu' },
  { term: 'Nsosoe', meaning: 'Sausage / Frankfurters', sample: 'Smoked frankfurters sausage carton 8' },
];

export const TwiGuideModal: React.FC<TwiGuideModalProps> = ({ lang, onSelectCommand }) => {
  const t = TRANSLATIONS[lang];

  const handleSpeak = (phrase: string) => {
    speakWithBrowser(phrase, 'en-GH');
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-white p-6 rounded-3xl border border-[#E8E2D3] shadow-sm">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-xl bg-[#C2410C]/10 text-[#C2410C] flex items-center justify-center font-bold">
            <BookOpen className="w-4 h-4" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#1E3A1E]">
            🇬🇭 {lang === 'tw' ? 'Asante Twi Dwadie Akwankyerɛ' : 'Ghanaian Asante Twi Market Voice Guide'}
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-[#5D544F] leading-relaxed max-w-3xl">
          {lang === 'tw'
            ? 'Yami te Asante Twi ne Borɔfo ase pɛpɛɛpɛ. Kasa gu microfone no mu sɛnea wotaa ka wɔ Makola, Madina, Tema, Kumasi Central Market anaa Kejetia. Hwɛ nkyerɛwee ne nkontabuo a ɛwɔ ase yi.'
            : 'Yami understands Ghanaian market speech, including Asante Twi, Akuapem Twi, and market English. Use these standard phrases to give verbal voice overs for quick stock management.'}
        </p>
      </div>

      {/* Grid: Twi Numbers & Cold Store Terms */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Cold Store Trading Terms */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-[#E8E2D3] shadow-sm space-y-4">
          <h3 className="text-base font-black text-[#1E3A1E] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#C2410C]" />
            <span>Key Cold Store Trading Terms in Twi</span>
          </h3>

          <div className="space-y-2.5">
            {COLD_STORE_TERMS.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-[#F8F5EE] border border-[#E8E2D3] hover:border-[#C2410C]/40 transition-colors flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-[#C2410C]">
                      {item.term}
                    </span>
                    <span className="text-xs text-[#5D544F] font-medium">
                      = {item.meaning}
                    </span>
                  </div>
                  <p className="text-xs text-[#2C241F] mt-1 italic">
                    Example: "{item.sample}"
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleSpeak(item.sample)}
                    className="p-2 rounded-xl text-[#5D544F] hover:text-[#C2410C] hover:bg-[#E8E2D3]/60 transition-colors"
                    title="Pronounce phrase"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onSelectCommand(item.sample)}
                    className="px-3 py-1.5 rounded-xl text-xs font-black bg-[#C2410C] text-white hover:bg-[#A3360A] transition-colors shadow-sm"
                  >
                    Use
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Numbers in Twi */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-[#E8E2D3] shadow-sm space-y-4">
          <h3 className="text-base font-black text-[#1E3A1E] flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#1E3A1E]" />
            <span>Counting Cartons in Twi (Nkontabuo)</span>
          </h3>
          <p className="text-xs text-[#5D544F]">
            When you say cartons in Twi numbers, Yami automatically converts them to exact quantities!
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {TWI_NUMBERS.map((n) => (
              <div
                key={n.num}
                className="p-3 rounded-2xl bg-[#F8F5EE] border border-[#E8E2D3] flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-black text-[#1E3A1E] block">
                    {n.num} = <span className="text-[#C2410C]">{n.twi}</span>
                  </span>
                  <span className="text-[10px] text-[#5D544F] italic">
                    "{n.example}"
                  </span>
                </div>
                <button
                  onClick={() => handleSpeak(n.twi)}
                  className="p-1.5 text-[#5D544F] hover:text-[#C2410C] transition-colors"
                  title="Listen"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-[#1E3A1E]/10 border border-[#1E3A1E]/20 text-xs text-[#1E3A1E] space-y-1">
            <strong className="font-black block">💡 Regional Market Support:</strong>
            <span className="leading-relaxed">
              Yami supports both Asante Twi & Akuapem Twi. Store owners in Makola, Madina, Kaneshie, Tema Harbour, and Kumasi can freely mix Twi and English without any configuration.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
