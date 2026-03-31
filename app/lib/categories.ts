export const CATEGORIES = [
  { emoji: "🍜", label: "따뜻한 국물", color: "#ff6b35" },
  { emoji: "🍖", label: "고기", color: "#e74c3c" },
  { emoji: "🍣", label: "일식", color: "#3498db" },
  { emoji: "🍝", label: "양식", color: "#2ecc71" },
  { emoji: "🥗", label: "가벼운 샐러드", color: "#1abc9c" },
  { emoji: "🍛", label: "카레/덮밥", color: "#f39c12" },
  { emoji: "🍜", label: "면 요리", color: "#9b59b6" },
  { emoji: "🌮", label: "분식", color: "#e67e22" },
  { emoji: "🍱", label: "한정식/백반", color: "#27ae60" },
  { emoji: "🍕", label: "피자/버거", color: "#c0392b" },
  { emoji: "🥟", label: "중식", color: "#d35400" },
  { emoji: "🌯", label: "샌드위치", color: "#16a085" },
];

export type Category = (typeof CATEGORIES)[number];
