import React, { useState } from "react";
import { QUIZ_QUESTIONS } from "../data/soaps";
import {
  X,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  RotateCcw,
  Droplets,
  Sun,
  Layers,
  Flower2,
  Zap,
  Trees,
  HeartHandshake,
  Milk,
  Cloud,
  Brush,
} from "lucide-react";

export const ScentQuiz = ({ isOpen, onClose, products, onAddToCart }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [resultProduct, setResultProduct] = useState(null);
  const [added, setAdded] = useState(false);

  if (!isOpen) return null;

  const totalQuestions = QUIZ_QUESTIONS.length;
  const currentQ = QUIZ_QUESTIONS[currentStep];

  const iconMap = {
    Droplets: <Droplets className="w-5 h-5 text-[#356E42]" />,
    Sparkles: <Sparkles className="w-5 h-5 text-[#C48039]" />,
    Sun: <Sun className="w-5 h-5 text-[#D49838]" />,
    Layers: <Layers className="w-5 h-5 text-[#63806E]" />,
    Flower2: <Flower2 className="w-5 h-5 text-[#73528A]" />,
    Zap: <Zap className="w-5 h-5 text-[#C48039]" />,
    Trees: <Trees className="w-5 h-5 text-[#2B5436]" />,
    HeartHandshake: <HeartHandshake className="w-5 h-5 text-[#915B33]" />,
    Milk: <Milk className="w-5 h-5 text-[#6F8877]" />,
    Cloud: <Cloud className="w-5 h-5 text-[#4E7559]" />,
    Brush: <Brush className="w-5 h-5 text-[#8F6A44]" />,
  };

  const handleSelectOption = (optionIndex) => {
    const updatedAnswers = [...answers];
    updatedAnswers[currentStep] = optionIndex;
    setAnswers(updatedAnswers);

    if (currentStep < totalQuestions - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Calculate match
      calculateResult(updatedAnswers);
    }
  };

  const calculateResult = (finalAnswers) => {
    // Gather matched ids across answers
    const scores = {};

    finalAnswers.forEach((optIdx, qIdx) => {
      const q = QUIZ_QUESTIONS[qIdx];
      const selected = q.options[optIdx];
      selected.matchedProductIds.forEach((id) => {
        scores[id] = (scores[id] || 0) + 1;
      });
    });

    let bestId = "rice-soap";
    let maxScore = -1;
    Object.entries(scores).forEach(([id, score]) => {
      if (score > maxScore) {
        maxScore = score;
        bestId = id;
      }
    });

    const match = products.find((p) => p.id === bestId) || products[0];
    setResultProduct(match);
  };

  const handleReset = () => {
    setCurrentStep(0);
    setAnswers([]);
    setResultProduct(null);
    setAdded(false);
  };

  const handleAddResult = () => {
    if (resultProduct) {
      onAddToCart(resultProduct);
      setAdded(true);
      setTimeout(() => {
        setAdded(false);
        onClose();
      }, 1200);
    }
  };

  return (
    <div
      id="scent-quiz-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in"
    >
      <div
        id="scent-quiz-modal"
        className="bg-[#FAF7F2] w-full max-w-2xl rounded-2xl shadow-2xl border border-[#E4DCCF] overflow-hidden relative my-auto p-6 sm:p-8"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-[#4A443A] hover:text-[#2C2926] flex items-center justify-center transition-colors shadow-xs cursor-pointer"
          aria-label="Close quiz"
        >
          <X className="w-5 h-5" />
        </button>

        {!resultProduct ? (
          <div>
            {/* Header & Step Tracker */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E8DFD3]">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#263E2E] uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-[#C48039]" />
                <span>Botanical Match Diagnostic</span>
              </div>
              <span className="text-xs text-[#70685D] font-medium">
                Step {currentStep + 1} of {totalQuestions}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-[#EAE2D5] rounded-full overflow-hidden mb-6">
              <div
                className="h-full bg-[#263E2E] transition-all duration-300 rounded-full"
                style={{
                  width: `${((currentStep + 1) / totalQuestions) * 100}%`,
                }}
              />
            </div>

            {/* Question Text */}
            <div className="mb-6">
              <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#1F3325]">
                {currentQ.question}
              </h2>
              <p className="text-xs sm:text-sm text-[#635B50] mt-1.5">
                {currentQ.subtitle}
              </p>
            </div>

            {/* Options List */}
            <div className="space-y-3">
              {currentQ.options.map((opt, idx) => {
                const isSelected = answers[currentStep] === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(idx)}
                    className={`w-full p-4 rounded-xl text-left border transition-all duration-200 flex items-start gap-4 cursor-pointer group ${
                      isSelected
                        ? "bg-[#EAF3EB] border-[#263E2E] shadow-sm"
                        : "bg-white hover:bg-[#F5EFE6] border-[#DDD3C2]"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#FAF7F2] border border-[#DDD3C2] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      {iconMap[opt.iconName] || (
                        <Sparkles className="w-5 h-5 text-[#263E2E]" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-[#233827] group-hover:text-[#182B1C]">
                        {opt.label}
                      </div>
                      <div className="text-xs text-[#635B50] mt-0.5 leading-relaxed">
                        {opt.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Navigation back button */}
            {currentStep > 0 && (
              <div className="mt-6 pt-4 border-t border-[#E8DFD3]">
                <button
                  onClick={() => setCurrentStep((s) => s - 1)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5B5449] hover:text-[#263E2E] cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous question</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Match Result Screen */
          <div className="animate-fade-in text-center">
            <div className="w-12 h-12 rounded-full bg-[#E5EFE6] text-[#263E2E] flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6 text-[#C48039]" />
            </div>

            <span className="text-xs uppercase tracking-widest text-[#263E2E] font-bold">
              Your Custom Botanical Match
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#1C2C20] mt-1">
              {resultProduct.name}
            </h2>
            <p className="text-xs text-[#686156] mt-0.5 max-w-md mx-auto">
              {resultProduct.subtitle}
            </p>

            {/* Recommended Product Card */}
            <div className="mt-6 p-4 rounded-xl bg-white border border-[#DDD3C2] flex flex-col sm:flex-row items-center gap-5 text-left shadow-xs">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg overflow-hidden shrink-0 bg-[#EFE8DD]">
                <img
                  src={resultProduct.image}
                  alt={resultProduct.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-[#263E2E] bg-[#E8EFE8] px-2 py-0.5 rounded">
                    99% Match For Your Skin
                  </span>
                  <span className="text-xs font-bold text-[#1C2C20]">
                    ₹{resultProduct.price}
                  </span>
                </div>
                <p className="text-xs text-[#524B41] line-clamp-2 leading-relaxed">
                  {resultProduct.description}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {resultProduct.topNotes.map((note, i) => (
                    <span
                      key={i}
                      className="text-[10px] bg-[#F2EDE4] text-[#4F483F] px-2 py-0.5 rounded"
                    >
                      {note}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Why It Fits Explanation */}
            <div className="mt-4 p-3 rounded-lg bg-[#F3ECE0] text-xs text-[#50483E] text-left">
              <strong className="font-semibold text-[#263E2E]">
                Why this soap was chosen:
              </strong>{" "}
              Handcrafted with Melt &amp; Pour botanical herbs tailored to your
              skin goal. Free from sulfates, parabens, or synthetic fragrance.
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3 items-center justify-center">
              <button
                onClick={handleAddResult}
                className={`w-full sm:w-auto px-6 py-3 rounded-full text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  added
                    ? "bg-[#528C5F] text-white"
                    : "bg-[#263E2E] text-[#FAF7F2] hover:bg-[#1A2D20] shadow-sm"
                }`}
              >
                {added ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Added To Bag!</span>
                  </>
                ) : (
                  <>
                    <span>Add Soap Match to Bag — ₹{resultProduct.price}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                onClick={handleReset}
                className="text-xs font-semibold text-[#635C51] hover:text-[#263E2E] flex items-center gap-1.5 py-2 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retake Quiz</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
