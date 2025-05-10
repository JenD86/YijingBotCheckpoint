/*
 written by: Lawrence McDaniel

 This is a refactored implementation of the Matrix Raining Letters effect based on this blog post
 https://dev.to/javascriptacademy/matrix-raining-code-effect-using-javascript-4hep

*/
import React, { useRef, useEffect } from "react";

interface MatrixRainingLettersProps {
  color?: string;
  customClass?: string;
  keyProp: string;
}

function getRandomSlice(str: String, minLength: number, maxLength: number) {
  const length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
  const start = Math.floor(Math.random() * (str.length - length + 1));
  return str.slice(start, start + length);
}

const renderMatrix = (ref: React.RefObject<HTMLCanvasElement>, color?: string) => {
  const canvas = ref.current;
  if (!canvas) return () => { };

  const context = canvas.getContext("2d");
  if (!context) return () => { };

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // const katakana = "アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン";
  // const ichingKatakana = "イチニサンシゴロクシチハチキュウジュウバンカケアメツチヒカリヤミカゼミズヤマ";
  // const ichingKatakana = "イチニサンシゴロクシチハチキュウジュウバン";

  // const iching = "☰☱☲☳☴☵☶☷木火土金水☯⚊⚋⚌⚍⚎⚏䷀䷁䷂䷃䷄䷅䷆䷇䷈䷉䷊䷋䷌䷍䷎䷏䷐䷑䷒䷓䷔䷕䷖䷗䷘䷙䷚䷛䷜䷝䷞䷟䷠䷡䷢䷣䷤䷥䷦䷧䷨䷩䷪䷫䷬䷭䷮䷯䷰䷱䷲䷳䷴䷵䷶䷷䷸䷹䷺䷻䷼䷽䷾䷿卦易一二三四五六七八九十";
  // const iching = "☯⚊⚋⚌⚍⚎⚏☰☱☲☳☴☵☶☷";
  // const iching = "☯☰☷☳☵⚌⚏木火土金水卦易一二三四五六七八九十";
  // const iching = "☯⚊⚋⚌⚍⚎⚏☰☱☲☳☴☵☶☷⚊⚋⚌⚍⚎⚏☰☱☲☳☴☵☶☷一二三卦易";
  // const eightBitIChingRain = "☯☯01⚊⚋⚌⚍⚎⚏☰☱☲☳☴☵☶☷卜卦易陰陽";
  // const eightBitIChingRain = "☯01一二三四五六天地水火木金土日月气山川卜☰☱☲☳☴☵☶☷⚊⚋⚌⚍⚎⚏";

  // I Ching elements
  const ichingRadicals = "丨亅丿乙二十厂匚刂冂冖凵卜厶儿匕亠讠廴彳";
  const ichingCore = "☯☰☷☳☵⚌⚏⚊⚋";
  const ichingElements = "木火土金水";
  const ichingNums = "一二三四五六七八九十";

  const latin = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const nums = "0123456789";
  // const binary = "01";

  function generateMatrixRain() {
    // const randomKatakana = getRandomSlice(katakana, 30, 50);
    const randomLatin = getRandomSlice(latin, 5, 13);
    const randomNums = getRandomSlice(nums, 3, 5);
    const randomIchingNums = getRandomSlice(ichingNums, 3, 5);

    return ichingRadicals + ichingCore + ichingElements + randomLatin + randomNums + randomIchingNums;
  }

  // const optimizedMatrixRain = katakana + ichingCore + ichingElements + latin.slice(0, 13) + nums.slice(0, 5) + ichingNums.slice(0, 5);

  const alphabet = generateMatrixRain();

  const fontSize = 16;
  const columns = canvas.width / fontSize;

  const rainDrops: number[] = Array(Math.floor(columns)).fill(1);

  const render = () => {
    context.fillStyle = "rgba(0, 0, 0, 0.05)";
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = color || "#0F0";
    context.font = `${fontSize}px monospace`;

    rainDrops.forEach((drop, i) => {
      const text = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
      context.fillText(text, i * fontSize, drop * fontSize);

      if (drop * fontSize > canvas.height && Math.random() > 0.975) {
        rainDrops[i] = 0;
      }
      rainDrops[i]++;
    });
  };

  return render;
};

const MatrixRainingLetters: React.FC<MatrixRainingLettersProps> = ({ color, customClass, keyProp }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const keyName = `mrl-${keyProp}`;

  useEffect(() => {
    const render = renderMatrix(ref, color);
    const intervalId = setInterval(render, 50);
    return () => clearInterval(intervalId);
  }, [color]);

  return (
    <canvas
      key={keyName}
      className={`bg-dynasty-foreground dark:bg-black bg-opacity-5 ${customClass || ""}`}
      ref={ref}
    />
  );
};

export default MatrixRainingLetters;