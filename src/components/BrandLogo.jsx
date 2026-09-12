import React from "react";

export const BrandLogo = ({
  className = "",
  size = "md",
  showText = true,
  invert = false,
}) => {
  const sizeMap = {
    sm: { img: "w-9 h-9", text: "text-lg", sub: "text-[9px]" },
    md: { img: "w-12 h-12", text: "text-xl", sub: "text-[10px]" },
    lg: { img: "w-16 h-16", text: "text-2xl", sub: "text-xs" },
    xl: { img: "w-24 h-24", text: "text-3xl", sub: "text-sm" },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div
        className={`relative shrink-0 ${currentSize.img} rounded-full overflow-hidden shadow-xs border border-[#C8B89E] bg-[#EFE6D5]`}
      >
        <img
          src="/organic-bloom-logo.svg"
          alt="Organic Bloom Logo"
          className="w-full h-full object-contain"
          referrerPolicy="no-referrer"
        />
      </div>

      {showText && (
        <div className="flex flex-col leading-tight text-left">
          <span
            className={`font-display font-bold tracking-widest ${invert ? "text-[#FAF7F2]" : "text-[#1C2C20]"} ${currentSize.text}`}
          >
            ORGANIC BLOOM
          </span>
          <span
            className={`${invert ? "text-[#C6D8CB]" : "text-[#62856B]"} uppercase font-semibold tracking-wider ${currentSize.sub}`}
          >
            Artisanal Melt &amp; Pour Soaps
          </span>
        </div>
      )}
    </div>
  );
};
