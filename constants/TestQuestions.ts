export interface Answer {
  text: string;
  score: number;
}

export interface Question {
  text: string;
  answers: Answer[];
}

export const GAD7_QUESTIONS: Question[] = [
  {
    text: "Cảm thấy lo lắng, bồn chồn hoặc đứng ngồi không yên",
    answers: [
      { text: "Không hề", score: 0 },
      { text: "Vài ngày", score: 1 },
      { text: "Hơn một nửa số ngày", score: 2 },
      { text: "Gần như mọi ngày", score: 3 },
    ]
  },
  {
    text: "Không thể ngừng hoặc kiểm soát sự lo lắng",
    answers: [
      { text: "Không hề", score: 0 },
      { text: "Vài ngày", score: 1 },
      { text: "Hơn một nửa số ngày", score: 2 },
      { text: "Gần như mọi ngày", score: 3 },
    ]
  },
];

export const PHQ9_QUESTIONS: Question[] = [
  {
    text: "Ít hứng thú hoặc niềm vui khi làm việc gì đó",
    answers: [
      { text: "Không hề", score: 0 },
      { text: "Vài ngày", score: 1 },
      { text: "Hơn một nửa số ngày", score: 2 },
      { text: "Gần như mọi ngày", score: 3 },
    ]
  },
];