export interface Answer {
  text: string;
  score: number;
}

export interface Question {
  id: string;
  text: string;
  answers: Answer[];
}

export interface PsychTest {
  id: string;
  title: string;
  description: string;
  icon: string; 
  questions?: Question[]; 
}

export interface Article {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  duration: string;
  isFeatured: boolean;
  content: string;
}

export interface HabitModel {
  id: number;
  title: string;
  description: string;
  iconName: string;
}

const phq9Answers: Answer[] = [
  { text: 'Hoàn toàn không', score: 0 },
  { text: 'Vài ngày', score: 1 },
  { text: 'Hơn một nửa số ngày', score: 2 },
  { text: 'Gần như mỗi ngày', score: 3 },
];

const pss10AnswersNegative: Answer[] = [
  { text: 'Không bao giờ', score: 0 },
  { text: 'Hầu như không', score: 1 },
  { text: 'Thỉnh thoảng', score: 2 },
  { text: 'Khá thường xuyên', score: 3 },
  { text: 'Rất thường xuyên', score: 4 },
];

const pss10AnswersPositive: Answer[] = [
  { text: 'Không bao giờ', score: 4 },
  { text: 'Hầu như không', score: 3 },
  { text: 'Thỉnh thoảng', score: 2 },
  { text: 'Khá thường xuyên', score: 1 },
  { text: 'Rất thường xuyên', score: 0 },
];


export const phq9Questions: Question[] = [
  { id: 'q1', text: 'Ít quan tâm hoặc không còn hứng thú làm bất cứ việc gì', answers: phq9Answers },
  { id: 'q2', text: 'Cảm thấy chán nản, thất vọng hoặc tuyệt vọng', answers: phq9Answers },
  { id: 'q3', text: 'Khó ngủ, ngủ không yên giấc, hoặc ngủ quá nhiều', answers: phq9Answers },
  { id: 'q4', text: 'Cảm thấy mệt mỏi hoặc thiếu năng lượng', answers: phq9Answers },
  { id: 'q5', text: 'Ăn không ngon miệng hoặc ăn quá nhiều', answers: phq9Answers },
  { id: 'q6', text: 'Cảm thấy tồi tệ về bản thân - hoặc bạn là người thất bại', answers: phq9Answers },
  { id: 'q7', text: 'Khó tập trung vào mọi việc, ví dụ như đọc báo hoặc xem TV', answers: phq9Answers },
  { id: 'q8', text: 'Di chuyển hoặc nói năng quá chậm, hoặc quá bồn chồn', answers: phq9Answers },
  { id: 'q9', text: 'Nghĩ rằng thà chết còn hơn, hoặc muốn tự làm hại bản thân', answers: phq9Answers },
];

export const gad7Questions: Question[] = [
  { id: 'g1', text: 'Cảm thấy bồn chồn, lo lắng, hoặc căng thẳng', answers: phq9Answers },
  { id: 'g2', text: 'Không thể dừng lại hoặc kiểm soát được sự lo lắng', answers: phq9Answers },
  { id: 'g3', text: 'Lo lắng quá nhiều về những điều khác nhau', answers: phq9Answers },
  { id: 'g4', text: 'Khó thư giãn, thả lỏng', answers: phq9Answers },
  { id: 'g5', text: 'Cảm thấy bồn chồn đến mức khó có thể ngồi yên', answers: phq9Answers },
  { id: 'g6', text: 'Trở nên dễ cáu kỉnh hoặc khó chịu', answers: phq9Answers },
  { id: 'g7', text: 'Cảm thấy sợ hãi như thể có điều gì đó tồi tệ sắp xảy ra', answers: phq9Answers },
];

export const pss10Questions: Question[] = [
  { id: 'p1', text: 'Cảm thấy bực bội vì những điều xảy ra bất ngờ?', answers: pss10AnswersNegative },
  { id: 'p2', text: 'Cảm thấy không thể kiểm soát những điều quan trọng?', answers: pss10AnswersNegative },
  { id: 'p3', text: 'Cảm thấy căng thẳng và bối rối?', answers: pss10AnswersNegative },
  { id: 'p4', text: 'Cảm thấy tự tin về khả năng xử lý vấn đề cá nhân?', answers: pss10AnswersPositive }, 
  { id: 'p5', text: 'Cảm thấy mọi việc đang diễn ra theo ý mình?', answers: pss10AnswersPositive }, 
  { id: 'p6', text: 'Thấy mình không thể giải quyết hết việc phải làm?', answers: pss10AnswersNegative },
  { id: 'p7', text: 'Có thể kiểm soát được sự bực bội?', answers: pss10AnswersPositive }, 
  { id: 'p8', text: 'Cảm thấy mình đang làm chủ mọi thứ?', answers: pss10AnswersPositive },
  { id: 'p9', text: 'Tức giận vì những điều ngoài tầm kiểm soát?', answers: pss10AnswersNegative },
  { id: 'p10', text: 'Cảm thấy khó khăn chồng chất không thể vượt qua?', answers: pss10AnswersNegative },
];

export const mockTests: PsychTest[] = [
  {
    id: 't1',
    title: 'Bài Test Trầm Cảm (PHQ-9)',
    description: 'Đánh giá 9 triệu chứng trầm cảm trong 2 tuần qua.',
    icon: 'emoticon-sad-outline', 
    questions: phq9Questions
  },
  {
    id: 't2',
    title: 'Rối Loạn Lo Âu (GAD-7)',
    description: 'Kiểm tra 7 triệu chứng phổ biến của rối loạn lo âu.',
    icon: 'emoticon-neutral-outline',
    questions: gad7Questions
  },
  {
    id: 't3',
    title: 'Mức Độ Stress (PSS-10)',
    description: 'Đo lường mức độ căng thẳng bạn cảm nhận gần đây.',
    icon: 'speedometer',
    questions: pss10Questions
  },
  {
    id: 't4',
    title: 'Chất Lượng Giấc Ngủ (PSQI)',
    description: 'Đánh giá chất lượng và thói quen giấc ngủ.',
    icon: 'bed-clock',
    questions: [] 
  },
];

export const mockHabits: HabitModel[] = [
  { id: 1, title: 'Uống đủ nước', description: 'Uống đủ 8 ly nước mỗi ngày.', iconName: 'water-outline' },
  { id: 2, title: 'Thiền 5 phút', description: 'Tĩnh tâm mỗi sáng.', iconName: 'leaf-outline' },
  { id: 3, title: 'Đọc sách', description: 'Đọc 15 phút để thư giãn.', iconName: 'book-outline' },
  { id: 4, title: 'Đi bộ', description: 'Vận động 30 phút.', iconName: 'walk-outline' },
  { id: 5, title: 'Viết Nhật Ký', description: 'Ghi lại cảm xúc trong ngày.', iconName: 'journal-outline' },
];

export const mockArticles: Article[] = [
  {
    id: '1',
    title: '5 Cách Giảm Stress Hiệu Quả Trước Kỳ Thi',
    category: 'THƯ GIÃN',
    imageUrl: 'https://images.unsplash.com/photo-1517021897933-0e0319cfbc28?w=500', 
    duration: '5 phút đọc',
    isFeatured: true,
    content: `5 Cách Giảm Căng Thẳng Trước Kỳ Thi... (Nội dung dài bro cứ để đây)`
  },
  {
    id: '2',
    title: 'Hiểu Về Chứng Trầm Cảm Ở Sinh Viên',
    category: 'TÂM LÝ HỌC',
    imageUrl: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=500',
    duration: '10 phút đọc',
    isFeatured: true,
    content: `Cảnh giác trầm cảm ở học sinh sinh viên...`
  },
];